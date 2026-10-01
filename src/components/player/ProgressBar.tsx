"use client";

import { useState, useRef, useCallback } from "react";
import {
  usePlayerStore,
  selectCurrentTime,
  selectDuration,
  selectBuffered,
} from "@/store/playerStore";
import { formatDuration } from "@/lib/utils/helpers";
import { cn } from "@/lib/utils/cn";

interface ProgressBarProps {
  className?: string;
  showTime?: boolean;
}

export function ProgressBar({ className, showTime = true }: ProgressBarProps) {
  const currentTime = usePlayerStore(selectCurrentTime);
  const duration = usePlayerStore(selectDuration);
  const buffered = usePlayerStore(selectBuffered);
  const seek = usePlayerStore((s) => s.seek);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  // Time to display on the progress indicator
  const displayTime = isScrubbing ? scrubTime : currentTime;
  const progressPercent =
    duration > 0
      ? Math.min(100, Math.max(0, (displayTime / duration) * 100))
      : 0;
  const bufferedPercent =
    duration > 0 ? Math.min(100, Math.max(0, (buffered / duration) * 100)) : 0;

  const calculateTimeFromPointer = useCallback(
    (clientX: number): number => {
      if (!barRef.current || duration <= 0) return 0;
      const rect = barRef.current.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width),
      );
      return ratio * duration;
    },
    [duration],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsScrubbing(true);
    const newTime = calculateTimeFromPointer(e.clientX);
    setScrubTime(newTime);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing || duration <= 0) return;
    const newTime = calculateTimeFromPointer(e.clientX);
    setScrubTime(newTime);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const finalTime = calculateTimeFromPointer(e.clientX);
    seek(finalTime);
    setIsScrubbing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (duration <= 0) return;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      seek(Math.min(duration, currentTime + 5));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      seek(Math.max(0, currentTime - 5));
    } else if (e.key === "Home") {
      e.preventDefault();
      seek(0);
    } else if (e.key === "End") {
      e.preventDefault();
      seek(duration);
    }
  };

  return (
    <div
      className={cn("flex items-center gap-2 w-full select-none", className)}
    >
      {showTime && (
        <span className="text-xs text-text-secondary tabular-nums min-w-[36px] text-right font-medium">
          {formatDuration(displayTime)}
        </span>
      )}

      <div
        ref={barRef}
        role="slider"
        tabIndex={0}
        aria-label="Playback progress"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(displayTime)}
        aria-valuetext={`${formatDuration(displayTime)} of ${formatDuration(duration)}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setIsScrubbing(false)}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative flex-1 h-3 flex items-center cursor-pointer group touch-none outline-none",
          "focus-visible:ring-1 focus-visible:ring-accent rounded-full",
        )}
      >
        {/* Track background */}
        <div className="w-full h-1 bg-bg-hover rounded-full overflow-hidden relative">
          {/* Buffered range indicator */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-white/20 rounded-full transition-all duration-150"
            style={{ width: `${bufferedPercent}%` }}
          />

          {/* Played progress indicator */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-white group-hover:bg-accent transition-colors duration-fast rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Scrub thumb */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-md pointer-events-none transition-opacity duration-fast",
            isScrubbing
              ? "opacity-100 scale-110"
              : "opacity-0 group-hover:opacity-100",
          )}
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      {showTime && (
        <span className="text-xs text-text-secondary tabular-nums min-w-[36px] text-left font-medium">
          {formatDuration(duration)}
        </span>
      )}
    </div>
  );
}
