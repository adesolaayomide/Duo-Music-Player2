import { create } from "zustand";
import type { Playlist, Track } from "@/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";

const PLAYLISTS_STORAGE_KEY = "duo_user_playlists";

interface PlaylistsState {
  playlists: Playlist[];
  isLoading: boolean;
  isInitialized: boolean;
  initPlaylists: () => Promise<void>;
  createPlaylist: (name: string, description?: string) => Promise<Playlist>;
  updatePlaylist: (
    id: string,
    updates: { name?: string; description?: string },
  ) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, track: Track) => Promise<boolean>;
  removeTrackFromPlaylist: (
    playlistId: string,
    trackId: string,
  ) => Promise<void>;
  reorderPlaylistTracks: (
    playlistId: string,
    fromIndex: number,
    toIndex: number,
  ) => Promise<void>;
  getPlaylist: (id: string) => Playlist | undefined;
}

export const usePlaylistsStore = create<PlaylistsState>((set, get) => ({
  playlists: [],
  isLoading: false,
  isInitialized: false,

  initPlaylists: async () => {
    if (get().isInitialized) return;
    set({ isLoading: true });

    // 1. Read from localStorage for immediate load
    let localPlaylists: Playlist[] = [];
    try {
      const stored = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
      if (stored) {
        localPlaylists = JSON.parse(stored) as Playlist[];
      }
    } catch {
      // ignore
    }

    const supabase = getSupabaseBrowserClient();
    const user = useAuthStore.getState().user;

    if (!supabase || !user) {
      set({
        playlists: localPlaylists,
        isLoading: false,
        isInitialized: true,
      });
      return;
    }

    // 2. Fetch from Supabase
    try {
      const { data: dbPlaylists, error: plError } = await supabase
        .from("playlists")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (plError) throw plError;

      if (!dbPlaylists || dbPlaylists.length === 0) {
        // If Supabase has no playlists but local has, we can sync local to Supabase
        if (localPlaylists.length > 0) {
          for (const lp of localPlaylists) {
            const { data: insertedPl } = await supabase
              .from("playlists")
              .insert({
                owner_id: user.id,
                name: lp.name,
                description: lp.description || null,
                cover_url: lp.coverUrl || null,
                is_public: lp.isPublic,
              })
              .select()
              .single();

            if (insertedPl && lp.tracks.length > 0) {
              const trackRows = lp.tracks.map((t, idx) => ({
                playlist_id: insertedPl.id,
                track_ref: t,
                position: idx,
              }));
              await supabase.from("playlist_tracks").insert(trackRows);
            }
          }
        }
        set({
          playlists: localPlaylists,
          isLoading: false,
          isInitialized: true,
        });
        return;
      }

      // Fetch tracks for all user playlists
      const playlistIds = dbPlaylists.map((p) => p.id);
      const { data: dbTracks, error: trkError } = await supabase
        .from("playlist_tracks")
        .select("*")
        .in("playlist_id", playlistIds)
        .order("position", { ascending: true });

      if (trkError) throw trkError;

      const fullPlaylists: Playlist[] = dbPlaylists.map((p) => {
        const tracks = (dbTracks || [])
          .filter((t) => t.playlist_id === p.id)
          .map((t) => t.track_ref as Track);

        return {
          id: p.id,
          name: p.name,
          description: p.description || undefined,
          coverUrl: p.cover_url || tracks[0]?.coverUrl || undefined,
          ownerId: p.owner_id,
          ownerName: user.username,
          isPublic: p.is_public,
          tracks,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        };
      });

      set({
        playlists: fullPlaylists,
        isLoading: false,
        isInitialized: true,
      });

      try {
        localStorage.setItem(
          PLAYLISTS_STORAGE_KEY,
          JSON.stringify(fullPlaylists),
        );
      } catch {
        // ignore
      }
    } catch (err) {
      console.warn("Failed to load playlists from Supabase, using local:", err);
      set({
        playlists: localPlaylists,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  createPlaylist: async (name: string, description?: string) => {
    const user = useAuthStore.getState().user;
    const now = new Date().toISOString();
    const tempId = "user-pl-" + Math.random().toString(36).substring(2, 9);

    const newPlaylist: Playlist = {
      id: tempId,
      name: name.trim() || "My Playlist",
      description: description?.trim() || undefined,
      ownerId: user?.id || null,
      ownerName: user?.username || "You",
      isPublic: true,
      tracks: [],
      createdAt: now,
      updatedAt: now,
    };

    const supabase = getSupabaseBrowserClient();

    if (supabase && user) {
      try {
        const { data, error } = await supabase
          .from("playlists")
          .insert({
            owner_id: user.id,
            name: newPlaylist.name,
            description: newPlaylist.description || null,
            cover_url: null,
            is_public: true,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          newPlaylist.id = data.id;
          newPlaylist.createdAt = data.created_at;
          newPlaylist.updatedAt = data.updated_at;
        }
      } catch (err) {
        console.warn(
          "Failed to create playlist on Supabase, saved locally:",
          err,
        );
      }
    }

    set((s) => {
      const updated = [newPlaylist, ...s.playlists];
      try {
        localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return { playlists: updated };
    });

    useUIStore.getState().addToast({
      type: "info",
      message: `Created playlist "${newPlaylist.name}"`,
    });

    return newPlaylist;
  },

  updatePlaylist: async (
    id: string,
    updates: { name?: string; description?: string },
  ) => {
    const { playlists } = get();
    const target = playlists.find((p) => p.id === id);
    if (!target) return;

    const now = new Date().toISOString();
    const updatedPlaylists = playlists.map((p) => {
      if (p.id !== id) return p;
      return {
        ...p,
        name: updates.name?.trim() ? updates.name.trim() : p.name,
        description:
          updates.description !== undefined
            ? updates.description.trim()
            : p.description,
        updatedAt: now,
      };
    });

    set({ playlists: updatedPlaylists });
    try {
      localStorage.setItem(
        PLAYLISTS_STORAGE_KEY,
        JSON.stringify(updatedPlaylists),
      );
    } catch {
      // ignore
    }

    const supabase = getSupabaseBrowserClient();
    const user = useAuthStore.getState().user;

    if (supabase && user && !id.startsWith("user-pl-")) {
      try {
        await supabase
          .from("playlists")
          .update({
            name: updates.name?.trim() || target.name,
            description: updates.description?.trim() || null,
            updated_at: now,
          })
          .eq("id", id)
          .eq("owner_id", user.id);
      } catch (err) {
        console.warn("Failed to update playlist on Supabase:", err);
      }
    }

    useUIStore.getState().addToast({
      type: "info",
      message: `Playlist updated`,
    });
  },

  deletePlaylist: async (id: string) => {
    const { playlists } = get();
    const target = playlists.find((p) => p.id === id);
    if (!target) return;

    const updated = playlists.filter((p) => p.id !== id);
    set({ playlists: updated });

    try {
      localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    const supabase = getSupabaseBrowserClient();
    const user = useAuthStore.getState().user;

    if (supabase && user && !id.startsWith("user-pl-")) {
      try {
        await supabase
          .from("playlists")
          .delete()
          .eq("id", id)
          .eq("owner_id", user.id);
      } catch (err) {
        console.warn("Failed to delete playlist on Supabase:", err);
      }
    }

    useUIStore.getState().addToast({
      type: "info",
      message: `Deleted "${target.name}"`,
    });
  },

  addTrackToPlaylist: async (playlistId: string, track: Track) => {
    const { playlists } = get();
    const target = playlists.find((p) => p.id === playlistId);
    if (!target) return false;

    // Check if track is already in playlist
    if (target.tracks.some((t) => t.id === track.id)) {
      useUIStore.getState().addToast({
        type: "info",
        message: `Already in "${target.name}"`,
      });
      return false;
    }

    const updatedTracks = [...target.tracks, track];
    const updatedPlaylists = playlists.map((p) => {
      if (p.id !== playlistId) return p;
      return {
        ...p,
        tracks: updatedTracks,
        coverUrl: p.coverUrl || track.coverUrl,
        updatedAt: new Date().toISOString(),
      };
    });

    set({ playlists: updatedPlaylists });

    try {
      localStorage.setItem(
        PLAYLISTS_STORAGE_KEY,
        JSON.stringify(updatedPlaylists),
      );
    } catch {
      // ignore
    }

    const supabase = getSupabaseBrowserClient();
    const user = useAuthStore.getState().user;

    if (supabase && user && !playlistId.startsWith("user-pl-")) {
      try {
        await supabase.from("playlist_tracks").insert({
          playlist_id: playlistId,
          track_ref: track,
          position: updatedTracks.length - 1,
        });
      } catch (err) {
        console.warn("Failed to add track on Supabase:", err);
      }
    }

    useUIStore.getState().addToast({
      type: "info",
      message: `Added to "${target.name}"`,
    });

    return true;
  },

  removeTrackFromPlaylist: async (playlistId: string, trackId: string) => {
    const { playlists } = get();
    const target = playlists.find((p) => p.id === playlistId);
    if (!target) return;

    const updatedTracks = target.tracks.filter((t) => t.id !== trackId);
    const updatedPlaylists = playlists.map((p) => {
      if (p.id !== playlistId) return p;
      return {
        ...p,
        tracks: updatedTracks,
        coverUrl: updatedTracks[0]?.coverUrl || undefined,
        updatedAt: new Date().toISOString(),
      };
    });

    set({ playlists: updatedPlaylists });

    try {
      localStorage.setItem(
        PLAYLISTS_STORAGE_KEY,
        JSON.stringify(updatedPlaylists),
      );
    } catch {
      // ignore
    }

    const supabase = getSupabaseBrowserClient();
    const user = useAuthStore.getState().user;

    if (supabase && user && !playlistId.startsWith("user-pl-")) {
      try {
        // In supabase, delete by track id within playlist
        await supabase
          .from("playlist_tracks")
          .delete()
          .eq("playlist_id", playlistId)
          .eq("track_ref->>id", trackId);
      } catch (err) {
        console.warn("Failed to remove track from Supabase:", err);
      }
    }

    useUIStore.getState().addToast({
      type: "info",
      message: `Removed from "${target.name}"`,
    });
  },

  reorderPlaylistTracks: async (
    playlistId: string,
    fromIndex: number,
    toIndex: number,
  ) => {
    const { playlists } = get();
    const target = playlists.find((p) => p.id === playlistId);
    if (!target) return;

    if (
      fromIndex < 0 ||
      fromIndex >= target.tracks.length ||
      toIndex < 0 ||
      toIndex >= target.tracks.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    const newTracks = [...target.tracks];
    const moved = newTracks.splice(fromIndex, 1)[0]!;
    newTracks.splice(toIndex, 0, moved);

    const updatedPlaylists = playlists.map((p) => {
      if (p.id !== playlistId) return p;
      return {
        ...p,
        tracks: newTracks,
        updatedAt: new Date().toISOString(),
      };
    });

    set({ playlists: updatedPlaylists });

    try {
      localStorage.setItem(
        PLAYLISTS_STORAGE_KEY,
        JSON.stringify(updatedPlaylists),
      );
    } catch {
      // ignore
    }

    const supabase = getSupabaseBrowserClient();
    const user = useAuthStore.getState().user;

    if (supabase && user && !playlistId.startsWith("user-pl-")) {
      try {
        // Re-write positions
        await supabase
          .from("playlist_tracks")
          .delete()
          .eq("playlist_id", playlistId);
        const rows = newTracks.map((t, idx) => ({
          playlist_id: playlistId,
          track_ref: t,
          position: idx,
        }));
        await supabase.from("playlist_tracks").insert(rows);
      } catch (err) {
        console.warn("Failed to reorder tracks in Supabase:", err);
      }
    }
  },

  getPlaylist: (id: string) => {
    return get().playlists.find((p) => p.id === id);
  },
}));

export function usePlaylists() {
  const playlists = usePlaylistsStore((s) => s.playlists);
  const isLoading = usePlaylistsStore((s) => s.isLoading);
  const initPlaylists = usePlaylistsStore((s) => s.initPlaylists);
  const createPlaylist = usePlaylistsStore((s) => s.createPlaylist);
  const updatePlaylist = usePlaylistsStore((s) => s.updatePlaylist);
  const deletePlaylist = usePlaylistsStore((s) => s.deletePlaylist);
  const addTrackToPlaylist = usePlaylistsStore((s) => s.addTrackToPlaylist);
  const removeTrackFromPlaylist = usePlaylistsStore(
    (s) => s.removeTrackFromPlaylist,
  );
  const reorderPlaylistTracks = usePlaylistsStore(
    (s) => s.reorderPlaylistTracks,
  );
  const getPlaylist = usePlaylistsStore((s) => s.getPlaylist);

  return {
    playlists,
    count: playlists.length,
    isLoading,
    initPlaylists,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    reorderPlaylistTracks,
    getPlaylist,
  };
}
