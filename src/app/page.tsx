"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Play, Pause, RefreshCw } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { AlbumCard } from "@/components/media/AlbumCard";
import { PlaylistCard } from "@/components/media/PlaylistCard";
import { Shelf } from "@/components/media/Shelf";
import { TrackCard } from "@/components/media/TrackCard";
import { SkeletonShelf } from "@/components/ui/Skeleton";
import { useFeatured } from "@/hooks/useCatalog";
import { GENRES } from "@/lib/utils/genres";
import { usePlayerStore } from "@/store/playerStore";
import type { Track } from "@/types";

export default function HomePage() {
  const { data, isLoading, isError, refetch } = useFeatured();

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12
      ? "Good morning"
      : hour < 18
        ? "Good afternoon"
        : "Good evening";
  }, []);

  const playQueue = usePlayerStore((s) => s.playQueue);
  const currentTrack = usePlayerStore((s) => s.queue[s.currentIndex]);
  const status = usePlayerStore((s) => s.status);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const featuredTracks = useMemo(
    () => data?.featuredTracks || [],
    [data?.featuredTracks],
  );
  const popularAlbums = useMemo(
    () => data?.popularAlbums || [],
    [data?.popularAlbums],
  );
  const featuredPlaylists = useMemo(
    () => data?.featuredPlaylists || [],
    [data?.featuredPlaylists],
  );

  // 8 quick access items
  const quickAccessItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      image?: string;
      isLiked?: boolean;
      track?: Track;
    }> = [
      {
        id: "liked-songs",
        title: "Liked Songs",
        isLiked: true,
      },
    ];

    featuredTracks.slice(0, 7).forEach((track) => {
      items.push({
        id: track.id,
        title: track.title,
        image: track.coverUrl,
        track,
      });
    });

    return items;
  }, [featuredTracks]);

  const handleQuickPlay = (e: React.MouseEvent, track?: Track) => {
    e.preventDefault();
    e.stopPropagation();
    if (!track) return;

    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      const idx = featuredTracks.findIndex((t) => t.id === track.id);
      playQueue(featuredTracks, idx >= 0 ? idx : 0);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <TopBar />

      <div className="px-6 pb-24 flex flex-col gap-6 -mt-16 pt-20">
        {/* ── Greeting ───────────────────────────────── */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-black text-[var(--color-text-primary)]">
            {greeting}
          </h1>
          {isError && (
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:underline"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry loading</span>
            </button>
          )}
        </div>

        {/* ── Quick Access 2×4 Grid ──────────────────── */}
        <section
          aria-label="Quick access"
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {quickAccessItems.map((item) => {
            const isItemPlaying =
              item.track &&
              currentTrack?.id === item.track.id &&
              status === "playing";

            if (item.isLiked) {
              return (
                <Link
                  key={item.id}
                  href="/liked"
                  className="group relative flex items-center gap-3 bg-[var(--color-bg-hover)]/60 hover:bg-[var(--color-bg-hover)] rounded overflow-hidden transition-all duration-200 cursor-pointer shadow-md"
                >
                  <div className="h-14 w-14 shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-600 to-emerald-400">
                    <Heart className="h-6 w-6 fill-white text-white" />
                  </div>
                  <span className="text-sm font-bold text-[var(--color-text-primary)] truncate pr-2">
                    Liked Songs
                  </span>
                </Link>
              );
            }

            return (
              <div
                key={item.id}
                onClick={(e) => handleQuickPlay(e, item.track)}
                role="button"
                tabIndex={0}
                aria-label={`Play ${item.title}`}
                className="group relative flex items-center gap-3 bg-[var(--color-bg-hover)]/60 hover:bg-[var(--color-bg-hover)] rounded overflow-hidden transition-all duration-200 cursor-pointer shadow-md pr-12"
              >
                <div className="relative h-14 w-14 shrink-0 bg-[var(--color-bg-surface)]">
                  <Image
                    src={item.image || "/images/fallback-cover.svg"}
                    alt={item.title}
                    fill
                    sizes="56px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <span className="text-sm font-bold text-[var(--color-text-primary)] truncate">
                  {item.title}
                </span>

                {/* Floating play button */}
                <button
                  onClick={(e) => handleQuickPlay(e, item.track)}
                  className={`absolute right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-black shadow-lg transition-all duration-200 hover:scale-105 ${
                    isItemPlaying
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100"
                  }`}
                  aria-label={
                    isItemPlaying ? `Pause ${item.title}` : `Play ${item.title}`
                  }
                >
                  {isItemPlaying ? (
                    <Pause className="h-4 w-4 fill-current" />
                  ) : (
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                  )}
                </button>
              </div>
            );
          })}
        </section>

        {/* ── Loading Skeleton / Shelves ─────────────── */}
        {isLoading ? (
          <div className="flex flex-col gap-6 mt-4">
            <SkeletonShelf cardCount={6} />
            <SkeletonShelf cardCount={6} />
            <SkeletonShelf cardCount={6} />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Shelf 1: Featured & Trending Tracks */}
            {featuredTracks.length > 0 && (
              <Shelf
                title="Featured Tracks"
                subtitle="Popular free releases on Jamendo"
              >
                {featuredTracks.map((track) => (
                  <div key={track.id} className="w-36 sm:w-44 shrink-0">
                    <TrackCard track={track} contextQueue={featuredTracks} />
                  </div>
                ))}
              </Shelf>
            )}

            {/* Shelf 2: Popular Albums */}
            {popularAlbums.length > 0 && (
              <Shelf
                title="Popular Albums"
                subtitle="Top community-selected albums"
              >
                {popularAlbums.map((album) => (
                  <div key={album.id} className="w-36 sm:w-44 shrink-0">
                    <AlbumCard album={album} />
                  </div>
                ))}
              </Shelf>
            )}

            {/* Shelf 3: Featured Playlists */}
            {featuredPlaylists.length > 0 && (
              <Shelf
                title="Curated Playlists"
                subtitle="Community mixes and collections"
              >
                {featuredPlaylists.map((playlist) => (
                  <div key={playlist.id} className="w-36 sm:w-44 shrink-0">
                    <PlaylistCard playlist={playlist} />
                  </div>
                ))}
              </Shelf>
            )}
          </div>
        )}

        {/* ── Always-Available Shelf: Explore Genres ──── */}
        <Shelf
          title="Explore Genres"
          subtitle="Dive into diverse musical styles"
        >
          {GENRES.map((genre) => (
            <Link
              key={genre.id}
              href={`/genre/${genre.id}`}
              style={{ backgroundColor: genre.color }}
              className="group relative flex h-28 w-36 sm:w-44 shrink-0 flex-col justify-between overflow-hidden rounded-md p-3.5 font-bold text-white shadow-lg transition-transform duration-200 hover:scale-[1.03]"
            >
              <span className="text-base leading-tight drop-shadow">
                {genre.name}
              </span>
              <span className="text-[10px] font-normal opacity-80 line-clamp-2">
                {genre.description}
              </span>
            </Link>
          ))}
        </Shelf>
      </div>
    </div>
  );
}
