import { type NextRequest, NextResponse } from "next/server";
import { musicTransferClient } from "@/lib/providers/musicTransfer/client";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import type {
  MatchReportReadyEventData,
  TransferCompletedEventData,
  TransferCreatedEventData,
  TransferItemFailedEventData,
  TransferProgressEventData,
  WebhookDeliveryEnvelope,
} from "@/lib/providers/musicTransfer/types";

export async function POST(request: NextRequest) {
  const signatureHeader =
    request.headers.get("x-musicapi-signature") ||
    request.headers.get("X-MusicAPI-Signature");
  const eventHeader =
    request.headers.get("x-musicapi-event") ||
    request.headers.get("X-MusicAPI-Event");

  // Read raw body for signature verification before parsing
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
  }

  // Verify HMAC-SHA256 signature
  const isValid = musicTransferClient.verifyWebhookSignature(signatureHeader, rawBody);
  if (!isValid) {
    console.warn("[Webhook] Invalid or expired MusicAPI signature received");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let envelope: WebhookDeliveryEnvelope;
  try {
    envelope = JSON.parse(rawBody) as WebhookDeliveryEnvelope;
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
  }

  const eventType = envelope.event || eventHeader || "unknown";
  const data = envelope.data as Record<string, unknown> | undefined;
  const transferUuid = (data?.transferUuid || data?.transfer_uuid) as string | undefined;

  // Use service role admin client to write webhook audit events and update transfers
  const adminClient = getSupabaseAdminClient();

  if (adminClient && transferUuid) {
    try {
      // Find matching transfer
      const { data: transfer } = await adminClient
        .from("import_transfers")
        .select("id, status, imported_items, failed_items, total_items")
        .eq("provider_transfer_id", transferUuid)
        .single();

      if (transfer) {
        // Idempotency check: has this exact event already been recorded for this transfer?
        const { data: existingEvents } = await adminClient
          .from("import_transfer_events")
          .select("id, payload")
          .eq("transfer_id", transfer.id)
          .eq("event_type", eventType);

        const isDuplicate = existingEvents?.some((e) => {
          const p = e.payload as Record<string, unknown>;
          const pData = p?.data as Record<string, unknown> | undefined;
          return (
            p?.createdAt === envelope.createdAt ||
            (data?.pct !== undefined && pData?.pct === data.pct)
          );
        });

        if (isDuplicate) {
          return NextResponse.json({ received: true, duplicate: true });
        }

        // Record raw audit event
        await adminClient.from("import_transfer_events").insert({
          transfer_id: transfer.id,
          event_type: eventType,
          payload: envelope as unknown as Json,
        });

        // Update import_transfers status/counts
        const now = new Date().toISOString();
        if (eventType === "transfer.created") {
          const createdData = data as unknown as TransferCreatedEventData;
          await adminClient
            .from("import_transfers")
            .update({
              status: "in_progress",
              total_items: createdData.totalItems || transfer.total_items,
              updated_at: now,
            })
            .eq("id", transfer.id);
        } else if (eventType === "transfer.progress") {
          const progressData = data as unknown as TransferProgressEventData;
          await adminClient
            .from("import_transfers")
            .update({
              status: "in_progress",
              imported_items: progressData.processedItems || transfer.imported_items,
              total_items: progressData.totalItems || transfer.total_items,
              updated_at: now,
            })
            .eq("id", transfer.id);
        } else if (eventType === "transfer.completed") {
          const completedData = data as unknown as TransferCompletedEventData;
          await adminClient
            .from("import_transfers")
            .update({
              status: completedData.status === "failed" ? "failed" : "completed",
              imported_items: completedData.matchedItems ?? transfer.imported_items,
              failed_items:
                (completedData.unmatchedItems || 0) + (completedData.failedItems || 0),
              total_items: completedData.totalItems || transfer.total_items,
              updated_at: now,
            })
            .eq("id", transfer.id);
        } else if (eventType === "transfer.failed") {
          await adminClient
            .from("import_transfers")
            .update({
              status: "failed",
              updated_at: now,
            })
            .eq("id", transfer.id);
        } else if (eventType === "transfer.item_failed") {
          const itemFailedData = data as unknown as TransferItemFailedEventData;
          const newlyFailed = itemFailedData.newlyFailedCount || itemFailedData.items?.length || 1;
          await adminClient
            .from("import_transfers")
            .update({
              failed_items: (transfer.failed_items || 0) + newlyFailed,
              updated_at: now,
            })
            .eq("id", transfer.id);
        } else if (eventType === "transfer.cancelled") {
          await adminClient
            .from("import_transfers")
            .update({
              status: "cancelled",
              updated_at: now,
            })
            .eq("id", transfer.id);
        } else if (eventType === "match.report_ready") {
          const reportData = data as unknown as MatchReportReadyEventData;
          await adminClient
            .from("import_transfers")
            .update({
              imported_items: reportData.matchedItems ?? transfer.imported_items,
              failed_items:
                (reportData.unmatchedItems || 0) + (reportData.failedItems || 0),
              updated_at: now,
            })
            .eq("id", transfer.id);
        }
      }
    } catch (dbErr) {
      console.error("[Webhook] Failed to update transfer in DB:", dbErr);
    }
  }

  return NextResponse.json({ received: true });
}
