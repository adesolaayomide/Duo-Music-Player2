"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MoreHorizontal,
  Pause,
  Play,
  ListPlus,
  ArrowRightCircle,
  Disc,
  User,
  ShieldCheck,
  FolderPlus,
  Plus,
  Trash2,
} from "lucide-react";
import { formatDuration } from "@/lib/utils/helpers";
import { LicenseDialog } from "./LicenseDialog";
import { PlaylistModal } from "./PlaylistModal";
import { usePlayerStore } from "@/store/playerStore";
import { useLikedSongs } from "@/hooks/useLikedSongs";
import { usePlaylists } from "@/hooks/usePlaylists";
import type { Track } from "@/types";

interface TrackRowProps {
  track: Track;
  index: number;
  contextQueue?: Track[];
  showAlbum?: boolean;
  showCover?: boolean;
  playlistId?: string;
  onRemoveFromPlaylist?: (trackId: string) => void;
}

export function TrackRow({
  track,
  index,
  contextQueue,
  showAlbum = true,
  showCover = true,
  playlistId,
  onRemoveFromPlaylist,
}: TrackRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [playlistSubmenuOpen, setPlaylistSubmenuOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [licenseOpen, setLicenseOpen] = useState(false);

  const { isLiked: checkLiked, toggleLike } = useLikedSongs();
  const { playlists, addTrackToPlaylist, removeTrackFromPlaylist } =
    usePlaylists();
  const isLiked = checkLiked(track.id);

  const currentTrack = usePlayerStore((s) => s.queue[s.currentIndex]);
  const status = usePlayerStore((s) => s.status);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const playNext = usePlayerStore((s) => s.playNext);

  const isCurrentTrack = currentTrack?.id === track.id;
  const isPlaying = isCurrentTrack && status === "playing";

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentTrack) {
      togglePlay();
    } else {
      const queueToPlay =
        contextQueue && contextQueue.length > 0 ? contextQueue : [track];
      const targetIndex = contextQueue
        ? contextQueue.findIndex((t) => t.id === track.id)
        : 0;
      playQueue(queueToPlay, targetIndex >= 0 ? targetIndex : 0);
    }
  };

  const handleRowClick = () => {
    if (isCurrentTrack) {
      togglePlay();
    } else {
      const queueToPlay =
        contextQueue && contextQueue.length > 0 ? contextQueue : [track];
      const targetIndex = contextQueue
        ? contextQueue.findIndex((t) => t.id === track.id)
        : 0;
      playQueue(queueToPlay, targetIndex >= 0 ? targetIndex : 0);
    }
  };

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleLike(track);
  };

  return (
    <>
      <div
        onClick={handleRowClick}
        className={`group relative grid grid-cols-[16px_1fr_auto] md:grid-cols-[16px_4fr_3fr_minmax(120px,1fr)] items-center gap-4 rounded-md px-4 py-2 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-hover)]/60 cursor-pointer ${
          isCurrentTrack ? "bg-[var(--color-bg-hover)]/30" : ""
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleRowClick();
        }}
      >
        {/* Track Number / Play Indicator */}
        <div className="flex w-4 items-center justify-center text-xs font-medium">
          {isPlaying ? (
            <div className="flex items-end gap-[2px] h-3.5 group-hover:hidden">
              <span className="w-[3px] bg-[var(--color-accent)] animate-[bounce_0.8s_infinite_ease-in-out] h-full" />
              <span className="w-[3px] bg-[var(--color-accent)] animate-[bounce_0.6s_infinite_ease-in-out_0.2s] h-2/3" />
              <span className="w-[3px] bg-[var(--color-accent)] animate-[bounce_0.9s_infinite_ease-in-out_0.4s] h-4/5" />
            </div>
          ) : (
            <span
              className={`tabular-nums group-hover:hidden ${
                isCurrentTrack
                  ? "text-[var(--color-accent)] font-bold"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              {index + 1}
            </span>
          )}

          <button
            onClick={handlePlayClick}
            aria-label={isPlaying ? "Pause track" : "Play track"}
            className="hidden group-hover:flex items-center justify-center text-white hover:scale-110 transition"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-current text-white" />
            ) : (
              <Play className="h-4 w-4 fill-current text-white" />
            )}
          </button>
        </div>

        {/* Title + Artist + Cover */}
        <div className="flex items-center gap-3 min-w-0 pr-2">
          {showCover && (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-[var(--color-bg-surface)]">
              {track.coverUrl ? (
                <Image
                  src={track.coverUrl}
                  alt={track.title}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[var(--color-bg-hover)] text-xs text-[var(--color-text-muted)]">
                  ♪
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <span
              className={`truncate font-medium ${
                isCurrentTrack
                  ? "text-[var(--color-accent)] font-semibold"
                  : "text-[var(--color-text-primary)]"
              }`}
            >
              {track.title}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] truncate">
              {track.artistId ? (
                <Link
                  href={`/artist/${track.artistId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:underline hover:text-white truncate"
                >
                  {track.artistName}
                </Link>
              ) : (
                <span className="truncate">{track.artistName}</span>
              )}

              {/* Attribution badge */}
              {track.provider === "jamendo" && (
                <span className="shrink-0 rounded px-1 py-0.2 bg-[var(--color-bg-surface)] text-[9px] font-semibold text-[var(--color-text-muted)] border border-[var(--color-bg-hover)]">
                  CC
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Album Name (Hidden on small mobile) */}
        {showAlbum && (
          <div className="hidden md:block truncate text-xs text-[var(--color-text-muted)]">
            {track.albumId ? (
              <Link
                href={`/album/${track.albumId}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:underline hover:text-white"
              >
                {track.albumName || "—"}
              </Link>
            ) : (
              track.albumName || "—"
            )}
          </div>
        )}

        {/* Duration + Actions */}
        <div className="flex items-center justify-end gap-3 text-xs">
          {/* Like Heart */}
          <button
            onClick={handleToggleLike}
            className={`transition ${
              isLiked
                ? "text-[var(--color-accent)] opacity-100"
                : "text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:text-white"
            }`}
            aria-label={isLiked ? "Unlike track" : "Like track"}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
          </button>

          {/* Duration */}
          <span className="w-10 text-right tabular-nums text-[var(--color-text-muted)]">
            {formatDuration(track.duration)}
          </span>

          {/* More Actions Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
                setPlaylistSubmenuOpen(false);
              }}
              className="rounded p-1 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:text-white"
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    setPlaylistSubmenuOpen(false);
                  }}
                />
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full z-50 mt-1 w-52 rounded-md border border-[var(--color-bg-hover)] bg-[var(--color-bg-surface)] p-1.5 shadow-xl text-xs text-[var(--color-text-primary)]"
                >
                  <button
                    onClick={() => {
                      playNext(track);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 hover:bg-[var(--color-bg-hover)]"
                  >
                    <ArrowRightCircle className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                    <span>Play next</span>
                  </button>
                  <button
                    onClick={() => {
                      addToQueue(track);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 hover:bg-[var(--color-bg-hover)]"
                  >
                    <ListPlus className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                    <span>Add to queue</span>
                  </button>

                  {/* Add to playlist submenu */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setPlaylistSubmenuOpen(!playlistSubmenuOpen)
                      }
                      className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-[var(--color-bg-hover)]"
                    >
                      <div className="flex items-center gap-2">
                        <FolderPlus className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                        <span>Add to playlist</span>
                      </div>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        ▶
                      </span>
                    </button>

                    {playlistSubmenuOpen && (
                      <div className="mt-1 rounded-md border border-[var(--color-bg-hover)] bg-[var(--color-bg-elevated)] p-1 max-h-48 overflow-y-auto shadow-2xl">
                        <button
                          onClick={() => {
                            setCreateModalOpen(true);
                            setMenuOpen(false);
                            setPlaylistSubmenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-[var(--color-bg-hover)] text-[var(--color-accent)] font-semibold"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>New playlist</span>
                        </button>
                        {playlists.map((pl) => (
                          <button
                            key={pl.id}
                            onClick={async () => {
                              await addTrackToPlaylist(pl.id, track);
                              setMenuOpen(false);
                              setPlaylistSubmenuOpen(false);
                            }}
                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-[var(--color-bg-hover)] truncate text-[var(--color-text-secondary)] hover:text-white"
                          >
                            <span className="truncate">{pl.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Optional Remove from this playlist */}
                  {(playlistId || onRemoveFromPlaylist) && (
                    <button
                      onClick={async () => {
                        if (onRemoveFromPlaylist) {
                          onRemoveFromPlaylist(track.id);
                        } else if (playlistId) {
                          await removeTrackFromPlaylist(playlistId, track.id);
                        }
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 hover:bg-red-500/20 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove from this playlist</span>
                    </button>
                  )}

                  {track.albumId && (
                    <Link
                      href={`/album/${track.albumId}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 hover:bg-[var(--color-bg-hover)]"
                    >
                      <Disc className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                      <span>Go to album</span>
                    </Link>
                  )}
                  {track.artistId && (
                    <Link
                      href={`/artist/${track.artistId}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 hover:bg-[var(--color-bg-hover)]"
                    >
                      <User className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                      <span>Go to artist</span>
                    </Link>
                  )}
                  <div className="my-1 border-t border-[var(--color-bg-hover)]" />
                  <button
                    onClick={() => {
                      setLicenseOpen(true);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-white"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                    <span>License info</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <LicenseDialog
        track={track}
        isOpen={licenseOpen}
        onClose={() => setLicenseOpen(false)}
      />

      <PlaylistModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        mode="create"
        onSuccess={async (newPl) => {
          if (newPl) {
            await addTrackToPlaylist(newPl.id, track);
          }
        }}
      />
    </>
  );
}
