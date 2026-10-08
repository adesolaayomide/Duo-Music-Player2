import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { musicTransferClient } from "@/lib/providers/musicTransfer/client";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { jsonTransferError } from "@/lib/server/transferApi";

const querySchema = z.object({
  accountId: z.string().optional(),
  userUuid: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    accountId: url.searchParams.get("accountId") || undefined,
    userUuid: url.searchParams.get("userUuid") || undefined,
  });

  if (!parsed.success) {
    return jsonTransferError(
      "BAD_REQUEST",
      parsed.error.issues[0]?.message || "Invalid query parameters",
      400
    );
  }

  let externalUserUuid = parsed.data.userUuid;

  if (!externalUserUuid && parsed.data.accountId) {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: account } = await supabase
          .from("connected_accounts")
          .select("external_account_id")
          .eq("id", parsed.data.accountId)
          .eq("user_id", user.id)
          .single();

        if (account) {
          externalUserUuid = account.external_account_id;
        }
      }
    }
  }

  if (!externalUserUuid) {
    return jsonTransferError(
      "BAD_REQUEST",
      "userUuid or valid accountId parameter is required",
      400
    );
  }

  try {
    const playlists = await musicTransferClient.listSourcePlaylists(externalUserUuid);
    return NextResponse.json({ playlists });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch playlists from provider";
    return jsonTransferError("UPSTREAM_ERROR", message, 502);
  }
}
