"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Music, Play, Plus, Search } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { PlaylistModal } from "@/components/media/PlaylistModal";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useLikedSongs } from "@/hooks/useLikedSongs";
import { usePlayerStore } from "@/store/playerStore";
import type { Playlist } from "@/types";

type FilterTab = "all" | "playlists" | "albums" | "artists";

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { playlists } = usePlaylists();
  const { likedTracks, count: likedCount } = useLikedSongs();
  const playQueue = usePlayerStore((s) => s.playQueue);

  const handlePlayLiked = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (likedTracks.length > 0) {
      playQueue(likedTracks, 0);
    }
  };

  const handlePlayPlaylist = (e: React.MouseEvent, pl: Playlist) => {
    e.preventDefault();
    e.stopPropagation();
    if (pl.tracks && pl.tracks.length > 0) {
      playQueue(pl.tracks, 0);
    }
  };

  const showLikedCard = activeTab === "all" || activeTab === "playlists";
  const showPlaylists = activeTab === "all" || activeTab === "playlists";

  return (
    <div className="flex flex-col min-h-full">
      <TopBar />

      <div className="px-6 py-6 -mt-16 pt-20">
        {/* ── Header with Title & Action ──────────────── */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Your Library
          </h1>
          <Button
            onClick={() => setCreateModalOpen(true)}
            variant="secondary"
            size="sm"
            className="flex items-center gap-1.5 rounded-full px-4 text-xs font-bold"
          >
            <Plus size={16} />
            <span>Create playlist</span>
          </Button>
        </div>

        {/* ── Filter Pills ───────────────────────────── */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
          {(["all", "playlists", "albums", "artists"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
                activeTab === tab
                  ? "bg-white text-black"
                  : "bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-bg-hover)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Grid of Library Items ──────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {/* Liked Songs Card */}
          {showLikedCard && (
            <Link
              href="/liked"
              className="group relative flex flex-col justify-end col-span-2 sm:col-span-2 rounded-lg p-5 bg-gradient-to-br from-[#450af5] to-[#8c52ff] shadow-lg hover:brightness-105 transition overflow-hidden min-h-[180px]"
            >
              <div className="absolute right-4 top-4 text-white/20 group-hover:text-white/40 transition">
                <Heart size={64} fill="currentColor" />
              </div>

              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-1">
                  Liked Songs
                </h3>
                <p className="text-xs text-white/80 font-medium">
                  {likedCount} liked {likedCount === 1 ? "song" : "songs"}
                </p>
              </div>

              {likedCount > 0 && (
                <button
                  onClick={handlePlayLiked}
                  aria-label="Play liked songs"
                  className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)] text-black shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition duration-200 hover:scale-105"
                >
                  <Play
                    size={20}
                    fill="currentColor"
                    className="translate-x-0.5"
                  />
                </button>
              )}
            </Link>
          )}

          {/* User Playlists */}
          {showPlaylists &&
            playlists.map((pl) => (
              <Link
                key={pl.id}
                href={`/playlist/${pl.id}`}
                className="group relative flex flex-col rounded-md bg-[var(--color-bg-surface)] p-3 hover:bg-[var(--color-bg-hover)] transition"
              >
                <div className="relative aspect-square w-full rounded overflow-hidden bg-[var(--color-bg-elevated)] mb-3 flex items-center justify-center shadow-md">
                  {pl.coverUrl ? (
                    <Image
                      src={pl.coverUrl}
                      alt={pl.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 20vw"
                      className="object-cover"
                    />
                  ) : (
                    <Music
                      size={40}
                      className="text-[var(--color-text-muted)]"
                    />
                  )}

                  {pl.tracks.length > 0 && (
                    <button
                      onClick={(e) => handlePlayPlaylist(e, pl)}
                      aria-label={`Play ${pl.name}`}
                      className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] text-black shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition duration-200 hover:scale-105"
                    >
                      <Play
                        size={18}
                        fill="currentColor"
                        className="translate-x-0.5"
                      />
                    </button>
                  )}
                </div>

                <h4 className="font-semibold text-sm text-white truncate">
                  {pl.name}
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] truncate mt-1">
                  Playlist • {pl.tracks.length}{" "}
                  {pl.tracks.length === 1 ? "song" : "songs"}
                </p>
              </Link>
            ))}
        </div>

        {/* Empty State for Albums or Artists */}
        {(activeTab === "albums" || activeTab === "artists") && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h3 className="text-lg font-bold text-white capitalize">
              No saved {activeTab} yet
            </h3>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)] max-w-sm">
              Discover and browse {activeTab} from our Creative Commons catalog.
            </p>
            <Link
              href="/search"
              className="mt-4 flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-bold text-black hover:scale-105 transition"
            >
              <Search className="h-4 w-4" />
              <span>Explore {activeTab}</span>
            </Link>
          </div>
        )}

        {/* Empty State for Playlists when user has 0 playlists */}
        {showPlaylists && playlists.length === 0 && (
          <div className="mt-8 rounded-xl border border-[var(--color-bg-hover)] bg-[var(--color-bg-surface)] p-8 text-center max-w-md mx-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-hover)] mx-auto mb-3 text-[var(--color-accent)]">
              <Plus size={24} />
            </div>
            <h3 className="font-bold text-white text-base">
              Create your first playlist
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 mb-4">
              It&apos;s easy, we&apos;ll help you organize your favorite tracks.
            </p>
            <Button
              onClick={() => setCreateModalOpen(true)}
              variant="primary"
              size="sm"
              className="rounded-full px-5"
            >
              Create playlist
            </Button>
          </div>
        )}
      </div>

      <PlaylistModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        mode="create"
      />
    </div>
  );
}
