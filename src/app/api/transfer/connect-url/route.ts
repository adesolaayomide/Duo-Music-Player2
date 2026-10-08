import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { musicTransferClient } from "@/lib/providers/musicTransfer/client";
import { jsonTransferError } from "@/lib/server/transferApi";

const querySchema = z.object({
  service: z.string().optional(),
  returnUrl: z.string().url().optional(),
  uniqueId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    service: url.searchParams.get("service") || undefined,
    returnUrl: url.searchParams.get("returnUrl") || undefined,
    uniqueId: url.searchParams.get("uniqueId") || undefined,
  });

  if (!parsed.success) {
    return jsonTransferError(
      "BAD_REQUEST",
      parsed.error.issues[0]?.message || "Invalid query parameters",
      400
    );
  }

  const defaultReturnUrl = `${url.origin}/api/transfer/callback`;
  const returnUrl = parsed.data.returnUrl || defaultReturnUrl;

  try {
    const connectUrl = musicTransferClient.getConnectUrl({
      service: parsed.data.service,
      returnUrl,
      uniqueId: parsed.data.uniqueId,
    });

    return NextResponse.json({ url: connectUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate connect URL";
    return jsonTransferError("INTERNAL_ERROR", message, 500);
  }
}
