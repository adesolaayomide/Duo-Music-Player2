import { type NextRequest, NextResponse } from "next/server";
import {
  normalizeAlbum,
  normalizeTrack,
  type RawJamendoAlbum,
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
    return jsonError("BAD_REQUEST", "Album ID is required", 400);
  }

  try {
    const res = await fetchFromJamendo<{
      results: (RawJamendoAlbum & { tracks?: RawJamendoTrack[] })[];
    }>("/albums/tracks", { id, audioformat: "mp32" }, 86400);

    if (res.error) {
      return jsonError("UPSTREAM_ERROR", res.error.message, res.error.status);
    }

    const rawAlbum = res.data?.results?.[0];
    if (!rawAlbum) {
      return jsonError("NOT_FOUND", `Album with ID ${id} not found`, 404);
    }

    const tracks = (rawAlbum.tracks || []).map((t) =>
      normalizeTrack({
        ...t,
        album_id: rawAlbum.id,
        album_name: rawAlbum.name,
        album_image: rawAlbum.image,
        artist_id: rawAlbum.artist_id,
        artist_name: rawAlbum.artist_name,
      }),
    );

    const album = normalizeAlbum(rawAlbum, tracks);
    return NextResponse.json(album);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch album";
    return jsonError("INTERNAL_ERROR", message, 500);
  }
}
