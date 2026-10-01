"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Shuffle,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  ListMusic,
  Maximize2,
  Heart,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import {
  usePlayerStore,
  selectCurrentTrack,
  selectShuffle,
  selectRepeat,
  selectStatus,
  selectError,
} from "@/store/playerStore";
import { PlayButton } from "@/components/player/PlayButton";
import { ProgressBar } from "@/components/player/ProgressBar";
import { VolumeControl } from "@/components/player/VolumeControl";
import { QueuePanel } from "@/components/player/QueuePanel";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import { useLikedSongs } from "@/hooks/useLikedSongs";
import { cn } from "@/lib/utils/cn";

export function PlayerBar() {
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const shuffle = usePlayerStore(selectShuffle);
  const repeat = usePlayerStore(selectRepeat);
  const status = usePlayerStore(selectStatus);
  const error = usePlayerStore(selectError);

  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const { isLiked: checkLiked, toggleLike } = useLikedSongs();
  const isLiked = currentTrack ? checkLiked(currentTrack.id) : false;

  const isIdle = status === "idle" && !currentTrack;
  const isError = status === "error";

  return (
    <>
      {/* Mobile Mini Player */}
      <MiniPlayer />

      {/* Queue Drawer Panel */}
      <QueuePanel isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />

      {/* Desktop PlayerBar */}
      <footer
        className="hidden md:flex fixed bottom-0 left-0 right-0 z-50 h-[var(--player-height)] bg-bg-elevated border-t border-bg-hover items-center px-4 justify-between"
        aria-label="Audio player"
      >
        {/* ── LEFT: Track Info ─────────────────────────── */}
        <div className="flex items-center gap-3 w-[30%] min-w-0">
          {currentTrack ? (
            <>
              <div className="relative h-14 w-14 flex-shrink-0 rounded-sm overflow-hidden bg-bg-hover shadow-sm">
                {currentTrack.coverUrl ? (
                  <Image
                    src={currentTrack.coverUrl}
                    alt={`${currentTrack.title} cover`}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-bg-surface flex items-center justify-center text-text-muted text-sm">
                    ♪
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate leading-tight">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-text-secondary truncate mt-0.5">
                  {currentTrack.artistName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (currentTrack) void toggleLike(currentTrack);
                }}
                aria-label={
                  isLiked
                    ? "Remove from your liked songs"
                    : "Save to your liked songs"
                }
                className={cn(
                  "p-1.5 rounded-full transition-colors flex-shrink-0",
                  isLiked
                    ? "text-accent"
                    : "text-text-secondary hover:text-white",
                )}
              >
                <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 text-text-muted select-none">
              <div className="h-14 w-14 rounded-sm bg-bg-surface flex items-center justify-center text-xs text-text-muted">
                ♪
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary">
                  No track playing
                </p>
                <p className="text-xs text-text-muted">
                  Choose something to play
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── CENTER: Controls & Progress ───────────────── */}
        <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[45%]">
          {/* Playback Error Banner */}
          {isError && (
            <div className="flex items-center gap-2 text-xs text-danger font-medium bg-danger/10 px-2.5 py-0.5 rounded-full mb-0.5">
              <AlertCircle size={14} />
              <span className="truncate max-w-[280px]">
                {error || "Playback error"}
              </span>
              <button
                type="button"
                onClick={togglePlay}
                aria-label="Retry playback"
                className="hover:underline flex items-center gap-0.5 text-white ml-1"
              >
                <RotateCcw size={12} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Control Buttons */}
          <div
            className="flex items-center gap-3"
            role="group"
            aria-label="Playback controls"
          >
            <button
              type="button"
              onClick={toggleShuffle}
              disabled={isIdle}
              aria-label={shuffle ? "Disable shuffle" : "Enable shuffle"}
              aria-pressed={shuffle}
              className={cn(
                "relative p-1.5 rounded-full transition-colors duration-fast disabled:opacity-40 disabled:cursor-not-allowed",
                shuffle
                  ? "text-accent"
                  : "text-text-secondary hover:text-white",
              )}
            >
              <Shuffle size={18} />
              {shuffle && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={previous}
              disabled={isIdle}
              aria-label="Previous track"
              className="p-1.5 text-text-secondary hover:text-white transition-colors duration-fast disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <SkipBack size={20} />
            </button>

            <PlayButton size="md" />

            <button
              type="button"
              onClick={next}
              disabled={isIdle}
              aria-label="Next track"
              className="p-1.5 text-text-secondary hover:text-white transition-colors duration-fast disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <SkipForward size={20} />
            </button>

            <button
              type="button"
              onClick={cycleRepeat}
              disabled={isIdle}
              aria-label={`Repeat mode: ${repeat}`}
              aria-pressed={repeat !== "off"}
              className={cn(
                "relative p-1.5 rounded-full transition-colors duration-fast disabled:opacity-40 disabled:cursor-not-allowed",
                repeat !== "off"
                  ? "text-accent"
                  : "text-text-secondary hover:text-white",
              )}
            >
              {repeat === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
              {repeat !== "off" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full" />
              )}
            </button>
          </div>

          {/* Seek Bar */}
          <ProgressBar showTime />
        </div>

        {/* ── RIGHT: Queue & Volume & Fullscreen ────────── */}
        <div className="flex items-center justify-end gap-3 w-[30%]">
          <button
            type="button"
            onClick={() => setIsQueueOpen(!isQueueOpen)}
            aria-label="Toggle play queue"
            aria-expanded={isQueueOpen}
            className={cn(
              "p-1.5 rounded-sm transition-colors duration-fast",
              isQueueOpen
                ? "text-accent"
                : "text-text-secondary hover:text-white",
            )}
          >
            <ListMusic size={18} />
          </button>

          <VolumeControl />

          <button
            type="button"
            aria-label="Full screen view"
            className="p-1.5 text-text-secondary hover:text-white transition-colors duration-fast hidden lg:inline-block rounded-sm"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </footer>
    </>
  );
}
