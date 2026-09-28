'use client';

/**
 * DEV ONLY - delete in Phase 3
 * Button to populate and trigger the sample queue for testing the player core.
 */

import { Play, Music } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { DEV_TRACKS } from './fixtures';

export function DevPlayButton() {
  const playQueue = usePlayerStore((s) => s.playQueue);
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const status = usePlayerStore((s) => s.status);

  const handlePlaySampleQueue = () => {
    playQueue(DEV_TRACKS, 0);
  };

  const isLoaded = queue.length > 0 && queue[0]?.id === DEV_TRACKS[0]?.id;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-bg-surface border border-accent/20 rounded-md">
      <div className="flex items-center gap-2">
        <Music size={20} className="text-accent" />
        <div>
          <p className="text-sm font-bold text-white">Dev Test Fixture</p>
          <p className="text-xs text-text-muted">
            {isLoaded
              ? `Queue active (${currentIndex + 1}/${queue.length}): ${status}`
              : 'Test playback with 3 generated audio tracks'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePlaySampleQueue}
        className="ml-auto flex items-center gap-2 bg-accent text-black px-4 py-2 rounded-full font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
        data-testid="play-sample-queue-btn"
      >
        <Play size={14} fill="currentColor" />
        <span>Play sample queue</span>
      </button>
    </div>
  );
}
