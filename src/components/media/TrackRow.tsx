"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MoreHorizontal,
  Pause,
  Play,
  ListPlus,
  ArrowRightCircle,
  Disc,
  User,
  ShieldCheck,
} from "lucide-react";
import { formatDuration } from "@/lib/utils/helpers";
import { LicenseDialog } from "./LicenseDialog";
import { usePlayerStore } from "@/store/playerStore";
import type { Track } from "@/types";

interface TrackRowProps {
  track: Track;
  index: number;
  contextQueue?: Track[];
  showAlbum?: boolean;
  showCover?: boolean;
}

export function TrackRow({
  track,
  index,
  contextQueue,
  showAlbum = true,
  showCover = true,
}: TrackRowProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [licenseOpen, setLicenseOpen] = useState(false);

  const currentTrack = usePlayerStore((s) => s.queue[s.currentIndex]);
  const status = usePlayerStore((s) => s.status);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const playNext = usePlayerStore((s) => s.playNext);

  const isCurrentTrack = currentTrack?.id === track.id;
  const isPlaying = isCurrentTrack && status === "playing";

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentTrack) {
      togglePlay();
    } else {
      const queueToPlay =
        contextQueue && contextQueue.length > 0 ? contextQueue : [track];
      const targetIndex = contextQueue
        ? contextQueue.findIndex((t) => t.id === track.id)
        : 0;
      playQueue(queueToPlay, targetIndex >= 0 ? targetIndex : 0);
    }
  };

  const handleRowClick = () => {
    if (isCurrentTrack) {
      togglePlay();
    } else {
      const queueToPlay =
        contextQueue && contextQueue.length > 0 ? contextQueue : [track];
      const targetIndex = contextQueue
        ? contextQueue.findIndex((t) => t.id === track.id)
        : 0;
      playQueue(queueToPlay, targetIndex >= 0 ? targetIndex : 0);
    }
  };

  return (
    <>
      <div
        onClick={handleRowClick}
        className={`group relative grid grid-cols-[16px_1fr_auto] md:grid-cols-[16px_4fr_3fr_minmax(120px,1fr)] items-center gap-4 rounded-md px-4 py-2 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-hover)]/60 cursor-pointer ${
          isCurrentTrack ? "bg-[var(--color-bg-hover)]/30" : ""
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleRowClick();
        }}
      >
        {/* Track Number / Play Indicator */}
        <div className="flex w-4 items-center justify-center text-xs font-medium">
          {isPlaying ? (
            <div className="flex items-end gap-[2px] h-3.5 group-hover:hidden">
              <span className="w-[3px] bg-[var(--color-accent)] animate-[bounce_0.8s_infinite_ease-in-out] h-full" />
              <span className="w-[3px] bg-[var(--color-accent)] animate-[bounce_0.6s_infinite_ease-in-out_0.2s] h-2/3" />
              <span className="w-[3px] bg-[var(--color-accent)] animate-[bounce_0.9s_infinite_ease-in-out_0.4s] h-4/5" />
            </div>
          ) : (
            <span
              className={`group-hover:hidden ${
                isCurrentTrack
                  ? "text-[var(--color-accent)] font-semibold"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              {index + 1}
            </span>
          )}

          <button
            onClick={handlePlayClick}
            className="hidden group-hover:flex items-center justify-center text-white transition hover:scale-110"
            aria-label={
              isPlaying ? `Pause ${track.title}` : `Play ${track.title}`
            }
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-current text-white" />
            ) : (
              <Play className="h-4 w-4 fill-current text-white" />
            )}
          </button>
        </div>

        {/* Title + Artist (with optional cover) */}
        <div className="flex min-w-0 items-center gap-3">
          {showCover && (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-[var(--color-bg-surface)]">
              <Image
                src={track.coverUrl || "/images/fallback-cover.svg"}
                alt={track.title}
                width={40}
                height={40}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div
              className={`truncate font-medium leading-tight ${
                isCurrentTrack
                  ? "text-[var(--color-accent)] font-semibold"
                  : "text-[var(--color-text-primary)] group-hover:text-white"
              }`}
            >
              {track.title}
            </div>
            <div className="truncate text-xs text-[var(--color-text-secondary)] mt-0.5">
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

        {/* Album Column (Desktop) */}
        {showAlbum && (
          <div className="hidden md:block min-w-0 truncate text-xs text-[var(--color-text-secondary)]">
            {track.albumId ? (
              <Link
                href={`/album/${track.albumId}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:underline hover:text-white"
              >
                {track.albumName || "—"}
              </Link>
            ) : (
              track.albumName || "—"
            )}
          </div>
        )}

        {/* Duration + Actions */}
        <div className="flex items-center justify-end gap-3 text-xs">
          {/* Like Heart */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className={`transition ${
              isLiked
                ? "text-[var(--color-accent)] opacity-100"
                : "text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:text-white"
            }`}
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
          </button>

          {/* Duration */}
          <span className="w-10 text-right tabular-nums text-[var(--color-text-muted)]">
            {formatDuration(track.duration)}
          </span>

          {/* More Actions Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="rounded p-1 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:text-white"
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-[var(--color-bg-hover)] bg-[var(--color-bg-surface)] p-1.5 shadow-xl text-xs text-[var(--color-text-primary)]"
                >
                  <button
                    onClick={() => {
                      playNext(track);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 hover:bg-[var(--color-bg-hover)]"
                  >
                    <ArrowRightCircle className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                    <span>Play next</span>
                  </button>
                  <button
                    onClick={() => {
                      addToQueue(track);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 hover:bg-[var(--color-bg-hover)]"
                  >
                    <ListPlus className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                    <span>Add to queue</span>
                  </button>
                  {track.albumId && (
                    <Link
                      href={`/album/${track.albumId}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 hover:bg-[var(--color-bg-hover)]"
                    >
                      <Disc className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                      <span>Go to album</span>
                    </Link>
                  )}
                  {track.artistId && (
                    <Link
                      href={`/artist/${track.artistId}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 hover:bg-[var(--color-bg-hover)]"
                    >
                      <User className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                      <span>Go to artist</span>
                    </Link>
                  )}
                  <div className="my-1 border-t border-[var(--color-bg-hover)]" />
                  <button
                    onClick={() => {
                      setLicenseOpen(true);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-white"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                    <span>License info</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <LicenseDialog
        track={track}
        isOpen={licenseOpen}
        onClose={() => setLicenseOpen(false)}
      />
    </>
  );
}
