"use client";

import React from "react";
import Link from "next/link";
import { Clock, Heart, Pause, Play, Search, Shuffle } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { TrackRow } from "@/components/media/TrackRow";
import { useLikedSongs } from "@/hooks/useLikedSongs";
import { useAuthStore } from "@/store/authStore";
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

export default function LikedSongsPage() {
  const { likedTracks, count } = useLikedSongs();
  const user = useAuthStore((s) => s.user);

  const currentTrack = usePlayerStore((s) => s.queue[s.currentIndex]);
  const status = usePlayerStore((s) => s.status);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);

  const isCurrentQueueLiked = Boolean(
    likedTracks.length > 0 &&
    likedTracks.some((t) => t.id === currentTrack?.id),
  );
  const isPlaying = isCurrentQueueLiked && status === "playing";

  const totalDurationSec = likedTracks.reduce(
    (acc, t) => acc + (t.duration || 0),
    0,
  );

  const handlePlayAll = () => {
    if (likedTracks.length === 0) return;
    if (isCurrentQueueLiked) {
      togglePlay();
    } else {
      playQueue(likedTracks, 0);
    }
  };

  const handleShufflePlay = () => {
    if (likedTracks.length === 0) return;
    toggleShuffle();
    playQueue(likedTracks, 0);
  };

  return (
    <div className="flex flex-col min-h-full">
      <TopBar accentColor="#5038a0" />

      {/* ── Gradient Header ──────────────────────────── */}
      <div className="relative flex flex-col md:flex-row items-end gap-6 px-6 pb-6 pt-16 -mt-16 bg-gradient-to-b from-[#5038a0] to-[var(--color-bg-elevated)]">
        <div className="h-44 w-44 md:h-52 md:w-52 shrink-0 rounded-md shadow-2xl bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center">
          <Heart size={80} className="text-white drop-shadow-md" fill="white" />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Playlist
          </span>
          <h1 className="mt-2 text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
            Liked Songs
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs md:text-sm text-[var(--color-text-secondary)]">
            <span className="font-semibold text-white">
              {user?.username || "You"}
            </span>
            <span>•</span>
            <span>
              {count} {count === 1 ? "song" : "songs"}
            </span>
            {count > 0 && (
              <>
                <span>•</span>
                <span>{formatTotalDuration(totalDurationSec)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Action Bar & Track List ──────────────────── */}
      <div className="flex-1 bg-black/20 px-6 py-6 backdrop-blur-sm">
        {count > 0 ? (
          <>
            {/* Play & Shuffle buttons */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={handlePlayAll}
                aria-label={
                  isPlaying ? "Pause liked songs" : "Play liked songs"
                }
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-black shadow-lg hover:scale-105 transition"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 fill-current" />
                ) : (
                  <Play className="h-6 w-6 fill-current translate-x-0.5" />
                )}
              </button>

              <button
                onClick={handleShufflePlay}
                aria-label="Shuffle liked songs"
                className="rounded-full p-3 text-[var(--color-text-secondary)] hover:text-white transition hover:scale-110"
              >
                <Shuffle className="h-6 w-6" />
              </button>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[16px_1fr_auto] md:grid-cols-[16px_4fr_3fr_minmax(120px,1fr)] items-center gap-4 px-4 py-2 border-b border-[var(--color-bg-hover)] text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              <span className="text-center">#</span>
              <span>Title</span>
              <span className="hidden md:block">Album</span>
              <div className="flex items-center justify-end pr-8">
                <Clock className="h-4 w-4" />
              </div>
            </div>

            {/* Track Rows */}
            <div className="divide-y divide-transparent mt-2">
              {likedTracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  contextQueue={likedTracks}
                  showAlbum={true}
                  showCover={true}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] border border-[var(--color-bg-hover)] mb-4">
              <Heart className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Songs you like will appear here
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)] max-w-sm">
              Save songs you love by tapping the heart icon on any track row or
              in the player bar.
            </p>
            <Link
              href="/search"
              className="mt-6 flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-bold text-black hover:scale-105 transition"
            >
              <Search className="h-4 w-4" />
              <span>Find songs</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
