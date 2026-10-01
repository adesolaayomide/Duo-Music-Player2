"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pause, Play } from "lucide-react";
import { jamendoProvider } from "@/lib/providers/jamendo";
import { usePlayerStore } from "@/store/playerStore";
import type { Album } from "@/types";

interface AlbumCardProps {
  album: Album;
}

export function AlbumCard({ album }: AlbumCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const currentTrack = usePlayerStore((s) => s.queue[s.currentIndex]);
  const status = usePlayerStore((s) => s.status);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const isCurrentAlbum = currentTrack?.albumId === album.id;
  const isPlaying = isCurrentAlbum && status === "playing";

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isCurrentAlbum) {
      togglePlay();
      return;
    }

    if (album.tracks && album.tracks.length > 0) {
      playQueue(album.tracks, 0);
      return;
    }

    try {
      setLoading(true);
      const fullAlbum = await jamendoProvider.getAlbum(album.id);
      if (fullAlbum.tracks && fullAlbum.tracks.length > 0) {
        playQueue(fullAlbum.tracks, 0);
      }
    } catch {
      // Fallback navigation if instant play fails
      router.push(`/album/${album.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link
      href={`/album/${album.id}`}
      className="group relative flex flex-col rounded-md bg-[var(--color-bg-elevated)] p-3 transition-all duration-200 hover:bg-[var(--color-bg-hover)]"
    >
      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded shadow-lg bg-[var(--color-bg-surface)]">
        <Image
          src={album.coverUrl || "/images/fallback-cover.svg"}
          alt={album.title}
          fill
          sizes="(max-width: 768px) 160px, 200px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />

        <button
          onClick={handlePlayClick}
          disabled={loading}
          className={`absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] text-black shadow-xl transition-all duration-200 hover:scale-105 ${
            isPlaying || isCurrentAlbum || loading
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
          }`}
          aria-label={
            isPlaying ? `Pause ${album.title}` : `Play ${album.title}`
          }
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-black" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 fill-current ml-0.5" />
          )}
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-sm text-[var(--color-text-primary)]">
          {album.title}
        </div>
        <div className="truncate text-xs text-[var(--color-text-secondary)] mt-1">
          {album.year ? `${album.year} • ` : "Album • "}
          {album.artistName}
        </div>
      </div>
    </Link>
  );
}
