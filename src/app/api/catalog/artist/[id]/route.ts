import { type NextRequest, NextResponse } from "next/server";
import {
  normalizeAlbum,
  normalizeArtist,
  normalizeTrack,
  type RawJamendoAlbum,
  type RawJamendoArtist,
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
    return jsonError("BAD_REQUEST", "Artist ID is required", 400);
  }

  try {
    const [artistRes, tracksRes, albumsRes] = await Promise.all([
      fetchFromJamendo<{ results: RawJamendoArtist[] }>(
        "/artists",
        { id },
        86400,
      ),
      fetchFromJamendo<{ results: RawJamendoTrack[] }>(
        "/tracks",
        {
          artist_id: id,
          order: "popularity_total",
          limit: 10,
          include: "musicinfo+licenses",
        },
        86400,
      ),
      fetchFromJamendo<{ results: RawJamendoAlbum[] }>(
        "/albums",
        { artist_id: id, order: "releasedate_desc", limit: 20 },
        86400,
      ),
    ]);

    if (artistRes.error) {
      return jsonError(
        "UPSTREAM_ERROR",
        artistRes.error.message,
        artistRes.error.status,
      );
    }

    const rawArtist = artistRes.data?.results?.[0];
    if (!rawArtist) {
      return jsonError("NOT_FOUND", `Artist with ID ${id} not found`, 404);
    }

    const topTracks = (tracksRes.data?.results || []).map((t) =>
      normalizeTrack(t),
    );
    const albums = (albumsRes.data?.results || []).map((a) =>
      normalizeAlbum(a),
    );

    const artist = normalizeArtist(rawArtist, topTracks, albums);
    return NextResponse.json(artist);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch artist";
    return jsonError("INTERNAL_ERROR", message, 500);
  }
}
