"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pause, Play } from "lucide-react";
import { jamendoProvider } from "@/lib/providers/jamendo";
import { usePlayerStore } from "@/store/playerStore";
import type { Artist } from "@/types";

interface ArtistCardProps {
  artist: Artist;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const currentTrack = usePlayerStore((s) => s.queue[s.currentIndex]);
  const status = usePlayerStore((s) => s.status);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const isCurrentArtist = currentTrack?.artistId === artist.id;
  const isPlaying = isCurrentArtist && status === "playing";

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isCurrentArtist) {
      togglePlay();
      return;
    }

    if (artist.topTracks && artist.topTracks.length > 0) {
      playQueue(artist.topTracks, 0);
      return;
    }

    try {
      setLoading(true);
      const fullArtist = await jamendoProvider.getArtist(artist.id);
      if (fullArtist.topTracks && fullArtist.topTracks.length > 0) {
        playQueue(fullArtist.topTracks, 0);
      }
    } catch {
      router.push(`/artist/${artist.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link
      href={`/artist/${artist.id}`}
      className="group relative flex flex-col rounded-md bg-[var(--color-bg-elevated)] p-3 transition-all duration-200 hover:bg-[var(--color-bg-hover)]"
    >
      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-full shadow-lg bg-[var(--color-bg-surface)]">
        <Image
          src={artist.imageUrl || "/images/fallback-artist.svg"}
          alt={artist.name}
          fill
          sizes="(max-width: 768px) 160px, 200px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />

        <button
          onClick={handlePlayClick}
          disabled={loading}
          className={`absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] text-black shadow-xl transition-all duration-200 hover:scale-105 ${
            isPlaying || isCurrentArtist || loading
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
          }`}
          aria-label={
            isPlaying ? `Pause ${artist.name}` : `Play ${artist.name}`
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
          {artist.name}
        </div>
        <div className="truncate text-xs text-[var(--color-text-secondary)] mt-1">
          Artist
        </div>
      </div>
    </Link>
  );
}
