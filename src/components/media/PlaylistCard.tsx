'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Play } from 'lucide-react';
import { jamendoProvider } from '@/lib/providers/jamendo';
import { usePlayerStore } from '@/store/playerStore';
import type { Playlist } from '@/types';

interface PlaylistCardProps {
  playlist: Playlist;
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const playQueue = usePlayerStore((s) => s.playQueue);

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (playlist.tracks && playlist.tracks.length > 0) {
      playQueue(playlist.tracks, 0);
      return;
    }

    try {
      setLoading(true);
      const fullPlaylist = await jamendoProvider.getPlaylist(playlist.id);
      if (fullPlaylist.tracks && fullPlaylist.tracks.length > 0) {
        playQueue(fullPlaylist.tracks, 0);
      }
    } catch {
      router.push(`/playlist/${playlist.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link
      href={`/playlist/${playlist.id}`}
      className="group relative flex flex-col rounded-md bg-[var(--color-bg-elevated)] p-3 transition-all duration-200 hover:bg-[var(--color-bg-hover)]"
    >
      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded shadow-lg bg-[var(--color-bg-surface)]">
        <Image
          src={playlist.coverUrl || '/images/fallback-cover.svg'}
          alt={playlist.name}
          fill
          sizes="(max-width: 768px) 160px, 200px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />

        <button
          onClick={handlePlayClick}
          disabled={loading}
          className={`absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] text-black shadow-xl transition-all duration-200 hover:scale-105 ${
            loading
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
          }`}
          aria-label={`Play ${playlist.name}`}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-black" />
          ) : (
            <Play className="h-5 w-5 fill-current ml-0.5" />
          )}
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-sm text-[var(--color-text-primary)]">
          {playlist.name}
        </div>
        <div className="truncate text-xs text-[var(--color-text-secondary)] mt-1">
          {playlist.description || `By ${playlist.ownerName || 'Jamendo Community'}`}
        </div>
      </div>
    </Link>
  );
}
