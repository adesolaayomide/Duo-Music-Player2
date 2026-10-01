import { NextResponse } from "next/server";
import { checkRateLimit } from "./rateLimit";

const JAMENDO_BASE_URL = "https://api.jamendo.com/v3.0";

export function getJamendoClientId(): string {
  const clientId =
    process.env.JAMENDO_CLIENT_ID || process.env.NEXT_PUBLIC_JAMENDO_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "JAMENDO_CLIENT_ID is not configured in server environment",
    );
  }
  return clientId;
}

export function jsonError(
  code:
    | "BAD_REQUEST"
    | "NOT_FOUND"
    | "RATE_LIMITED"
    | "UPSTREAM_ERROR"
    | "INTERNAL_ERROR",
  message: string,
  status: number,
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

export function enforceRateLimit(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]?.trim() || "local" : "local";
  const result = checkRateLimit(ip);

  if (!result.allowed) {
    return jsonError(
      "RATE_LIMITED",
      "Rate limit exceeded. Please try again later.",
      429,
    );
  }
  return null;
}

export async function fetchFromJamendo<T = unknown>(
  endpoint: string,
  params: Record<string, string | number | undefined>,
  revalidateSeconds: number,
): Promise<{
  data?: T;
  error?: { code: string; message: string; status: number };
}> {
  try {
    const clientId = getJamendoClientId();
    const query = new URLSearchParams();
    query.set("client_id", clientId);
    query.set("format", "json");
    query.set("audioformat", "mp32");

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, String(value));
      }
    }

    const cleanEndpoint = endpoint.startsWith("/")
      ? endpoint.slice(1)
      : endpoint;
    const url = `${JAMENDO_BASE_URL}/${cleanEndpoint}?${query.toString()}`;

    const res = await fetch(url, {
      next: { revalidate: revalidateSeconds },
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return {
        error: {
          code: "UPSTREAM_ERROR",
          message: `Jamendo API returned HTTP ${res.status}`,
          status: res.status >= 500 ? 502 : res.status,
        },
      };
    }

    const json = await res.json();
    if (json.headers?.status === "failed") {
      return {
        error: {
          code: "UPSTREAM_ERROR",
          message: json.headers?.error_message || "Jamendo API request failed",
          status: 502,
        },
      };
    }

    return { data: json };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown upstream error";
    return {
      error: {
        code: "UPSTREAM_ERROR",
        message: msg,
        status: 502,
      },
    };
  }
}
