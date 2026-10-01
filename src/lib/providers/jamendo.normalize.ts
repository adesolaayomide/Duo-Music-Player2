import type { Album, Artist, Playlist, Track } from "@/types";

// Common HTML entities map
const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#039;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&copy;": "©",
  "&reg;": "®",
  "&trade;": "™",
  "&hellip;": "…",
  "&ndash;": "–",
  "&mdash;": "—",
  "&rsquo;": "'",
  "&lsquo;": "'",
  "&rdquo;": '"',
  "&ldquo;": '"',
  "&eacute;": "é",
  "&egrave;": "è",
  "&ecirc;": "ê",
  "&agrave;": "à",
  "&acirc;": "â",
  "&ccedil;": "ç",
  "&icirc;": "î",
  "&ocirc;": "ô",
  "&ugrave;": "ù",
  "&ucirc;": "û",
  "&uuml;": "ü",
  "&ouml;": "ö",
  "&auml;": "ä",
};

/**
 * SSR-safe HTML entity decoder without DOM dependency
 */
export function decodeHtml(str?: string | null): string {
  if (!str) return "";
  let result = str;

  // Replace named entities
  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    if (result.includes(entity)) {
      result = result.replaceAll(entity, char);
    }
  }

  // Replace numeric decimal entities &#123;
  result = result.replace(/&#(\d+);/g, (_, code) => {
    try {
      return String.fromCharCode(parseInt(code, 10));
    } catch {
      return "";
    }
  });

  // Replace numeric hex entities &#x1f;
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch {
      return "";
    }
  });

  return result.trim();
}

/**
 * Upgrades image resolution from Jamendo's 300px thumbnail to 500px artwork
 */
export function upgradeImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return "/images/fallback-cover.svg";
  }
  return url.replace("width=300", "width=500");
}

export interface LicenseInfo {
  code: string;
  label: string;
  url: string;
}

/**
 * Parses Creative Commons URL into typed license metadata
 */
export function parseLicense(ccUrl?: string | null): LicenseInfo {
  const fallbackUrl = "https://creativecommons.org/licenses/";
  if (!ccUrl || typeof ccUrl !== "string") {
    return {
      code: "cc-by-sa",
      label: "Creative Commons CC BY-SA",
      url: fallbackUrl,
    };
  }

  const lower = ccUrl.toLowerCase();
  let code = "cc-by-sa";
  let label = "Creative Commons CC BY-SA";

  if (lower.includes("zero") || lower.includes("/publicdomain/zero")) {
    code = "cc0";
    label = "Creative Commons CC0 (Public Domain)";
  } else if (lower.includes("by-nc-nd")) {
    code = "cc-by-nc-nd";
    label = "Creative Commons CC BY-NC-ND";
  } else if (lower.includes("by-nc-sa")) {
    code = "cc-by-nc-sa";
    label = "Creative Commons CC BY-NC-SA";
  } else if (lower.includes("by-nc")) {
    code = "cc-by-nc";
    label = "Creative Commons CC BY-NC";
  } else if (lower.includes("by-nd")) {
    code = "cc-by-nd";
    label = "Creative Commons CC BY-ND";
  } else if (lower.includes("by-sa")) {
    code = "cc-by-sa";
    label = "Creative Commons CC BY-SA";
  } else if (lower.includes("/by/")) {
    code = "cc-by";
    label = "Creative Commons CC BY";
  }

  // Extract license version if present (e.g. 2.0, 3.0, 4.0)
  const match = ccUrl.match(/\/(\d\.\d)\/?/);
  if (match?.[1]) {
    label += ` ${match[1]}`;
  }

  return {
    code,
    label,
    url: ccUrl,
  };
}

// ─────────────────────────────────────────────
// Raw Jamendo Types (Upstream API v3.0)
// ─────────────────────────────────────────────

export interface RawJamendoTrack {
  id: string | number;
  name?: string;
  duration?: string | number;
  artist_id?: string | number;
  artist_name?: string;
  album_id?: string | number;
  album_name?: string;
  album_image?: string;
  image?: string;
  audio?: string;
  audiodownload?: string;
  license_ccurl?: string;
  shareurl?: string;
  shorturl?: string;
  musicinfo?: {
    tags?: {
      genres?: string[];
      instruments?: string[];
      vartags?: string[];
    };
  };
}

