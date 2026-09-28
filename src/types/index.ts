// ─────────────────────────────────────────────
//  Duo Player — Shared Domain Types
//  These are the ONLY shapes the UI is allowed to
//  depend on. Every MusicProvider MUST normalize
//  its response into these types before returning.
// ─────────────────────────────────────────────

export interface Track {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumName: string;
  /** Fully-resolved audio stream URL */
  audioUrl: string;
  /** Artwork URL (500×500 preferred) */
  coverUrl: string;
  /** Duration in seconds */
  duration: number;
  /** e.g. "cc-by", "cc-by-nc", "all-rights-reserved" */
  license: string;
  /** Human-readable license label */
  licenseLabel: string;
  /** Attribution URL (required for CC tracks) */
  licenseUrl?: string;
  genre?: string;
  /** Which provider owns this track */
  provider: 'jamendo' | 'local';
  /** Raw provider ID for deep-linking back */
  providerTrackId: string;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  coverUrl: string;
  /** Release year */
  year?: number;
  genre?: string;
  tracks: Track[];
  provider: 'jamendo' | 'local';
}

export interface Artist {
  id: string;
  name: string;
  imageUrl: string;
  genre?: string;
  /** Top tracks from this artist */
  topTracks: Track[];
  /** Albums from this artist */
  albums: Album[];
  provider: 'jamendo' | 'local';
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  /** null = not authenticated / local playlist */
  ownerId: string | null;
  ownerName?: string;
  isPublic: boolean;
  tracks: Track[];
  /** ISO 8601 */
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
//  Player State
// ─────────────────────────────────────────────

export type RepeatMode = 'off' | 'all' | 'one';
export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface PlayerState {
  /** Ordered list of tracks in the current active queue */
  queue: Track[];
  /** Original un-shuffled queue to restore upon toggling shuffle off */
  originalQueue: Track[];
  /** Index into `queue` of the currently loaded track */
  currentIndex: number;
  /** High-level playback status */
  status: PlayerStatus;
  /** Current playback position in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Buffered progress in seconds */
  buffered: number;
  /** Playback volume 0–1 */
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  /** Human-readable error message, or null */
  error: string | null;
}

// ─────────────────────────────────────────────
//  Music Provider Interface
// ─────────────────────────────────────────────

export interface SearchResults {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
}

export interface MusicProvider {
  readonly id: 'jamendo' | 'local';
  search(query: string): Promise<SearchResults>;
  getTrack(id: string): Promise<Track>;
  getAlbum(id: string): Promise<Album>;
  getArtist(id: string): Promise<Artist>;
  getFeatured(): Promise<Track[]>;
  getByGenre(genre: string): Promise<Track[]>;
}
