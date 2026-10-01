"use client";

import React, { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MoreHorizontal, Pause, Play } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { AlbumCard } from "@/components/media/AlbumCard";
import { Shelf } from "@/components/media/Shelf";
import { TrackRow } from "@/components/media/TrackRow";
import { SkeletonCard, SkeletonTrackRow } from "@/components/ui/Skeleton";
import { useArtist } from "@/hooks/useCatalog";
import { usePlayerStore } from "@/store/playerStore";

export default function ArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: artist, isLoading, isError } = useArtist(id);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showAllTracks, setShowAllTracks] = useState(false);

  const currentTrack = usePlayerStore((s) => s.queue[s.currentIndex]);
  const status = usePlayerStore((s) => s.status);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const isCurrentArtist = Boolean(
    artist?.topTracks &&
    artist.topTracks.length > 0 &&
    artist.topTracks.some((t) => t.id === currentTrack?.id),
  );
  const isPlaying = isCurrentArtist && status === "playing";

  const handlePlayArtist = () => {
    if (!artist?.topTracks || artist.topTracks.length === 0) return;
    if (isCurrentArtist) {
      togglePlay();
    } else {
      playQueue(artist.topTracks, 0);
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col min-h-full">
        <TopBar />
        <div className="flex flex-col items-center justify-center py-24 text-center px-6">
          <h2 className="text-2xl font-bold text-white">Artist not found</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            We couldn't load this artist from Jamendo.
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

  const displayedTracks = showAllTracks
    ? artist?.topTracks || []
    : (artist?.topTracks || []).slice(0, 5);

  return (
    <div className="flex flex-col min-h-full">
      <TopBar accentColor="#283593" />

      {/* ── Artist Banner / Header ──────────────────── */}
      <div className="relative flex flex-col md:flex-row items-end gap-6 px-6 pb-6 pt-16 -mt-16 bg-gradient-to-b from-[#1a237e] to-transparent">
        {isLoading || !artist ? (
          <div className="h-44 w-44 md:h-52 md:w-52 shrink-0 rounded-full shadow-2xl bg-[var(--color-bg-hover)] animate-pulse" />
        ) : (
          <div className="relative h-44 w-44 md:h-52 md:w-52 shrink-0 overflow-hidden rounded-full shadow-2xl bg-[var(--color-bg-surface)]">
            <Image
              src={artist.imageUrl || "/images/fallback-artist.svg"}
              alt={artist.name}
              fill
              priority
              sizes="(max-width: 768px) 176px, 208px"
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-white">
            <BadgeCheck className="h-4 w-4 text-[var(--color-accent)]" />
            <span>Verified Artist</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight line-clamp-2">
            {isLoading || !artist ? "Loading artist..." : artist.name}
          </h1>

          <div className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
            Independent artist on Jamendo • Creative Commons music
          </div>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────── */}
      <div className="px-6 pb-24 flex flex-col gap-8">
        {/* Action Bar */}
        <div className="flex items-center gap-6 py-4">
          <button
            onClick={handlePlayArtist}
            disabled={isLoading || !artist?.topTracks?.length}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-black shadow-xl transition hover:scale-105 active:scale-95 disabled:opacity-50"
            aria-label={isPlaying ? "Pause artist" : "Play artist"}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 fill-current" />
            ) : (
              <Play className="h-6 w-6 fill-current ml-1" />
            )}
          </button>

          <button
            onClick={() => setIsFollowing(!isFollowing)}
            className={`rounded-full border border-[var(--color-text-secondary)] px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition hover:scale-105 ${
              isFollowing
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "text-white hover:border-white"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>

          <button
            className="text-[var(--color-text-secondary)] hover:text-white transition"
            aria-label="More options"
          >
            <MoreHorizontal className="h-6 w-6" />
          </button>
        </div>

        {/* ── Popular Tracks Section ────────────────── */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mb-4">
            Popular
          </h2>

          {isLoading ? (
            <div className="space-y-1">
              <SkeletonTrackRow />
              <SkeletonTrackRow />
              <SkeletonTrackRow />
              <SkeletonTrackRow />
              <SkeletonTrackRow />
            </div>
          ) : displayedTracks.length > 0 ? (
            <div className="flex flex-col">
              {displayedTracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  contextQueue={artist?.topTracks}
                  showAlbum={false}
                  showCover
                />
              ))}

              {(artist?.topTracks.length || 0) > 5 && (
                <button
                  onClick={() => setShowAllTracks(!showAllTracks)}
                  className="mt-3 self-start px-4 text-xs font-bold text-[var(--color-text-secondary)] hover:text-white"
                >
                  {showAllTracks ? "Show less" : "See more"}
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              No tracks available.
            </p>
          )}
        </section>

        {/* ── Discography Section ───────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : artist?.albums && artist.albums.length > 0 ? (
          <Shelf title="Discography" subtitle="Albums & Singles">
            {artist.albums.map((album) => (
              <div key={album.id} className="w-36 sm:w-44 shrink-0">
                <AlbumCard album={album} />
              </div>
            ))}
          </Shelf>
        ) : null}
      </div>
    </div>
  );
}
