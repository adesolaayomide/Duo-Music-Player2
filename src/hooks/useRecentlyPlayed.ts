import { create } from "zustand";
import type { Track } from "@/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";

const RECENTLY_PLAYED_KEY = "duo_recently_played";
const MAX_RECENT_TRACKS = 30;

interface RecentlyPlayedState {
  recentlyPlayed: Track[];
  isLoading: boolean;
  isInitialized: boolean;
  initRecentlyPlayed: () => Promise<void>;
  recordPlayed: (track: Track) => Promise<void>;
  clearRecentlyPlayed: () => Promise<void>;
}

export const useRecentlyPlayedStore = create<RecentlyPlayedState>(
  (set, get) => ({
    recentlyPlayed: [],
    isLoading: false,
    isInitialized: false,

    initRecentlyPlayed: async () => {
      if (get().isInitialized) return;
      set({ isLoading: true });

      let localTracks: Track[] = [];
      try {
        const stored = localStorage.getItem(RECENTLY_PLAYED_KEY);
        if (stored) {
          localTracks = JSON.parse(stored) as Track[];
        }
      } catch {
        // ignore
      }

      const supabase = getSupabaseBrowserClient();
      const user = useAuthStore.getState().user;

      if (!supabase || !user) {
        set({
          recentlyPlayed: localTracks,
          isLoading: false,
          isInitialized: true,
        });
        return;
      }

      try {
        const { data, error } = await supabase
          .from("recently_played")
          .select("track_ref, played_at")
          .eq("user_id", user.id)
          .order("played_at", { ascending: false })
          .limit(MAX_RECENT_TRACKS);

        if (error) throw error;

        if (data && data.length > 0) {
          const tracks = data.map((d) => d.track_ref as Track);
          // Deduplicate tracks by id
          const uniqueMap = new Map<string, Track>();
          for (const t of tracks) {
            if (!uniqueMap.has(t.id)) {
              uniqueMap.set(t.id, t);
            }
          }
          const deduped = Array.from(uniqueMap.values());
          set({
            recentlyPlayed: deduped,
            isLoading: false,
            isInitialized: true,
          });
          try {
            localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(deduped));
          } catch {
            // ignore
          }
        } else {
          set({
            recentlyPlayed: localTracks,
            isLoading: false,
            isInitialized: true,
          });
        }
      } catch (err) {
        console.warn("Failed to load recently played from Supabase:", err);
        set({
          recentlyPlayed: localTracks,
          isLoading: false,
          isInitialized: true,
        });
      }
    },

    recordPlayed: async (track: Track) => {
      const { recentlyPlayed } = get();
      // Move track to top, remove existing occurrence
      const filtered = recentlyPlayed.filter((t) => t.id !== track.id);
      const updated = [track, ...filtered].slice(0, MAX_RECENT_TRACKS);

      set({ recentlyPlayed: updated });

      try {
        localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }

      const supabase = getSupabaseBrowserClient();
      const user = useAuthStore.getState().user;

      if (supabase && user) {
        try {
          await supabase.from("recently_played").insert({
            user_id: user.id,
            track_id: track.id,
            track_ref: track,
            played_at: new Date().toISOString(),
          });
        } catch (err) {
          console.warn("Failed to record recently played on Supabase:", err);
        }
      }
    },

    clearRecentlyPlayed: async () => {
      set({ recentlyPlayed: [] });
      try {
        localStorage.removeItem(RECENTLY_PLAYED_KEY);
      } catch {
        // ignore
      }

      const supabase = getSupabaseBrowserClient();
      const user = useAuthStore.getState().user;

      if (supabase && user) {
        try {
          await supabase
            .from("recently_played")
            .delete()
            .eq("user_id", user.id);
        } catch (err) {
          console.warn("Failed to clear recently played from Supabase:", err);
        }
      }
    },
  }),
);

export function useRecentlyPlayed() {
  const recentlyPlayed = useRecentlyPlayedStore((s) => s.recentlyPlayed);
  const isLoading = useRecentlyPlayedStore((s) => s.isLoading);
  const initRecentlyPlayed = useRecentlyPlayedStore(
    (s) => s.initRecentlyPlayed,
  );
  const recordPlayed = useRecentlyPlayedStore((s) => s.recordPlayed);
  const clearRecentlyPlayed = useRecentlyPlayedStore(
    (s) => s.clearRecentlyPlayed,
  );

  return {
    recentlyPlayed,
    isLoading,
    initRecentlyPlayed,
    recordPlayed,
    clearRecentlyPlayed,
  };
}
