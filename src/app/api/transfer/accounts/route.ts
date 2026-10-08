import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { jsonTransferError } from "@/lib/server/transferApi";

export async function GET(_request: NextRequest) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    // If Supabase is not configured (e.g. guest mode fallback), return empty array so client store can provide local data
    return NextResponse.json({ accounts: [] });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonTransferError("UNAUTHORIZED", "Please sign in to view connected accounts", 401);
  }

  const { data: accounts, error } = await supabase
    .from("connected_accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("connected_at", { ascending: false });

  if (error) {
    return jsonTransferError("INTERNAL_ERROR", error.message, 500);
  }

  return NextResponse.json({ accounts: accounts || [] });
}
