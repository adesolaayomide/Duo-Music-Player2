"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import type { Track } from "@/types";

interface TrackCardProps {
  track: Track;
  contextQueue?: Track[];
}

export function TrackCard({ track, contextQueue }: TrackCardProps) {
  const currentTrack = usePlayerStore((s) => s.queue[s.currentIndex]);
  const status = usePlayerStore((s) => s.status);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const isCurrentTrack = currentTrack?.id === track.id;
  const isPlaying = isCurrentTrack && status === "playing";

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCurrentTrack) {
      togglePlay();
    } else {
      const queue =
        contextQueue && contextQueue.length > 0 ? contextQueue : [track];
      const idx = contextQueue
        ? contextQueue.findIndex((t) => t.id === track.id)
        : 0;
      playQueue(queue, idx >= 0 ? idx : 0);
    }
  };

  return (
    <div
      onClick={handlePlayClick}
      className="group relative flex flex-col rounded-md bg-[var(--color-bg-elevated)] p-3 transition-all duration-200 hover:bg-[var(--color-bg-hover)] cursor-pointer"
    >
      {/* Artwork with floating play button */}
      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded shadow-lg bg-[var(--color-bg-surface)]">
        <Image
          src={track.coverUrl || "/images/fallback-cover.svg"}
          alt={track.title}
          fill
          sizes="(max-width: 768px) 160px, 200px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />

        {/* Floating Green Play Button */}
        <button
          onClick={handlePlayClick}
          className={`absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] text-black shadow-xl transition-all duration-200 hover:scale-105 ${
            isPlaying || isCurrentTrack
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
          }`}
          aria-label={
            isPlaying ? `Pause ${track.title}` : `Play ${track.title}`
          }
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 fill-current ml-0.5" />
          )}
        </button>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div
          className={`truncate font-semibold text-sm ${
            isCurrentTrack
              ? "text-[var(--color-accent)]"
              : "text-[var(--color-text-primary)]"
          }`}
        >
          {track.title}
        </div>
        <div className="truncate text-xs text-[var(--color-text-secondary)] mt-1">
          {track.artistId ? (
            <Link
              href={`/artist/${track.artistId}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline hover:text-white"
            >
              {track.artistName}
            </Link>
          ) : (
            track.artistName
          )}
        </div>
      </div>
    </div>
  );
}
