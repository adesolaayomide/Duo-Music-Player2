import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { musicTransferClient } from "@/lib/providers/musicTransfer/client";
import { jsonTransferError } from "@/lib/server/transferApi";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return jsonTransferError("BAD_REQUEST", "Account ID is required", 400);
  }

  const supabase = await getSupabaseServerClient();
  let externalAccountId: string | null = null;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonTransferError("UNAUTHORIZED", "Please sign in to disconnect account", 401);
    }

    const { data: account, error: findError } = await supabase
      .from("connected_accounts")
      .select("id, external_account_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (findError || !account) {
      return jsonTransferError("NOT_FOUND", "Connected account not found", 404);
    }

    externalAccountId = account.external_account_id;

    // Call provider revoke endpoint
    if (externalAccountId) {
      try {
        await musicTransferClient.revokeConnection(externalAccountId);
      } catch (err) {
        console.error("Upstream revoke failed (continuing local update):", err);
      }
    }

    // Mark row as revoked
    const { error: updateError } = await supabase
      .from("connected_accounts")
      .update({
        status: "revoked",
        revoked_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      return jsonTransferError("INTERNAL_ERROR", updateError.message, 500);
    }
  } else {
    // If Supabase is not configured (e.g. testing / guest mode), call provider if external ID was passed in header/query
    const fallbackExternalId = request.nextUrl.searchParams.get("external_id") || id;
    try {
      await musicTransferClient.revokeConnection(fallbackExternalId);
    } catch (err) {
      console.error("Provider revoke error:", err);
    }
  }

  return NextResponse.json({ success: true, revoked: true });
}
