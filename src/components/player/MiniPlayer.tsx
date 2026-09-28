'use client';

import Image from 'next/image';
import { Heart } from 'lucide-react';
import {
  usePlayerStore,
  selectCurrentTrack,
  selectCurrentTime,
  selectDuration,
} from '@/store/playerStore';
import { PlayButton } from './PlayButton';

export function MiniPlayer() {
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const currentTime = usePlayerStore(selectCurrentTime);
  const duration = usePlayerStore(selectDuration);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="md:hidden fixed bottom-14 left-2 right-2 z-40 bg-bg-surface/95 backdrop-blur-md border border-bg-hover rounded-md shadow-lg overflow-hidden flex flex-col"
      aria-label="Mobile Mini Player"
    >
      {/* 2px Progress line */}
      <div className="w-full h-0.5 bg-bg-hover relative">
        <div
          className="absolute top-0 bottom-0 left-0 bg-accent transition-all duration-150"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main content row */}
      <div className="flex items-center justify-between px-3 py-2 gap-3">
        {/* Left: Cover + info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative h-10 w-10 flex-shrink-0 rounded-sm overflow-hidden bg-bg-hover">
            {currentTrack.coverUrl ? (
              <Image
                src={currentTrack.coverUrl}
                alt={`${currentTrack.title} cover`}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-bg-hover flex items-center justify-center text-text-muted text-xs">
                ♪
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">
              {currentTrack.title}
            </p>
            <p className="text-[11px] text-text-secondary truncate">
              {currentTrack.artistName}
            </p>
          </div>
        </div>

        {/* Right: Like + Play button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            aria-label="Like track"
            className="text-text-secondary hover:text-accent p-1 transition-colors"
          >
            <Heart size={18} />
          </button>

          <PlayButton size="sm" />
        </div>
      </div>
    </div>
  );
}
