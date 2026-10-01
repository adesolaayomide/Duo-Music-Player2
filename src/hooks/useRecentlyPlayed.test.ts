import { describe, it, expect, beforeEach } from "vitest";
import { useRecentlyPlayedStore } from "./useRecentlyPlayed";
import type { Track } from "@/types";

const trackA: Track = {
  id: "recent-1",
  title: "Track Alpha",
  artistId: "art-1",
  artistName: "Artist Alpha",
  albumId: "alb-1",
  albumName: "Alpha Album",
  audioUrl: "https://example.com/a.mp3",
  coverUrl: "https://example.com/coverA.jpg",
  duration: 120,
  license: "CC-BY",
  licenseLabel: "CC",
  provider: "jamendo",
  providerTrackId: "1",
};

const trackB: Track = {
  id: "recent-2",
  title: "Track Beta",
  artistId: "art-2",
  artistName: "Artist Beta",
  albumId: "alb-2",
  albumName: "Beta Album",
  audioUrl: "https://example.com/b.mp3",
  coverUrl: "https://example.com/coverB.jpg",
  duration: 140,
  license: "CC-BY",
  licenseLabel: "CC",
  provider: "jamendo",
  providerTrackId: "2",
};

describe("useRecentlyPlayedStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useRecentlyPlayedStore.setState({
      recentlyPlayed: [],
      isLoading: false,
      isInitialized: true,
    });
  });

  it("records played tracks with most recent first", async () => {
    const { recordPlayed } = useRecentlyPlayedStore.getState();
    await recordPlayed(trackA);
    await recordPlayed(trackB);

    const state = useRecentlyPlayedStore.getState();
    expect(state.recentlyPlayed).toHaveLength(2);
    expect(state.recentlyPlayed[0]?.id).toBe(trackB.id);
    expect(state.recentlyPlayed[1]?.id).toBe(trackA.id);
  });

  it("deduplicates when the same track is played again and moves it to top", async () => {
    const { recordPlayed } = useRecentlyPlayedStore.getState();
    await recordPlayed(trackA);
    await recordPlayed(trackB);
    await recordPlayed(trackA); // replayed track A

    const state = useRecentlyPlayedStore.getState();
    expect(state.recentlyPlayed).toHaveLength(2);
    expect(state.recentlyPlayed[0]?.id).toBe(trackA.id);
    expect(state.recentlyPlayed[1]?.id).toBe(trackB.id);
  });

  it("clears recently played list", async () => {
    const { recordPlayed, clearRecentlyPlayed } =
      useRecentlyPlayedStore.getState();
    await recordPlayed(trackA);
    expect(useRecentlyPlayedStore.getState().recentlyPlayed).toHaveLength(1);

    await clearRecentlyPlayed();
    expect(useRecentlyPlayedStore.getState().recentlyPlayed).toHaveLength(0);
  });
});
