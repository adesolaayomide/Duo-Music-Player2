import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { jsonTransferError } from "@/lib/server/transferApi";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const transferId = url.searchParams.get("transferId");

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ transfers: [] });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonTransferError("UNAUTHORIZED", "Please sign in to view transfer status", 401);
  }

  if (transferId) {
    const { data: transfer, error } = await supabase
      .from("import_transfers")
      .select("*, import_transfer_events(*)")
      .eq("id", transferId)
      .eq("user_id", user.id)
      .single();

    if (error || !transfer) {
      return jsonTransferError("NOT_FOUND", "Transfer not found", 404);
    }

    return NextResponse.json({ transfer });
  }

  const { data: transfers, error } = await supabase
    .from("import_transfers")
    .select("*, import_transfer_events(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return jsonTransferError("INTERNAL_ERROR", error.message, 500);
  }

  return NextResponse.json({ transfers: transfers || [] });
}
