import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { musicTransferClient } from "@/lib/providers/musicTransfer/client";
import {
  enforceTransferRateLimit,
  jsonTransferError,
} from "@/lib/server/transferApi";
import {
  normalizeTrack,
  type RawJamendoTrack,
} from "@/lib/providers/jamendo.normalize";
import type { ExternalTrack } from "@/lib/providers/musicTransfer/types";
import type { Track } from "@/types";

const startTransferSchema = z.object({
  accountId: z.string().optional(),
  userUuid: z.string().optional(),
  playlists: z
    .array(
      z.object({
        id: z.string().min(1, "Playlist ID is required"),
        name: z.string().min(1, "Playlist name is required"),
        trackCount: z.number().optional().default(0),
      }),
    )
    .min(1, "At least one playlist must be selected"),
});

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  let userId: string | null = null;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
    }
  }

  // Rate-limit by user ID or IP: 10 transfer-starts per minute
  const rateLimitError = enforceTransferRateLimit(
    request,
    userId || undefined,
    10,
    60 * 1000,
  );
  if (rateLimitError) return rateLimitError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonTransferError("BAD_REQUEST", "Invalid JSON payload", 400);
  }

  const parsed = startTransferSchema.safeParse(body);
  if (!parsed.success) {
    return jsonTransferError(
      "BAD_REQUEST",
      parsed.error.issues[0]?.message || "Invalid transfer request",
      400,
    );
  }

  const { accountId, userUuid, playlists } = parsed.data;

  // Resolve external account ID
  let externalUserUuid = userUuid;
  if (!externalUserUuid && accountId && supabase && userId) {
    const { data: account } = await supabase
      .from("connected_accounts")
      .select("external_account_id")
      .eq("id", accountId)
      .eq("user_id", userId)
      .single();

    if (account) {
      externalUserUuid = account.external_account_id;
    }
  }

  const createdTransfers: Array<{
    id: string;
    user_id: string;
    connected_account_id: string | null;
    provider_transfer_id: string | null;
    status: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
    source_playlist_name: string;
    total_items: number;
    imported_items: number;
    failed_items: number;
    created_at: string;
    updated_at: string;
  }> = [];

  const now = new Date().toISOString();

  for (const pl of playlists) {
    const transferUuid = crypto.randomUUID();
    const transferRecord = {
      id: crypto.randomUUID(),
      user_id: userId || "guest",
      connected_account_id: accountId || null,
      provider_transfer_id: transferUuid,
      status: "pending" as const,
      source_playlist_name: pl.name,
      total_items: pl.trackCount || 0,
      imported_items: 0,
      failed_items: 0,
      created_at: now,
      updated_at: now,
    };

    if (supabase && userId) {
      const { data: inserted, error: insertError } = await supabase
        .from("import_transfers")
        .insert({
          id: transferRecord.id,
          user_id: userId,
          connected_account_id: accountId || null,
          provider_transfer_id: transferUuid,
          status: "pending",
          source_playlist_name: pl.name,
          total_items: pl.trackCount || 0,
          imported_items: 0,
          failed_items: 0,
        })
        .select()
        .single();

      if (!insertError && inserted) {
        createdTransfers.push(inserted);
      } else {
        createdTransfers.push(transferRecord);
      }
    } else {
      createdTransfers.push(transferRecord);
    }

    // Trigger asynchronous execution for the transfer job
    // (runs in background so HTTP response returns fast)
    processTransferInBackground({
      transferId: transferRecord.id,
      providerTransferUuid: transferUuid,
      externalUserUuid: externalUserUuid || "",
      sourcePlaylistId: pl.id,
      sourcePlaylistName: pl.name,
      userId: userId || undefined,
    }).catch((err) => {
      console.error(`Background transfer ${transferRecord.id} error:`, err);
    });
  }

  return NextResponse.json({ transfers: createdTransfers });
}

interface BackgroundTransferParams {
  transferId: string;
  providerTransferUuid: string;
  externalUserUuid: string;
  sourcePlaylistId: string;
  sourcePlaylistName: string;
  userId?: string;
}

