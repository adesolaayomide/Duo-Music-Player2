import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  normalizeAlbum,
  normalizeArtist,
  normalizeTrack,
  type RawJamendoAlbum,
  type RawJamendoArtist,
  type RawJamendoTrack,
} from "@/lib/providers/jamendo.normalize";
import {
  enforceRateLimit,
  fetchFromJamendo,
  jsonError,
} from "@/lib/server/jamendoApi";

const searchSchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, "Search query is required")
    .max(100, "Query too long"),
  type: z.enum(["all", "tracks", "albums", "artists"]).default("all"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  const rateLimitResponse = enforceRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const url = new URL(request.url);
  const parsed = searchSchema.safeParse({
    q: url.searchParams.get("q"),
    type: url.searchParams.get("type") || "all",
    limit: url.searchParams.get("limit") || 20,
  });

  if (!parsed.success) {
    return jsonError(
      "BAD_REQUEST",
      parsed.error.issues[0]?.message || "Invalid parameters",
      400,
    );
  }

  const { q, type, limit } = parsed.data;

  try {
    const promises: [
      Promise<{ data?: { results: RawJamendoTrack[] } } | null>,
      Promise<{ data?: { results: RawJamendoAlbum[] } } | null>,
      Promise<{ data?: { results: RawJamendoArtist[] } } | null>,
    ] = [
      type === "all" || type === "tracks"
        ? fetchFromJamendo<{ results: RawJamendoTrack[] }>(
            "/tracks",
            {
              namesearch: q,
              limit,
              include: "musicinfo+licenses",
              order: "popularity_total",
            },
            300,
          )
        : Promise.resolve(null),
      type === "all" || type === "albums"
        ? fetchFromJamendo<{ results: RawJamendoAlbum[] }>(
            "/albums",
            { namesearch: q, limit, order: "popularity_total" },
            300,
          )
        : Promise.resolve(null),
      type === "all" || type === "artists"
        ? fetchFromJamendo<{ results: RawJamendoArtist[] }>(
            "/artists",
            { namesearch: q, limit, order: "popularity_total" },
            300,
          )
        : Promise.resolve(null),
    ];

    const [tracksRes, albumsRes, artistsRes] = await Promise.all(promises);

    const tracks = (tracksRes?.data?.results || []).map((t) =>
      normalizeTrack(t),
    );
    const albums = (albumsRes?.data?.results || []).map((a) =>
      normalizeAlbum(a),
    );
    const artists = (artistsRes?.data?.results || []).map((ar) =>
      normalizeArtist(ar),
    );

    return NextResponse.json({
      tracks,
      albums,
      artists,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return jsonError("INTERNAL_ERROR", message, 500);
  }
}
