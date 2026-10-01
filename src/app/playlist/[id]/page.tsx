"use client";

import React, { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  Heart,
  MoreHorizontal,
  Pause,
  Play,
  Shuffle,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { TrackRow } from "@/components/media/TrackRow";
import { SkeletonTrackRow } from "@/components/ui/Skeleton";
import { usePlaylist } from "@/hooks/useCatalog";
import { usePlayerStore } from "@/store/playerStore";

function formatTotalDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }
  return `${minutes} min ${secs} sec`;
}

export default function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: playlist, isLoading, isError } = usePlaylist(id);
  const [isLiked, setIsLiked] = useState(false);

  const currentTrack = usePlayerStore((s) => s.queue[s.currentIndex]);
  const status = usePlayerStore((s) => s.status);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);

  const isCurrentPlaylist = Boolean(
    playlist?.tracks &&
    playlist.tracks.length > 0 &&
    playlist.tracks.some((t) => t.id === currentTrack?.id),
  );
  const isPlaying = isCurrentPlaylist && status === "playing";

  const totalDurationSec = (playlist?.tracks || []).reduce(
    (acc, t) => acc + (t.duration || 0),
    0,
  );

  const handlePlayPlaylist = () => {
    if (!playlist?.tracks || playlist.tracks.length === 0) return;
    if (isCurrentPlaylist) {
      togglePlay();
    } else {
      playQueue(playlist.tracks, 0);
    }
  };

  const handleShufflePlay = () => {
    if (!playlist?.tracks || playlist.tracks.length === 0) return;
    toggleShuffle();
    playQueue(playlist.tracks, 0);
  };

  if (isError) {
    return (
      <div className="flex flex-col min-h-full">
        <TopBar />
        <div className="flex flex-col items-center justify-center py-24 text-center px-6">
          <h2 className="text-2xl font-bold text-white">Playlist not found</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            We couldn't load this playlist from Jamendo.
          </p>
          <Link
            href="/"
            className="mt-6 rounded-full bg-white px-6 py-2 text-xs font-bold text-black hover:scale-105 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar accentColor="#1b5e20" />

      {/* ── Playlist Header ────────────────────────── */}
      <div className="relative flex flex-col md:flex-row items-end gap-6 px-6 pb-6 pt-16 -mt-16 bg-gradient-to-b from-[#1b5e20] to-transparent">
        {isLoading || !playlist ? (
          <div className="h-48 w-48 md:h-56 md:w-56 shrink-0 rounded shadow-2xl bg-[var(--color-bg-hover)] animate-pulse" />
        ) : (
          <div className="relative h-48 w-48 md:h-56 md:w-56 shrink-0 overflow-hidden rounded shadow-2xl bg-[var(--color-bg-surface)]">
            <Image
              src={playlist.coverUrl || "/images/fallback-cover.svg"}
              alt={playlist.name}
              fill
              priority
              sizes="(max-width: 768px) 192px, 224px"
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <span className="text-xs uppercase tracking-wider font-bold text-white">
            Playlist
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight line-clamp-2">
            {isLoading || !playlist ? "Loading playlist..." : playlist.name}
          </h1>

          {playlist?.description && (
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] line-clamp-2">
              {playlist.description}
            </p>
          )}

          {playlist && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-[var(--color-text-secondary)] mt-2">
              <span className="font-bold text-white">
                {playlist.ownerName || "Jamendo"}
              </span>
              <span>• {playlist.tracks.length} songs,</span>
              <span className="text-[var(--color-text-muted)]">
                {formatTotalDuration(totalDurationSec)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content & Tracklist ───────────────── */}
      <div className="px-6 pb-24 flex flex-col gap-6">
        {/* Action Bar */}
        <div className="flex items-center gap-6 py-4">
          <button
            onClick={handlePlayPlaylist}
            disabled={isLoading || !playlist?.tracks?.length}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-black shadow-xl transition hover:scale-105 active:scale-95 disabled:opacity-50"
            aria-label={isPlaying ? "Pause playlist" : "Play playlist"}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 fill-current" />
            ) : (
              <Play className="h-6 w-6 fill-current ml-1" />
            )}
          </button>

          <button
            onClick={handleShufflePlay}
            className="text-[var(--color-text-secondary)] hover:text-white transition hover:scale-105"
            aria-label="Shuffle play"
          >
            <Shuffle className="h-6 w-6" />
          </button>

          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`transition hover:scale-105 ${
              isLiked
                ? "text-[var(--color-accent)]"
                : "text-[var(--color-text-secondary)] hover:text-white"
            }`}
            aria-label={
              isLiked ? "Remove from Your Library" : "Save to Your Library"
            }
          >
            <Heart className={`h-8 w-8 ${isLiked ? "fill-current" : ""}`} />
          </button>

          <button
            className="text-[var(--color-text-secondary)] hover:text-white transition"
            aria-label="More options"
          >
            <MoreHorizontal className="h-6 w-6" />
          </button>
        </div>

        {/* Tracklist Table Header */}
        <div className="grid grid-cols-[16px_1fr_auto] md:grid-cols-[16px_4fr_3fr_minmax(120px,1fr)] gap-4 px-4 py-2 border-b border-[var(--color-bg-hover)] text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          <span className="text-center">#</span>
          <span>Title</span>
          <span className="hidden md:block">Album</span>
          <div className="flex justify-end pr-8">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        {/* Tracks */}
        {isLoading ? (
          <div className="space-y-1">
            <SkeletonTrackRow />
            <SkeletonTrackRow />
            <SkeletonTrackRow />
            <SkeletonTrackRow />
            <SkeletonTrackRow />
          </div>
        ) : (
          <div className="flex flex-col">
            {playlist?.tracks.map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
                contextQueue={playlist.tracks}
                showAlbum
                showCover
              />
            ))}
          </div>
        )}

        {/* Attribution & Legal Footer */}
        {playlist && (
          <div className="mt-8 border-t border-[var(--color-bg-hover)] pt-6 text-xs text-[var(--color-text-muted)] leading-relaxed">
            <p>
              Curated by Jamendo community listeners. All tracks distributed
              under Creative Commons licenses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
