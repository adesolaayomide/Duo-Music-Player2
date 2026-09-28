import type { Track, PlayerStatus } from '@/types';

/**
 * Media Session API integration.
 * Enables OS lock-screen controls, notification widgets, and hardware media keys.
 * Automatically checks for feature support and fails silently on unsupported platforms.
 */

interface MediaSessionCallbacks {
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  getCurrentTime?: () => number;
}

let isInitialized = false;

export function initMediaSession(callbacks: MediaSessionCallbacks): void {
  if (typeof window === 'undefined' || !('mediaSession' in navigator) || isInitialized) {
    return;
  }
  isInitialized = true;

  const ms = navigator.mediaSession;

  try {
    ms.setActionHandler('play', () => callbacks.play());
    ms.setActionHandler('pause', () => callbacks.pause());
    ms.setActionHandler('previoustrack', () => callbacks.previous());
    ms.setActionHandler('nexttrack', () => callbacks.next());

    ms.setActionHandler('seekto', (details) => {
      if (typeof details.seekTime === 'number' && Number.isFinite(details.seekTime)) {
        callbacks.seek(details.seekTime);
      }
    });

    ms.setActionHandler('seekbackward', (details) => {
      const offset = details.seekOffset || 5;
      const current = callbacks.getCurrentTime ? callbacks.getCurrentTime() : 0;
      callbacks.seek(Math.max(0, current - offset));
    });

    ms.setActionHandler('seekforward', (details) => {
      const offset = details.seekOffset || 5;
      const current = callbacks.getCurrentTime ? callbacks.getCurrentTime() : 0;
      callbacks.seek(current + offset);
    });
  } catch {
    // Ignore unsupported action errors on platforms with partial implementations
  }
}

export function updateMediaSessionMetadata(track: Track | null): void {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }

  if (!track) {
    navigator.mediaSession.metadata = null;
    return;
  }

  const artworkUrl = track.coverUrl || '/icons/icon-512.png';

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artistName,
    album: track.albumName,
    artwork: [
      { src: artworkUrl, sizes: '96x96', type: 'image/jpeg' },
      { src: artworkUrl, sizes: '256x256', type: 'image/jpeg' },
      { src: artworkUrl, sizes: '512x512', type: 'image/jpeg' },
    ],
  });
}

export function updateMediaSessionPlaybackState(status: PlayerStatus): void {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }

  if (status === 'playing') {
    navigator.mediaSession.playbackState = 'playing';
  } else if (status === 'paused') {
    navigator.mediaSession.playbackState = 'paused';
  } else {
    navigator.mediaSession.playbackState = 'none';
  }
}

export function updateMediaSessionPositionState(currentTime: number, duration: number): void {
  if (
    typeof window === 'undefined' ||
    !('mediaSession' in navigator) ||
    !('setPositionState' in navigator.mediaSession)
  ) {
    return;
  }

  if (Number.isFinite(duration) && duration > 0) {
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.max(0, Math.min(currentTime, duration)),
      });
    } catch {
      // Ignore InvalidStateError if duration is invalid or updating too rapidly
    }
  }
}
