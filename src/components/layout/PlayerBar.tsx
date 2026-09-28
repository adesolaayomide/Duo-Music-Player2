'use client';

import { usePlayerStore, selectCurrentTrack } from '@/store/playerStore';
import { formatDuration } from '@/lib/utils/helpers';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, VolumeX, ListMusic, Maximize2, Heart } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

// ─────────────────────────────────────────────
//  PlayerBar
// ─────────────────────────────────────────────

export function PlayerBar() {
  const {
    isPlaying,
    isBuffering,
    position,
    volume,
    isMuted,
    shuffle,
    repeat,
    queue,
    currentIndex,
    setPlaying,
    playNext,
    playPrev,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    setPosition,
  } = usePlayerStore();

  const currentTrack = usePlayerStore(selectCurrentTrack);
  const duration = currentTrack?.duration ?? 0;
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  if (!currentTrack && queue.length === 0) {
    // Render empty bar to preserve the layout slot
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-50 h-[var(--player-height)] bg-bg-elevated border-t border-bg-hover"
        aria-hidden="true"
      />
    );
  }

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-50 h-[var(--player-height)] bg-bg-elevated border-t border-bg-hover flex items-center px-4 gap-4"
      aria-label="Music player"
    >
      {/* ── LEFT: Cover + title + like ────────────── */}
      <div className="flex items-center gap-3 w-[30%] min-w-0">
        {currentTrack && (
          <>
            <div className="relative h-14 w-14 flex-shrink-0 rounded-sm overflow-hidden bg-bg-hover">
              {currentTrack.coverUrl && (
                <Image
                  src={currentTrack.coverUrl}
                  alt={`${currentTrack.albumName} cover`}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate leading-snug">
                {currentTrack.title}
              </p>
              <p className="text-xs text-text-secondary truncate">{currentTrack.artistName}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Like this track"
              className="text-text-secondary hover:text-accent flex-shrink-0 h-8 w-8"
            >
              <Heart size={16} />
            </Button>
          </>
        )}
      </div>

      {/* ── CENTER: Controls + progress bar ───────── */}
      <div className="flex flex-col items-center gap-2 flex-1 max-w-[45%]">
        {/* Control buttons */}
        <div className="flex items-center gap-4" role="group" aria-label="Playback controls">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleShuffle}
            aria-label={shuffle ? 'Disable shuffle' : 'Enable shuffle'}
            aria-pressed={shuffle}
            className={cn('h-8 w-8', shuffle ? 'text-accent' : 'text-text-secondary hover:text-text-primary')}
          >
            <Shuffle size={16} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={playPrev}
            aria-label="Previous track"
            className="text-text-secondary hover:text-text-primary h-8 w-8"
          >
            <SkipBack size={18} />
          </Button>

          <Button
            variant="icon"
            size="icon"
            onClick={() => setPlaying(!isPlaying)}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            disabled={!currentTrack}
            className={cn(
              'h-10 w-10 rounded-full bg-white text-bg-base hover:scale-105',
              isBuffering && 'opacity-70'
            )}
          >
            {isBuffering ? (
              <span className="h-4 w-4 border-2 border-bg-base border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={playNext}
            aria-label="Next track"
            className="text-text-secondary hover:text-text-primary h-8 w-8"
          >
            <SkipForward size={18} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={cycleRepeat}
            aria-label={
              repeat === 'off' ? 'Enable repeat' : repeat === 'all' ? 'Enable repeat one' : 'Disable repeat'
            }
            aria-pressed={repeat !== 'off'}
            className={cn('h-8 w-8', repeat !== 'off' ? 'text-accent' : 'text-text-secondary hover:text-text-primary')}
          >
            {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </Button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 w-full">
          <span className="text-xs text-text-muted w-9 text-right tabular-nums">
            {formatDuration(position)}
          </span>
          <div className="relative flex-1 group">
            <input
              type="range"
              min={0}
              max={duration || 1}
              value={position}
              step={0.5}
              onChange={(e) => setPosition(Number(e.target.value))}
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={Math.floor(position)}
              aria-valuetext={`${formatDuration(position)} of ${formatDuration(duration)}`}
              className="w-full h-1 appearance-none bg-bg-hover rounded-full cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:hidden group-hover:[&::-webkit-slider-thumb]:block
                [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                accent-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              style={{
                background: `linear-gradient(to right, var(--color-accent) ${progress}%, #282828 ${progress}%)`,
              }}
            />
          </div>
          <span className="text-xs text-text-muted w-9 tabular-nums">
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* ── RIGHT: Volume + extras ─────────────────── */}
      <div className="flex items-center justify-end gap-2 w-[25%]">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open queue"
          className="text-text-secondary hover:text-text-primary h-8 w-8"
        >
          <ListMusic size={16} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          aria-pressed={isMuted}
          className="text-text-secondary hover:text-text-primary h-8 w-8"
        >
          {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </Button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label="Volume"
          className="w-24 h-1 appearance-none rounded-full cursor-pointer accent-accent
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          style={{
            background: `linear-gradient(to right, var(--color-accent) ${(isMuted ? 0 : volume) * 100}%, #282828 ${(isMuted ? 0 : volume) * 100}%)`,
          }}
        />

        <Button
          variant="ghost"
          size="icon"
          aria-label="Full screen player"
          className="text-text-secondary hover:text-text-primary h-8 w-8 hidden lg:flex"
        >
          <Maximize2 size={14} />
        </Button>
      </div>
    </footer>
  );
}
