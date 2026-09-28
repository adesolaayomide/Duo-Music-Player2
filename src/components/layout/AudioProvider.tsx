'use client';

import { useEffect } from 'react';
import {
  usePlayerStore,
  selectCurrentTrack,
  selectStatus,
  selectCurrentTime,
  selectDuration,
  initAudioEngineSubscriptions,
} from '@/store/playerStore';
import {
  initMediaSession,
  updateMediaSessionMetadata,
  updateMediaSessionPlaybackState,
  updateMediaSessionPositionState,
} from '@/lib/audio/mediaSession';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

/**
 * AudioProvider — mounts once in the root layout and never unmounts.
 * - Subscribes AudioEngine events to playerStore
 * - Registers global keyboard shortcuts
 * - Synchronizes track metadata and playback controls with Media Session API
 */
export function AudioProvider() {
  // Global keyboard shortcuts (Space, Arrows, M, S, R)
  useKeyboardShortcuts();

  // Initialize engine and media session handlers once on mount
  useEffect(() => {
    initAudioEngineSubscriptions();

    const store = usePlayerStore.getState();
    initMediaSession({
      play: () => store.togglePlay(),
      pause: () => store.togglePlay(),
      next: () => store.next(),
      previous: () => store.previous(),
      seek: (seconds) => store.seek(seconds),
      getCurrentTime: () => usePlayerStore.getState().currentTime,
    });
  }, []);

  // Sync Media Session metadata with current track
  const currentTrack = usePlayerStore(selectCurrentTrack);
  useEffect(() => {
    updateMediaSessionMetadata(currentTrack);
  }, [currentTrack]);

  // Sync Media Session playback state
  const status = usePlayerStore(selectStatus);
  useEffect(() => {
    updateMediaSessionPlaybackState(status);
  }, [status]);

  // Sync Media Session position state
  const currentTime = usePlayerStore(selectCurrentTime);
  const duration = usePlayerStore(selectDuration);
  useEffect(() => {
    updateMediaSessionPositionState(currentTime, duration);
  }, [currentTime, duration]);

  return null;
}
