import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

interface DecodedCallbackData {
  integrationUserUUID?: string;
  authModel?: {
    uuid?: string;
    status?: "success" | "error" | "initialised";
    error?: string | null;
  };
  integration?: {
    type?: string;
    returnUrl?: string;
  };
  error?: string;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const data64 = url.searchParams.get("data64");
  const directError = url.searchParams.get("error");

  const targetSettingsUrl = new URL("/settings/connections", url.origin);

  if (directError) {
    targetSettingsUrl.searchParams.set("error", directError);
    return NextResponse.redirect(targetSettingsUrl);
  }

  if (!data64) {
    targetSettingsUrl.searchParams.set("error", "missing_callback_data");
    return NextResponse.redirect(targetSettingsUrl);
  }

  let decoded: DecodedCallbackData;
  try {
    const jsonString = Buffer.from(data64, "base64").toString("utf-8");
    decoded = JSON.parse(jsonString) as DecodedCallbackData;
  } catch {
    targetSettingsUrl.searchParams.set("error", "invalid_callback_payload");
    return NextResponse.redirect(targetSettingsUrl);
  }

  if (decoded.authModel?.status === "error" || decoded.error) {
    const errorMsg = decoded.authModel?.error || decoded.error || "Authentication failed";
    targetSettingsUrl.searchParams.set("error", errorMsg);
    return NextResponse.redirect(targetSettingsUrl);
  }

  const externalAccountId = decoded.integrationUserUUID;
  const provider = decoded.integration?.type || "unknown";

  if (!externalAccountId) {
    targetSettingsUrl.searchParams.set("error", "missing_external_account_id");
    return NextResponse.redirect(targetSettingsUrl);
  }

  // Attempt to save to Supabase if configured and user is logged in
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Enforce the 5 connected accounts limit per user
      const { count } = await supabase
        .from("connected_accounts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "connected");

      if (count && count >= 5) {
        targetSettingsUrl.searchParams.set(
          "error",
          "Sandbox limit reached: Maximum 5 connected accounts permitted."
        );
        return NextResponse.redirect(targetSettingsUrl);
      }

      // Upsert connected account record
      const { error: dbError } = await supabase.from("connected_accounts").upsert(
        {
          user_id: user.id,
          provider,
          external_account_id: externalAccountId,
          status: "connected",
          connected_at: new Date().toISOString(),
          revoked_at: null,
        },
        { onConflict: "user_id,provider,external_account_id" }
      );

      if (dbError) {
        console.error("Failed to store connected account:", dbError);
        targetSettingsUrl.searchParams.set("error", "failed_to_save_connection");
        return NextResponse.redirect(targetSettingsUrl);
      }
    }
  }

  targetSettingsUrl.searchParams.set("connected", "true");
  targetSettingsUrl.searchParams.set("provider", provider);
  targetSettingsUrl.searchParams.set("account_id", externalAccountId);

  return NextResponse.redirect(targetSettingsUrl);
}
