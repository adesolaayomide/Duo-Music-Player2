import { create } from "zustand";
import type { Track } from "@/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";

const LIKED_STORAGE_KEY = "duo_liked_tracks";

interface LikedSongsState {
  likedTracks: Track[];
  likedIds: Set<string>;
  isLoading: boolean;
  isInitialized: boolean;
  initLikedSongs: () => Promise<void>;
  isLiked: (trackId: string) => boolean;
  toggleLike: (track: Track) => Promise<boolean>;
  addLikedTrack: (track: Track) => Promise<void>;
  removeLikedTrack: (trackId: string) => Promise<void>;
}

export const useLikedSongsStore = create<LikedSongsState>((set, get) => ({
  likedTracks: [],
  likedIds: new Set<string>(),
  isLoading: false,
  isInitialized: false,

  initLikedSongs: async () => {
    if (get().isInitialized) return;
    set({ isLoading: true });

    const supabase = getSupabaseBrowserClient();
    const user = useAuthStore.getState().user;

    // First, load from localStorage for immediate responsiveness
    let localTracks: Track[] = [];
    try {
      const stored = localStorage.getItem(LIKED_STORAGE_KEY);
      if (stored) {
        localTracks = JSON.parse(stored) as Track[];
      }
    } catch {
      // ignore
    }

    if (!supabase || !user) {
      set({
        likedTracks: localTracks,
        likedIds: new Set(localTracks.map((t) => t.id)),
        isLoading: false,
        isInitialized: true,
      });
      return;
    }

    // Supabase authenticated mode
    try {
      const { data, error } = await supabase
        .from("liked_tracks")
        .select("track_ref, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const tracks = data.map((d) => d.track_ref as Track);
        set({
          likedTracks: tracks,
          likedIds: new Set(tracks.map((t) => t.id)),
          isLoading: false,
          isInitialized: true,
        });
        try {
          localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(tracks));
        } catch {
          // ignore
        }
      } else {
        // If supabase has no tracks but local has tracks, sync local to supabase
        if (localTracks.length > 0) {
          const rowsToInsert = localTracks.map((t) => ({
            user_id: user.id,
            track_id: t.id,
            track_ref: t,
          }));
          await supabase.from("liked_tracks").insert(rowsToInsert);
        }
        set({
          likedTracks: localTracks,
          likedIds: new Set(localTracks.map((t) => t.id)),
          isLoading: false,
          isInitialized: true,
        });
      }
    } catch (err) {
      console.warn(
        "Failed to load liked tracks from Supabase, using local:",
        err,
      );
      set({
        likedTracks: localTracks,
        likedIds: new Set(localTracks.map((t) => t.id)),
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  isLiked: (trackId: string) => {
    return get().likedIds.has(trackId);
  },

  addLikedTrack: async (track: Track) => {
    const { likedTracks, likedIds } = get();
    if (likedIds.has(track.id)) return;

    const newTracks = [track, ...likedTracks];
    const newIds = new Set(likedIds);
    newIds.add(track.id);

    set({ likedTracks: newTracks, likedIds: newIds });

    try {
      localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(newTracks));
    } catch {
      // ignore
    }

    const supabase = getSupabaseBrowserClient();
    const user = useAuthStore.getState().user;

    if (supabase && user) {
      try {
        await supabase.from("liked_tracks").insert({
          user_id: user.id,
          track_id: track.id,
          track_ref: track,
        });
      } catch (err) {
        console.warn("Failed to save liked track to Supabase:", err);
      }
    }

    useUIStore.getState().addToast({
      type: "info",
      message: `Added "${track.title}" to Liked Songs`,
    });
  },

  removeLikedTrack: async (trackId: string) => {
    const { likedTracks, likedIds } = get();
    if (!likedIds.has(trackId)) return;

    const targetTrack = likedTracks.find((t) => t.id === trackId);
    const newTracks = likedTracks.filter((t) => t.id !== trackId);
    const newIds = new Set(likedIds);
    newIds.delete(trackId);

    set({ likedTracks: newTracks, likedIds: newIds });

    try {
      localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(newTracks));
    } catch {
      // ignore
    }

    const supabase = getSupabaseBrowserClient();
    const user = useAuthStore.getState().user;

    if (supabase && user) {
      try {
        await supabase
          .from("liked_tracks")
          .delete()
          .eq("user_id", user.id)
          .eq("track_id", trackId);
      } catch (err) {
        console.warn("Failed to remove liked track from Supabase:", err);
      }
    }

    useUIStore.getState().addToast({
      type: "info",
      message: `Removed "${targetTrack?.title || "track"}" from Liked Songs`,
    });
  },

  toggleLike: async (track: Track) => {
    const { isLiked, addLikedTrack, removeLikedTrack } = get();
    if (isLiked(track.id)) {
      await removeLikedTrack(track.id);
      return false;
    } else {
      await addLikedTrack(track);
      return true;
    }
  },
}));

/**
 * Convenient React hook for components to access Liked Songs.
 */
export function useLikedSongs() {
  const likedTracks = useLikedSongsStore((s) => s.likedTracks);
  const likedIds = useLikedSongsStore((s) => s.likedIds);
  const isLiked = useLikedSongsStore((s) => s.isLiked);
  const toggleLike = useLikedSongsStore((s) => s.toggleLike);
  const addLikedTrack = useLikedSongsStore((s) => s.addLikedTrack);
  const removeLikedTrack = useLikedSongsStore((s) => s.removeLikedTrack);
  const isLoading = useLikedSongsStore((s) => s.isLoading);
  const initLikedSongs = useLikedSongsStore((s) => s.initLikedSongs);

  return {
    likedTracks,
    likedIds,
    count: likedTracks.length,
    isLiked,
    toggleLike,
    addLikedTrack,
    removeLikedTrack,
    isLoading,
    initLikedSongs,
  };
}
