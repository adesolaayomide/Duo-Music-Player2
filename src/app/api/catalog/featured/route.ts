import { type NextRequest, NextResponse } from "next/server";
import {
  normalizeAlbum,
  normalizePlaylist,
  normalizeTrack,
  type RawJamendoAlbum,
  type RawJamendoPlaylist,
  type RawJamendoTrack,
} from "@/lib/providers/jamendo.normalize";
import {
  enforceRateLimit,
  fetchFromJamendo,
  jsonError,
} from "@/lib/server/jamendoApi";

export async function GET(request: NextRequest) {
  const rateLimitResponse = enforceRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const [tracksRes, albumsRes, playlistsRes] = await Promise.all([
      fetchFromJamendo<{ results: RawJamendoTrack[] }>(
        "/tracks",
        { order: "popularity_week", limit: 24, include: "musicinfo+licenses" },
        3600,
      ),
      fetchFromJamendo<{ results: RawJamendoAlbum[] }>(
        "/albums",
        { order: "popularity_week", limit: 12 },
        3600,
      ),
      fetchFromJamendo<{ results: RawJamendoPlaylist[] }>(
        "/playlists",
        { order: "creationdate_desc", limit: 12 },
        3600,
      ),
    ]);

    const featuredTracks = (tracksRes.data?.results || []).map((t) =>
      normalizeTrack(t),
    );
    const popularAlbums = (albumsRes.data?.results || []).map((a) =>
      normalizeAlbum(a),
    );
    const featuredPlaylists = (playlistsRes.data?.results || []).map((p) =>
      normalizePlaylist(p),
    );

    return NextResponse.json({
      featuredTracks,
      popularAlbums,
      featuredPlaylists,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch featured content";
    return jsonError("INTERNAL_ERROR", message, 500);
  }
}
