import { type NextRequest, NextResponse } from "next/server";
import {
  normalizePlaylist,
  normalizeTrack,
  type RawJamendoPlaylist,
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
    return jsonError("BAD_REQUEST", "Playlist ID is required", 400);
  }

  try {
    const res = await fetchFromJamendo<{
      results: (RawJamendoPlaylist & { tracks?: RawJamendoTrack[] })[];
    }>("/playlists/tracks", { id, audioformat: "mp32" }, 3600);

    if (res.error) {
      return jsonError("UPSTREAM_ERROR", res.error.message, res.error.status);
    }

    const rawPlaylist = res.data?.results?.[0];
    if (!rawPlaylist) {
      return jsonError("NOT_FOUND", `Playlist with ID ${id} not found`, 404);
    }

    const tracks = (rawPlaylist.tracks || []).map((t) => normalizeTrack(t));
    const playlist = normalizePlaylist(rawPlaylist, tracks);

    return NextResponse.json(playlist);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch playlist";
    return jsonError("INTERNAL_ERROR", message, 500);
  }
}