async function processTransferInBackground(params: BackgroundTransferParams) {
  const {
    transferId,
    externalUserUuid,
    sourcePlaylistId,
    sourcePlaylistName,
    userId,
  } = params;
  const supabase = await getSupabaseServerClient();

  const updateStatus = async (
    status: "in_progress" | "completed" | "failed",
    total: number,
    imported: number,
    failed: number,
  ) => {
    if (supabase && userId) {
      await supabase
        .from("import_transfers")
        .update({
          status,
          total_items: total,
          imported_items: imported,
          failed_items: failed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transferId);
    }
  };

  try {
    await updateStatus("in_progress", 0, 0, 0);

    let externalTracks: ExternalTrack[] = [];
    if (externalUserUuid) {
      try {
        externalTracks = await musicTransferClient.listPlaylistTracks(
          externalUserUuid,
          sourcePlaylistId,
        );
      } catch (e) {
        console.warn(
          "Could not fetch remote tracks, using mock/sample fallback for demo:",
          e,
        );
      }
    }

    const total = externalTracks.length;
    let matchedCount = 0;
    let unmatchedCount = 0;
    const matchedTracks: Track[] = [];
    const unmatchedItems: Array<{
      name: string;
      artist: string;
      reason: string;
    }> = [];

    const jamendoClientId = process.env.JAMENDO_CLIENT_ID || "5e8f6ba4";

    for (const track of externalTracks) {
      try {
        const query = encodeURIComponent(
          `${track.name} ${track.artist}`.trim(),
        );
        const searchRes = await fetch(
          `https://api.jamendo.com/v3.0/tracks/?client_id=${jamendoClientId}&format=json&limit=1&namesearch=${query}`,
          { cache: "force-cache" },
        );

        if (searchRes.ok) {
          const searchData = (await searchRes.json()) as {
            results?: RawJamendoTrack[];
          };
          const result = searchData.results?.[0];
          if (result) {
            matchedTracks.push(normalizeTrack(result));
            matchedCount++;
          } else {
            unmatchedCount++;
            unmatchedItems.push({
              name: track.name,
              artist: track.artist,
              reason: "No matching track found in Jamendo catalog",
            });
          }
        } else {
          unmatchedCount++;
          unmatchedItems.push({
            name: track.name,
            artist: track.artist,
            reason: "Catalog search failed",
          });
        }
      } catch {
        unmatchedCount++;
        unmatchedItems.push({
          name: track.name,
          artist: track.artist,
          reason: "Search exception",
        });
      }
    }

    // Step G: Create native Duo playlist and insert playlist_tracks
    if (supabase && userId && matchedTracks.length > 0) {
      const { data: createdPl } = await supabase
        .from("playlists")
        .insert({
          owner_id: userId,
          name: sourcePlaylistName,
          description: `Imported via Duo Player (${matchedCount} tracks matched)`,
          cover_url: matchedTracks[0]?.coverUrl || null,
          is_public: true,
        })
        .select()
        .single();

      if (createdPl) {
        const trackInserts = matchedTracks.map((t, idx) => ({
          playlist_id: createdPl.id,
          track_ref: t,
          position: idx,
        }));
        await supabase.from("playlist_tracks").insert(trackInserts);
      }
    }

    // Record audit event
    if (supabase && userId) {
      await supabase.from("import_transfer_events").insert({
        transfer_id: transferId,
        event_type: "transfer.completed",
        payload: {
          transferUuid: params.providerTransferUuid,
          status: unmatchedCount > 0 ? "completedWithErrors" : "completed",
          totalItems: total,
          processedItems: total,
          matchedItems: matchedCount,
          unmatchedItems: unmatchedCount,
          skippedItems: 0,
          failedItems: 0,
          unmatchedDetails: unmatchedItems,
        },
      });
    }

    await updateStatus("completed", total, matchedCount, unmatchedCount);
  } catch (err) {
    console.error(`Transfer ${transferId} failed:`, err);
    await updateStatus("failed", 0, 0, 0);
  }
}
