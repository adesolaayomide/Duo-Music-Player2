import { type NextRequest, NextResponse } from "next/server";
import {
  normalizeTrack,
  type RawJamendoTrack,
} from "@/lib/providers/jamendo.normalize";
import {
  enforceRateLimit,
  fetchFromJamendo,
  jsonError,
} from "@/lib/server/jamendoApi";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimitResponse = enforceRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  if (!id || id.trim() === "") {
    return jsonError("BAD_REQUEST", "Track ID is required", 400);
  }

  try {
    const res = await fetchFromJamendo<{ results: RawJamendoTrack[] }>(
      "/tracks",
      { id, include: "musicinfo+licenses" },
      86400,
    );

    if (res.error) {
      return jsonError("UPSTREAM_ERROR", res.error.message, res.error.status);
    }

    const rawTrack = res.data?.results?.[0];
    if (!rawTrack) {
      return jsonError("NOT_FOUND", `Track with ID ${id} not found`, 404);
    }

    const track = normalizeTrack(rawTrack);
    return NextResponse.json(track);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch track";
    return jsonError("INTERNAL_ERROR", message, 500);
  }
}
