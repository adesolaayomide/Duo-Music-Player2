export type SupportedMusicService =
  | "spotify"
  | "appleMusic"
  | "youtube"
  | "tidal"
  | "amazonMusic"
  | "deezer"
  | "soundCloud"
  | "napster"
  | "qobuz"
  | "boomplay"
  | "audiomack"
  | "audius";

export interface ExternalPlaylist {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  trackCount: number;
  ownerName?: string | null;
  isPublic?: boolean;
  service?: SupportedMusicService | string;
}

export interface ExternalTrack {
  id: string;
  name: string;
  artist: string;
  album?: string | null;
  durationMs?: number;
  isrc?: string | null;
  imageUrl?: string | null;
}

export interface MusicApiAuthModelResponse {
  returnUrl?: string;
  authModel: {
    uuid: string;
    status: "success" | "error" | "initialised";
    error?: string | null;
  };
  integrationUser?: {
    id?: number;
    integrationUserId?: string;
    name?: string;
    email?: string;
    imageUrl?: string;
    country?: string;
  };
  user?: {
    id?: number;
    slug?: string;
    name?: string;
  };
  integration?: {
    type?: string;
    returnUrl?: string;
  };
}

export interface WebhookDeliveryEnvelope<T = unknown> {
  event: string;
  createdAt: string;
  data: T;
}

export interface TransferCreatedEventData {
  transferUuid: string;
  sourceIntegrationType: string;
  targetIntegrationType: string;
  totalItems: number;
}

export interface TransferProgressEventData {
  transferUuid: string;
  processedItems: number;
  totalItems: number;
  pct: number;
}

export interface TransferCompletedEventData {
  transferUuid: string;
  status: "completed" | "completedWithErrors" | "failed";
  totalItems: number;
  processedItems: number;
  matchedItems: number;
  unmatchedItems: number;
  skippedItems: number;
  failedItems: number;
  sourceIntegrationType: string;
  targetIntegrationType: string;
}

export interface TransferFailedEventData {
  transferUuid: string;
  stage?: string;
  error?: string;
  errorType?: string;
  status?: "failed";
  totalItems?: number;
  processedItems?: number;
  matchedItems?: number;
  unmatchedItems?: number;
  failedItems?: number;
}

export interface TransferItemFailedEventData {
  transferUuid: string;
  groupName?: string | null;
  groupType?: string | null;
  newlyFailedCount: number;
  items: Array<{
    name: string;
    artist: string;
    error: string;
  }>;
}

export interface UserAuthorizedEventData {
  sessionUuid: string;
  role: "source" | "target";
  integrationType: string | null;
  integrationUserUuid: string;
}

export interface UserAuthFailedEventData {
  transferUuid: string;
  side: "source" | "target";
  reason: string;
}

export interface MatchReportReadyEventData {
  transferUuid: string;
  matchedItems: number;
  unmatchedItems: number;
  failedItems: number;
}

export interface RawApiPlaylist {
  id?: string;
  uuid?: string;
  playlistId?: string;
  name?: string;
  title?: string;
  description?: string | null;
  images?: Array<{ url?: string; width?: number; height?: number } | string>;
  imageUrl?: string | null;
  trackCount?: number;
  totalTracks?: number;
  tracks?: { total?: number };
  owner?: { name?: string };
  ownerName?: string;
  isPublic?: boolean;
  service?: string;
  integrationType?: string;
}

export interface RawApiTrackItem {
  id?: string;
  uuid?: string;
  trackId?: string;
  name?: string;
  title?: string;
  artist?: string;
  artistName?: string;
  artists?: Array<{ name?: string }>;
  album?: { name?: string } | string;
  durationMs?: number;
  duration?: number;
  isrc?: string | null;
  images?: Array<{ url?: string } | string>;
  imageUrl?: string | null;
  track?: RawApiTrackItem;
}
