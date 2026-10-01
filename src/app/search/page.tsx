"use client";

import React, { Suspense, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Play, Pause, Search as SearchIcon, X } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { AlbumCard } from "@/components/media/AlbumCard";
import { ArtistCard } from "@/components/media/ArtistCard";
import { Shelf } from "@/components/media/Shelf";
import { TrackRow } from "@/components/media/TrackRow";
import { SkeletonCard, SkeletonTrackRow } from "@/components/ui/Skeleton";
import { useSearch } from "@/hooks/useCatalog";
import { GENRES } from "@/lib/utils/genres";
import { usePlayerStore } from "@/store/playerStore";
import type { Track } from "@/types";

type SearchTab = "all" | "tracks" | "albums" | "artists";

const RECENT_SEARCHES_KEY = "duo_recent_searches";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const urlQuery = searchParams.get("q") || "";
  const activeTab = (searchParams.get("tab") as SearchTab) || "all";

  const [inputValue, setInputValue] = useState(urlQuery);
  const [prevQuery, setPrevQuery] = useState(urlQuery);

  // Sync state during render when URL query changes externally
  if (prevQuery !== urlQuery) {
    setPrevQuery(urlQuery);
    setInputValue(urlQuery);
  }

  // Load recent searches lazily from localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Debounced URL synchronization (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = inputValue.trim();
      if (trimmed !== urlQuery) {
        startTransition(() => {
          const params = new URLSearchParams();
          if (trimmed) {
            params.set("q", trimmed);
            if (activeTab !== "all") {
              params.set("tab", activeTab);
            }
            // Update recent searches
            setRecentSearches((prev) => {
              const filtered = prev.filter(
                (s) => s.toLowerCase() !== trimmed.toLowerCase(),
              );
              const updated = [trimmed, ...filtered].slice(0, 8);
              try {
                localStorage.setItem(
                  RECENT_SEARCHES_KEY,
                  JSON.stringify(updated),
                );
              } catch {
                // ignore
              }
              return updated;
            });
          }
          const queryString = params.toString();
          router.replace(`/search${queryString ? `?${queryString}` : ""}`, {
            scroll: false,
          });
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, urlQuery, activeTab, router]);

  // Query catalog API
  const { data, isLoading } = useSearch(urlQuery, activeTab);

  const removeRecentSearch = (item: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== item);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  const handleTabChange = (tab: SearchTab) => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (inputValue.trim()) {
        params.set("q", inputValue.trim());
      }
      if (tab !== "all") {
        params.set("tab", tab);
      }
      const queryString = params.toString();
      router.replace(`/search${queryString ? `?${queryString}` : ""}`, {
        scroll: false,
      });
    });
  };

  const tracks = data?.tracks || [];
  const albums = data?.albums || [];
  const artists = data?.artists || [];
  const hasResults =
    tracks.length > 0 || albums.length > 0 || artists.length > 0;

  // Player hooks for Top Result card
  const currentTrack = usePlayerStore((s) => s.queue[s.currentIndex]);
  const status = usePlayerStore((s) => s.status);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const topTrack: Track | undefined = tracks[0];
  const isTopPlaying =
    topTrack && currentTrack?.id === topTrack.id && status === "playing";

  const handleTopResultPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!topTrack) return;
    if (currentTrack?.id === topTrack.id) {
      togglePlay();
    } else {
      playQueue(tracks, 0);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* ── TopBar with integrated Search Input ──── */}
      <TopBar>
        <div className="relative flex items-center w-full">
          <SearchIcon className="absolute left-3 h-4 w-4 text-[var(--color-text-muted)] pointer-events-none" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="What do you want to listen to?"
            className="w-full rounded-full bg-[var(--color-bg-hover)] py-2 pl-9 pr-9 text-xs sm:text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-hidden focus:ring-2 focus:ring-white transition"
            autoFocus={!urlQuery}
          />
          {inputValue && (
            <button
              onClick={() => {
                setInputValue("");
                router.replace("/search", { scroll: false });
              }}
              className="absolute right-3 p-0.5 rounded-full hover:bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:text-white"
              aria-label="Clear search input"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </TopBar>

      <div className="px-6 pb-24 flex flex-col gap-6 -mt-16 pt-20">
        {/* ── Search Category Tabs (Shown when query has text) ──── */}
        {urlQuery.trim() && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(["all", "tracks", "albums", "artists"] as const).map((tab) => {
              const label =
                tab === "all"
                  ? "All"
                  : tab === "tracks"
                    ? "Songs"
                    : tab === "albums"
                      ? "Albums"
                      : "Artists";
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-white text-black"
                      : "bg-[var(--color-bg-hover)]/70 text-white hover:bg-[var(--color-bg-hover)]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Case 1: Empty Query State (Browse All + Recent Searches) ──── */}
        {!urlQuery.trim() && (
          <div className="flex flex-col gap-8">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                    Recent searches
                  </h2>
                  <button
                    onClick={clearAllRecent}
                    className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-white hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      onClick={() => setInputValue(term)}
                      className="group flex items-center gap-2 rounded-full bg-[var(--color-bg-hover)]/80 hover:bg-[var(--color-bg-hover)] px-3.5 py-1.5 text-xs font-medium text-[var(--color-text-primary)] cursor-pointer transition"
                    >
                      <Clock className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                      <span>{term}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentSearch(term);
                        }}
                        className="rounded-full p-0.5 text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-bg-surface)]"
                        aria-label={`Remove ${term}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Browse All Genres */}
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mb-4">
                Browse all
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {GENRES.map((genre) => (
                  <Link
                    key={genre.id}
                    href={`/genre/${genre.id}`}
                    style={{ backgroundColor: genre.color }}
                    className="group relative flex h-32 flex-col justify-between overflow-hidden rounded-lg p-4 font-bold text-white shadow-md transition-transform duration-200 hover:scale-[1.03]"
                  >
                    <span className="text-lg md:text-xl drop-shadow">
                      {genre.name}
                    </span>
                    <span className="text-[11px] font-normal opacity-80 line-clamp-2">
                      {genre.description}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ── Case 2: Query Loading ──── */}
        {urlQuery.trim() && isLoading && (
          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <SkeletonTrackRow />
              <SkeletonTrackRow />
              <SkeletonTrackRow />
              <SkeletonTrackRow />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 mt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        )}

        {/* ── Case 3: Empty Search Results ──── */}
        {urlQuery.trim() && !isLoading && !hasResults && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
              No results found for &ldquo;{urlQuery}&rdquo;
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)] max-w-md">
              Please make sure your words are spelled correctly, or use fewer or
              different keywords.
            </p>
          </div>
        )}

        {/* ── Case 4: Results Display ──── */}
        {urlQuery.trim() && !isLoading && hasResults && (
          <div className="flex flex-col gap-8">
            {/* ── Tab: ALL ──── */}
            {activeTab === "all" && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
                  {/* Top Result Card */}
                  {topTrack && (
                    <div>
                      <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-3">
                        Top result
                      </h2>
                      <div
                        onClick={handleTopResultPlay}
                        className="group relative flex flex-col justify-between rounded-lg bg-[var(--color-bg-elevated)] p-5 transition hover:bg-[var(--color-bg-hover)] cursor-pointer h-full shadow-lg"
                      >
                        <div>
                          <div className="relative h-24 w-24 overflow-hidden rounded-md shadow-md mb-4 bg-[var(--color-bg-surface)]">
                            <Image
                              src={
                                topTrack.coverUrl ||
                                "/images/fallback-cover.svg"
                              }
                              alt={topTrack.title}
                              fill
                              sizes="96px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="text-2xl font-black text-[var(--color-text-primary)] line-clamp-1">
                            {topTrack.title}
                          </div>
                          <div className="mt-1 text-sm text-[var(--color-text-secondary)]">
                            <span className="font-semibold text-white">
                              {topTrack.artistName}
                            </span>
                            <span className="ml-2 inline-block rounded-full bg-[var(--color-bg-hover)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                              Song
                            </span>
                          </div>
                        </div>

                        {/* Floating Green Play Button */}
                        <div className="mt-6 flex justify-end">
                          <button
                            onClick={handleTopResultPlay}
                            className={`flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)] text-black shadow-xl transition-all duration-200 hover:scale-105 ${
                              isTopPlaying
                                ? "opacity-100"
                                : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
                            }`}
                            aria-label={
                              isTopPlaying
                                ? `Pause ${topTrack.title}`
                                : `Play ${topTrack.title}`
                            }
                          >
                            {isTopPlaying ? (
                              <Pause className="h-6 w-6 fill-current" />
                            ) : (
                              <Play className="h-6 w-6 fill-current ml-0.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Songs List (Top 4) */}
                  {tracks.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-3">
                        Songs
                      </h2>
                      <div className="flex flex-col">
                        {tracks.slice(0, 4).map((track, i) => (
                          <TrackRow
                            key={track.id}
                            track={track}
                            index={i}
                            contextQueue={tracks}
                            showAlbum={false}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Artists Shelf */}
                {artists.length > 0 && (
                  <Shelf title="Artists">
                    {artists.map((artist) => (
                      <div key={artist.id} className="w-36 sm:w-44 shrink-0">
                        <ArtistCard artist={artist} />
                      </div>
                    ))}
                  </Shelf>
                )}

                {/* Albums Shelf */}
                {albums.length > 0 && (
                  <Shelf title="Albums">
                    {albums.map((album) => (
                      <div key={album.id} className="w-36 sm:w-44 shrink-0">
                        <AlbumCard album={album} />
                      </div>
                    ))}
                  </Shelf>
                )}
              </>
            )}

            {/* ── Tab: SONGS ──── */}
            {activeTab === "tracks" && (
              <div className="flex flex-col">
                {tracks.map((track, i) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={i}
                    contextQueue={tracks}
                    showAlbum
                  />
                ))}
              </div>
            )}

            {/* ── Tab: ALBUMS ──── */}
            {activeTab === "albums" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {albums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            )}

            {/* ── Tab: ARTISTS ──── */}
            {activeTab === "artists" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {artists.map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-full">
          <TopBar />
          <div className="px-6 py-6 -mt-16 pt-20">
            <SkeletonTrackRow />
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
