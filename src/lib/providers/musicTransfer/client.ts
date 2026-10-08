if (typeof window !== "undefined" && process.env.NODE_ENV !== "test") {
  throw new Error("MusicTransferClient can only be used on the server.");
}
import crypto from "crypto";
import type {
  ExternalPlaylist,
  ExternalTrack,
  MusicApiAuthModelResponse,
  RawApiPlaylist,
  RawApiTrackItem,
} from "./types";

interface MusicTransferConfig {
  clientId: string;
  clientSecret: string;
  apiBaseUrl: string;
  appBaseUrl: string;
  accountSlug: string;
  webhookSigningSecret: string;
}

function getConfig(): MusicTransferConfig {
  const clientId = process.env.MUSIC_TRANSFER_CLIENT_ID || "";
  const clientSecret = process.env.MUSIC_TRANSFER_CLIENT_SECRET || "";
  const rawBaseUrl = process.env.MUSIC_TRANSFER_API_BASE_URL || "https://app.musicapi.com";
  // The API endpoints run on api.musicapi.com while the SSO/hosted dashboard is app.musicapi.com
  const apiBaseUrl = rawBaseUrl.includes("app.musicapi.com")
    ? "https://api.musicapi.com"
    : rawBaseUrl;
  const appBaseUrl = "https://app.musicapi.com";
  const accountSlug = process.env.MUSIC_TRANSFER_ACCOUNT_SLUG || "duo-player";
  const webhookSigningSecret = process.env.MUSIC_TRANSFER_WEBHOOK_SIGNING_SECRET || "";

  return {
    clientId,
    clientSecret,
    apiBaseUrl,
    appBaseUrl,
    accountSlug,
    webhookSigningSecret,
  };
}

function getBasicAuthHeader(config: MusicTransferConfig): string {
  if (!config.clientId || !config.clientSecret) {
    return "";
  }
  const token = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  return `Basic ${token}`;
}

export class MusicTransferClient {
  private config: MusicTransferConfig;

  constructor() {
    this.config = getConfig();
  }

  public isConfigured(): boolean {
    return Boolean(this.config.clientId && this.config.clientSecret);
  }

  public getConnectUrl(
    options:
      | {
          service?: string;
          returnUrl: string;
          uniqueId?: string;
        }
      | string,
    maybeReturnUrl?: string,
    maybeUniqueId?: string
  ): string {
    const opts =
      typeof options === "string"
        ? {
            service: options,
            returnUrl: maybeReturnUrl || "",
            uniqueId: maybeUniqueId,
          }
        : options;

    const { service, returnUrl, uniqueId } = opts;
    const slug = encodeURIComponent(this.config.accountSlug);
    const params = new URLSearchParams({
      returnUrl,
      forwardFailures: "true",
    });

    if (service) {
      params.set("ms", service);
    }
    if (uniqueId) {
      params.set("uniqueId", uniqueId);
    }

    return `${this.config.appBaseUrl}/integrations/${slug}?${params.toString()}`;
  }