export interface RawJamendoAlbum {
  id: string | number;
  name?: string;
  releasedate?: string;
  artist_id?: string | number;
  artist_name?: string;
  image?: string;
  zip?: string;
  shorturl?: string;
  shareurl?: string;
  tracks?: RawJamendoTrack[];
}

export interface RawJamendoArtist {
  id: string | number;
  name?: string;
  image?: string;
  website?: string;
  joindate?: string;
  shorturl?: string;
  shareurl?: string;
}

export interface RawJamendoPlaylist {
  id: string | number;
  name?: string;
  creationdate?: string;
  user_id?: string | number;
  user_name?: string;
  image?: string;
  tracks?: RawJamendoTrack[];
  description?: string;
}

// ─────────────────────────────────────────────
// Normalization Functions
// ─────────────────────────────────────────────

export function normalizeTrack(raw: RawJamendoTrack): Track {
  const license = parseLicense(raw.license_ccurl);
  const trackId = String(raw.id ?? "");
  const cover = upgradeImageUrl(raw.image || raw.album_image);
  const durationSec =
    typeof raw.duration === "string"
      ? parseInt(raw.duration, 10)
      : Number(raw.duration || 0);

  return {
    id: trackId,
    title: decodeHtml(raw.name) || "Untitled Track",
    artistId: String(raw.artist_id ?? ""),
    artistName: decodeHtml(raw.artist_name) || "Unknown Artist",
    albumId: String(raw.album_id ?? ""),
    albumName: decodeHtml(raw.album_name) || "",
    audioUrl: raw.audio || "",
    coverUrl: cover,
    duration: Number.isFinite(durationSec) ? durationSec : 0,
    license: license.code,
    licenseLabel: license.label,
    licenseUrl: license.url,
    genre: raw.musicinfo?.tags?.genres?.[0] || undefined,
    provider: "jamendo",
    providerTrackId: trackId,
  };
}

export function normalizeAlbum(
  raw: RawJamendoAlbum,
  tracks: Track[] = [],
): Album {
  const albumId = String(raw.id ?? "");
  let year: number | undefined;
  if (raw.releasedate) {
    const parsedYear = new Date(raw.releasedate).getFullYear();
    if (!Number.isNaN(parsedYear)) {
      year = parsedYear;
    }
  }

  return {
    id: albumId,
    title: decodeHtml(raw.name) || "Untitled Album",
    artistId: String(raw.artist_id ?? ""),
    artistName: decodeHtml(raw.artist_name) || "Unknown Artist",
    coverUrl: upgradeImageUrl(raw.image),
    year,
    genre: undefined,
    tracks,
    provider: "jamendo",
  };
}

export function normalizeArtist(
  raw: RawJamendoArtist,
  topTracks: Track[] = [],
  albums: Album[] = [],
): Artist {
  const artistId = String(raw.id ?? "");
  return {
    id: artistId,
    name: decodeHtml(raw.name) || "Unknown Artist",
    imageUrl: upgradeImageUrl(raw.image) || "/images/fallback-artist.svg",
    genre: undefined,
    topTracks,
    albums,
    provider: "jamendo",
  };
}

export function normalizePlaylist(
  raw: RawJamendoPlaylist,
  tracks: Track[] = [],
): Playlist {
  const playlistId = String(raw.id ?? "");
  const firstTrackCover = tracks[0]?.coverUrl;
  const coverUrl =
    upgradeImageUrl(raw.image) !== "/images/fallback-cover.svg"
      ? upgradeImageUrl(raw.image)
      : firstTrackCover || "/images/fallback-cover.svg";

  return {
    id: playlistId,
    name: decodeHtml(raw.name) || "Untitled Playlist",
    description: raw.description ? decodeHtml(raw.description) : undefined,
    coverUrl,
    ownerId: null,
    ownerName: raw.user_name ? decodeHtml(raw.user_name) : "Jamendo Community",
    isPublic: true,
    tracks,
    createdAt: raw.creationdate || new Date().toISOString(),
    updatedAt: raw.creationdate || new Date().toISOString(),
  };
}
