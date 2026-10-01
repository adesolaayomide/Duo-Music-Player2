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
  { params }: { params: Promise<{ tag: string }> },
) {
  const rateLimitResponse = enforceRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const { tag } = await params;
  if (!tag || tag.trim() === "") {
    return jsonError("BAD_REQUEST", "Genre/tag parameter is required", 400);
  }

  const cleanTag = decodeURIComponent(tag).toLowerCase().trim();

  try {
    const res = await fetchFromJamendo<{ results: RawJamendoTrack[] }>(
      "/tracks",
      {
        fuzzytags: cleanTag,
        order: "popularity_month",
        limit: 30,
        include: "musicinfo+licenses",
      },
      3600,
    );

    if (res.error) {
      return jsonError("UPSTREAM_ERROR", res.error.message, res.error.status);
    }

    const tracks = (res.data?.results || []).map((t) => normalizeTrack(t));
    return NextResponse.json(tracks);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch genre tracks";
    return jsonError("INTERNAL_ERROR", message, 500);
  }
}
