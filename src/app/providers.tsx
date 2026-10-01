"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLikedSongsStore } from "@/hooks/useLikedSongs";
import { usePlaylistsStore } from "@/hooks/usePlaylists";
import { useRecentlyPlayedStore } from "@/hooks/useRecentlyPlayed";

/**
 * Client-side providers wrapper.
 * Initializes authentication, liked songs, playlists, and recently played on mount.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 min
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    void useAuthStore.getState().initAuth();
    void useLikedSongsStore.getState().initLikedSongs();
    void usePlaylistsStore.getState().initPlaylists();
    void useRecentlyPlayedStore.getState().initRecentlyPlayed();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
