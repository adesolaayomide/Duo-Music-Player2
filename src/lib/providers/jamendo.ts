import type {
  Album,
  Artist,
  MusicProvider,
  Playlist,
  SearchResults,
  Track,
} from "@/types";

class JamendoProvider implements MusicProvider {
  readonly id = "jamendo" as const;

  private async fetchApi<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const url = `/api/catalog${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const res = await fetch(url, options);

    if (!res.ok) {
      let errorMsg = `API request failed with HTTP ${res.status}`;
      try {
        const body = await res.json();
        if (body.error?.message) {
          errorMsg = body.error.message;
        }
      } catch {
        // use default error message
      }
      throw new Error(errorMsg);
    }

    return (await res.json()) as T;
  }

  async search(
    query: string,
    type: "all" | "tracks" | "albums" | "artists" = "all",
  ): Promise<SearchResults> {
    if (!query.trim()) {
      return { tracks: [], albums: [], artists: [] };
    }
    const params = new URLSearchParams({
      q: query.trim(),
      type,
      limit: "20",
    });
    return this.fetchApi<SearchResults>(`/search?${params.toString()}`);
  }

  async getTrack(id: string): Promise<Track> {
    return this.fetchApi<Track>(`/track/${encodeURIComponent(id)}`);
  }

  async getAlbum(id: string): Promise<Album> {
    return this.fetchApi<Album>(`/album/${encodeURIComponent(id)}`);
  }

  async getArtist(id: string): Promise<Artist> {
    return this.fetchApi<Artist>(`/artist/${encodeURIComponent(id)}`);
  }

  async getPlaylist(id: string): Promise<Playlist> {
    return this.fetchApi<Playlist>(`/playlist/${encodeURIComponent(id)}`);
  }

  async getFeatured(): Promise<Track[]> {
    const data = await this.getFeaturedCatalog();
    return data.featuredTracks;
  }

  async getFeaturedCatalog(): Promise<{
    featuredTracks: Track[];
    popularAlbums: Album[];
    featuredPlaylists: Playlist[];
  }> {
    return this.fetchApi<{
      featuredTracks: Track[];
      popularAlbums: Album[];
      featuredPlaylists: Playlist[];
    }>("/featured");
  }

  async getByGenre(genre: string): Promise<Track[]> {
    return this.fetchApi<Track[]>(`/genre/${encodeURIComponent(genre)}`);
  }
}

export const jamendoProvider = new JamendoProvider();
