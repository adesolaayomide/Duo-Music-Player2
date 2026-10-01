import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { jamendoProvider } from "@/lib/providers/jamendo";
import type { Album, Artist, Playlist, SearchResults, Track } from "@/types";

// Query keys constants
export const catalogKeys = {
  all: ["catalog"] as const,
  featured: () => [...catalogKeys.all, "featured"] as const,
  search: (query: string, tab: string) =>
    [...catalogKeys.all, "search", query, tab] as const,
  track: (id: string) => [...catalogKeys.all, "track", id] as const,
  album: (id: string) => [...catalogKeys.all, "album", id] as const,
  artist: (id: string) => [...catalogKeys.all, "artist", id] as const,
  playlist: (id: string) => [...catalogKeys.all, "playlist", id] as const,
  genre: (tag: string) => [...catalogKeys.all, "genre", tag] as const,
};

/**
 * Hook to fetch featured tracks, popular albums, and playlists for the Home page
 */
export function useFeatured() {
  return useQuery({
    queryKey: catalogKeys.featured(),
    queryFn: () => jamendoProvider.getFeaturedCatalog(),
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook to search tracks, albums, and artists with keepPreviousData for smooth typing
 */
export function useSearch(
  query: string,
  tab: "all" | "tracks" | "albums" | "artists" = "all",
) {
  const trimmed = query.trim();

  return useQuery<SearchResults>({
    queryKey: catalogKeys.search(trimmed, tab),
    queryFn: () => jamendoProvider.search(trimmed, tab),
    enabled: trimmed.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch track details by ID
 */
export function useTrack(id: string) {
  return useQuery<Track>({
    queryKey: catalogKeys.track(id),
    queryFn: () => jamendoProvider.getTrack(id),
    enabled: Boolean(id),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 1,
  });
}

/**
 * Hook to fetch album details + tracklist by ID
 */
export function useAlbum(id: string) {
  return useQuery<Album>({
    queryKey: catalogKeys.album(id),
    queryFn: () => jamendoProvider.getAlbum(id),
    enabled: Boolean(id),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 1,
  });
}

/**
 * Hook to fetch artist details + top tracks + albums by ID
 */
export function useArtist(id: string) {
  return useQuery<Artist>({
    queryKey: catalogKeys.artist(id),
    queryFn: () => jamendoProvider.getArtist(id),
    enabled: Boolean(id),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 1,
  });
}

/**
 * Hook to fetch playlist details + tracklist by ID
 */
export function usePlaylist(id: string) {
  return useQuery<Playlist>({
    queryKey: catalogKeys.playlist(id),
    queryFn: () => jamendoProvider.getPlaylist(id),
    enabled: Boolean(id),
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });
}

/**
 * Hook to fetch tracks by genre / tag
 */
export function useGenreTracks(genre: string) {
  const clean = genre.trim().toLowerCase();

  return useQuery<Track[]>({
    queryKey: catalogKeys.genre(clean),
    queryFn: () => jamendoProvider.getByGenre(clean),
    enabled: clean.length > 0,
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });
}
