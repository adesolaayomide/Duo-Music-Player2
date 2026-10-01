"use client";

import React, { useState } from "react";
import { X, Music } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePlaylists } from "@/hooks/usePlaylists";
import type { Playlist } from "@/types";

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "create" | "edit";
  playlistToEdit?: Playlist;
  onSuccess?: (playlist?: Playlist) => void;
}

export function PlaylistModal({
  isOpen,
  onClose,
  mode = "create",
  playlistToEdit,
  onSuccess,
}: PlaylistModalProps) {
  const { createPlaylist, updatePlaylist } = usePlaylists();
  const [name, setName] = useState(playlistToEdit?.name || "");
  const [description, setDescription] = useState(
    playlistToEdit?.description || "",
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (mode === "edit" && playlistToEdit) {
        await updatePlaylist(playlistToEdit.id, {
          name: name.trim(),
          description: description.trim(),
        });
        onSuccess?.();
      } else {
        const created = await createPlaylist(name.trim(), description.trim());
        onSuccess?.(created);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-xl border border-[var(--color-bg-hover)] bg-[var(--color-bg-elevated)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-bg-surface)] text-[var(--color-accent)] border border-[var(--color-bg-hover)]">
            <Music className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {mode === "create"
                ? "Create new playlist"
                : "Edit playlist details"}
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {mode === "create"
                ? "Give your playlist a name and description."
                : "Update your playlist information."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chill Beats, Late Night Focus"
              className="w-full rounded-md border border-[var(--color-bg-hover)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-white placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
              Description (optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add an optional description"
              className="w-full resize-none rounded-md border border-[var(--color-bg-hover)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-white placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-[var(--color-text-secondary)] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading || !name.trim()}
              className="rounded-full px-6"
            >
              {loading ? "Saving..." : mode === "create" ? "Create" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
