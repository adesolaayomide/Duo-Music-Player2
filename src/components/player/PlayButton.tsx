"use client";

import { Play, Pause } from "lucide-react";
import { usePlayerStore, selectStatus } from "@/store/playerStore";
import { cn } from "@/lib/utils/cn";

interface PlayButtonProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
};

export function PlayButton({ className, size = "md" }: PlayButtonProps) {
  const status = usePlayerStore(selectStatus);
  const queue = usePlayerStore((s) => s.queue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const isPlaying = status === "playing";
  const isLoading = status === "loading";
  const isDisabled = status === "idle" && queue.length === 0;

  return (
    <button
      type="button"
      onClick={togglePlay}
      disabled={isDisabled}
      aria-label={isPlaying ? "Pause" : "Play"}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full bg-white text-black",
        "hover:scale-105 active:scale-95 transition-all duration-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
        "disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer shadow-md",
        sizeClasses[size],
        className,
      )}
    >
      {isLoading ? (
        <span
          className="inline-block border-2 border-black border-t-transparent rounded-full animate-spin"
          style={{ width: iconSizes[size], height: iconSizes[size] }}
        />
      ) : isPlaying ? (
        <Pause size={iconSizes[size]} fill="currentColor" />
      ) : (
        <Play
          size={iconSizes[size]}
          fill="currentColor"
          className="translate-x-0.5"
        />
      )}
    </button>
  );
}