  public async getAuthModel(authModelUuid: string): Promise<MusicApiAuthModelResponse> {
    const url = `${this.config.apiBaseUrl}/app/integrations/${encodeURIComponent(authModelUuid)}`;
    const authHeader = getBasicAuthHeader(this.config);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        "Content-Type": "application/json; charset=utf-8",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Failed to fetch auth model: ${res.status} ${errorText}`);
    }

    return res.json();
  }

  public async listSourcePlaylists(userUuid: string): Promise<ExternalPlaylist[]> {
    const url = `${this.config.apiBaseUrl}/api/${encodeURIComponent(userUuid)}/playlists`;
    const authHeader = getBasicAuthHeader(this.config);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        "Content-Type": "application/json; charset=utf-8",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Failed to fetch playlists: ${res.status} ${errorText}`);
    }

    const data = (await res.json()) as { items?: RawApiPlaylist[]; playlists?: RawApiPlaylist[] } | RawApiPlaylist[];
    const rawPlaylists: RawApiPlaylist[] = Array.isArray(data)
      ? data
      : data?.items || data?.playlists || [];

    return rawPlaylists.map((p: RawApiPlaylist) => {
      const firstImage = p.images?.[0];
      const image = typeof firstImage === "string"
        ? firstImage
        : firstImage?.url || p.imageUrl || null;

      return {
        id: String(p.id || p.uuid || p.playlistId || ""),
        name: String(p.name || p.title || "Untitled Playlist"),
        description: p.description || null,
        imageUrl: image,
        trackCount: Number(p.trackCount || p.totalTracks || p.tracks?.total || 0),
        ownerName: p.owner?.name || p.ownerName || null,
        isPublic: Boolean(p.isPublic ?? true),
        service: p.service || p.integrationType || undefined,
      };
    });
  }

  public async listPlaylistTracks(
    userUuid: string,
    playlistId: string
  ): Promise<ExternalTrack[]> {
    const url = `${this.config.apiBaseUrl}/api/${encodeURIComponent(userUuid)}/playlists/${encodeURIComponent(playlistId)}/items`;
    const authHeader = getBasicAuthHeader(this.config);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        "Content-Type": "application/json; charset=utf-8",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Failed to fetch playlist tracks: ${res.status} ${errorText}`);
    }

    const data = (await res.json()) as { items?: RawApiTrackItem[]; tracks?: RawApiTrackItem[] } | RawApiTrackItem[];
    const rawItems: RawApiTrackItem[] = Array.isArray(data)
      ? data
      : data?.items || data?.tracks || [];

    return rawItems.map((item: RawApiTrackItem) => {
      const t = item.track || item;
      const firstImage = t.images?.[0];
      const image = typeof firstImage === "string"
        ? firstImage
        : firstImage?.url || t.imageUrl || null;

      let artistName = "Unknown Artist";
      if (typeof t.artist === "string") {
        artistName = t.artist;
      } else if (t.artistName) {
        artistName = t.artistName;
      } else if (Array.isArray(t.artists) && t.artists[0]?.name) {
        artistName = t.artists.map((a) => a.name).filter(Boolean).join(", ");
      }

      const albumName = typeof t.album === "string" ? t.album : t.album?.name || null;

      return {
        id: String(t.id || t.uuid || t.trackId || ""),
        name: String(t.name || t.title || "Untitled Track"),
        artist: artistName,
        album: albumName,
        durationMs: t.durationMs || (t.duration ? t.duration * 1000 : undefined),
        isrc: t.isrc || null,
        imageUrl: image,
      };
    });
  }

  public async revokeConnection(userUuid: string): Promise<boolean> {
    const url = `${this.config.apiBaseUrl}/public/integrations/user/${encodeURIComponent(userUuid)}`;
    const authHeader = getBasicAuthHeader(this.config);

    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        "Content-Type": "application/json; charset=utf-8",
      },
    });

    // 204 or 404 (already deleted) both count as revoked successfully
    return res.status === 204 || res.status === 404 || res.ok;
  }

  public verifyWebhookSignature(
    signatureHeader: string | null,
    rawBody: string,
    secretOverride?: string
  ): boolean {
    const secret =
      secretOverride ||
      process.env.MUSIC_TRANSFER_WEBHOOK_SIGNING_SECRET ||
      this.config.webhookSigningSecret;
    if (!signatureHeader || !secret) {
      return false;
    }

    const parts: Record<string, string> = {};
    for (const part of signatureHeader.split(",")) {
      const index = part.indexOf("=");
      if (index > 0) {
        parts[part.slice(0, index).trim()] = part.slice(index + 1).trim();
      }
    }

    const timestamp = Number(parts.t);
    const now = Date.now() / 1000;
    if (
      !Number.isFinite(timestamp) ||
      now - timestamp > 300 ||
      timestamp - now > 60
    ) {
      // Missing timestamp, older than 5 minutes, or skewed too far in the future
      return false;
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${parts.t}.${rawBody}`)
      .digest("hex");

    if (
      typeof parts.v1 !== "string" ||
      Buffer.byteLength(parts.v1) !== expected.length
    ) {
      return false;
    }

    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
    } catch {
      return false;
    }
  }
}

export const musicTransferClient = new MusicTransferClient();
