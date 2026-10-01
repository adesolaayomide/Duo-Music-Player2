"use client";

import React, { use } from "react";
import Link from "next/link";
import { Clock, Pause, Play, Shuffle } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Shelf } from "@/components/media/Shelf";
import { TrackRow } from "@/components/media/TrackRow";
import { SkeletonTrackRow } from "@/components/ui/Skeleton";
import { useGenreTracks } from "@/hooks/useCatalog";
import { GENRES, getGenreBySlug } from "@/lib/utils/genres";
import { usePlayerStore } from "@/store/playerStore";

export default function GenrePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const genre = getGenreBySlug(slug) || {
    id: slug,
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    tag: slug,
    color: "#333333",
    description: `Explore the best of ${slug} music on Jamendo.`,
  };

  const { data: tracks = [], isLoading } = useGenreTracks(genre.tag);

  const currentTrack = usePlayerStore((s) => s.queue[s.currentIndex]);
  const status = usePlayerStore((s) => s.status);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);

  const isCurrentGenrePlaying = Boolean(
    tracks.length > 0 &&
    tracks.some((t) => t.id === currentTrack?.id) &&
    status === "playing",
  );

  const handlePlayTracks = () => {
    if (tracks.length === 0) return;
    if (isCurrentGenrePlaying) {
      togglePlay();
    } else {
      playQueue(tracks, 0);
    }
  };

  const handleShuffleTracks = () => {
    if (tracks.length === 0) return;
    toggleShuffle();
    playQueue(tracks, 0);
  };

  const otherGenres = GENRES.filter((g) => g.id !== genre.id);

  return (
    <div className="flex flex-col min-h-full">
      <TopBar accentColor={genre.color} />

      {/* ── Genre Banner ───────────────────────────── */}
      <div
        style={{
          background: `linear-gradient(to bottom, ${genre.color}dd 0%, ${genre.color}33 70%, transparent 100%)`,
        }}
        className="px-6 pb-8 pt-20 -mt-16 flex flex-col justify-end min-h-[220px]"
      >
        <span className="text-xs uppercase tracking-wider font-bold text-white/80">
          Genre Hub
        </span>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-md mt-1">
          {genre.name}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-white/90 max-w-xl drop-shadow-xs">
          {genre.description}
        </p>
      </div>

      {/* ── Content & Tracklist ────────────────────── */}
      <div className="px-6 pb-24 flex flex-col gap-8">
        {/* Play Action Bar */}
        <div className="flex items-center gap-6 py-2">
          <button
            onClick={handlePlayTracks}
            disabled={isLoading || tracks.length === 0}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-black shadow-xl transition hover:scale-105 active:scale-95 disabled:opacity-50"
            aria-label={
              isCurrentGenrePlaying ? "Pause tracks" : "Play genre tracks"
            }
          >
            {isCurrentGenrePlaying ? (
              <Pause className="h-6 w-6 fill-current" />
            ) : (
              <Play className="h-6 w-6 fill-current ml-1" />
            )}
          </button>

          <button
            onClick={handleShuffleTracks}
            disabled={isLoading || tracks.length === 0}
            className="text-[var(--color-text-secondary)] hover:text-white transition hover:scale-105 disabled:opacity-50"
            aria-label="Shuffle genre tracks"
          >
            <Shuffle className="h-6 w-6" />
          </button>
        </div>

        {/* Tracks List */}
        <section>
          <div className="grid grid-cols-[16px_1fr_auto] md:grid-cols-[16px_4fr_3fr_minmax(120px,1fr)] gap-4 px-4 py-2 border-b border-[var(--color-bg-hover)] text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            <span className="text-center">#</span>
            <span>Title</span>
            <span className="hidden md:block">Album</span>
            <div className="flex justify-end pr-8">
              <Clock className="h-4 w-4" />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-1 mt-2">
              <SkeletonTrackRow />
              <SkeletonTrackRow />
              <SkeletonTrackRow />
              <SkeletonTrackRow />
              <SkeletonTrackRow />
            </div>
          ) : tracks.length > 0 ? (
            <div className="flex flex-col mt-1">
              {tracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  contextQueue={tracks}
                  showAlbum
                  showCover
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
              No tracks found in this genre.
            </div>
          )}
        </section>

        {/* ── Other Genres Shelf ─────────────────────── */}
        <Shelf title="More Genres to Explore">
          {otherGenres.map((g) => (
            <Link
              key={g.id}
              href={`/genre/${g.id}`}
              style={{ backgroundColor: g.color }}
              className="group relative flex h-28 w-36 sm:w-44 shrink-0 flex-col justify-between overflow-hidden rounded-md p-3.5 font-bold text-white shadow-lg transition-transform duration-200 hover:scale-[1.03]"
            >
              <span className="text-base leading-tight drop-shadow">
                {g.name}
              </span>
              <span className="text-[10px] font-normal opacity-80 line-clamp-2">
                {g.description}
              </span>
            </Link>
          ))}
        </Shelf>
      </div>
    </div>
  );
}
