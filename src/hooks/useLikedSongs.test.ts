import { describe, it, expect, beforeEach } from "vitest";
import { useLikedSongsStore } from "./useLikedSongs";
import type { Track } from "@/types";

const dummyTrack: Track = {
  id: "track-like-1",
  title: "Starry Night",
  artistId: "artist-1",
  artistName: "Cosmic Sound",
  albumId: "album-1",
  albumName: "Universe",
  audioUrl: "https://example.com/audio.mp3",
  coverUrl: "https://example.com/cover.jpg",
  duration: 180,
  license: "CC-BY",
  licenseLabel: "Creative Commons",
  provider: "jamendo",
  providerTrackId: "101",
};

const dummyTrack2: Track = {
  id: "track-like-2",
  title: "Morning Sun",
  artistId: "artist-2",
  artistName: "Solar Beats",
  albumId: "album-2",
  albumName: "Solar Flare",
  audioUrl: "https://example.com/audio2.mp3",
  coverUrl: "https://example.com/cover2.jpg",
  duration: 210,
  license: "CC-BY",
  licenseLabel: "Creative Commons",
  provider: "jamendo",
  providerTrackId: "102",
};

describe("useLikedSongsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useLikedSongsStore.setState({
      likedTracks: [],
      likedIds: new Set<string>(),
      isLoading: false,
      isInitialized: true,
    });
  });

  it("starts with empty liked tracks", () => {
    const { likedTracks, likedIds, isLiked } = useLikedSongsStore.getState();
    expect(likedTracks).toHaveLength(0);
    expect(likedIds.size).toBe(0);
    expect(isLiked(dummyTrack.id)).toBe(false);
  });

  it("adds a track to liked songs and saves to localStorage", async () => {
    const { addLikedTrack } = useLikedSongsStore.getState();
    await addLikedTrack(dummyTrack);

    const state = useLikedSongsStore.getState();
    expect(state.likedTracks).toHaveLength(1);
    expect(state.isLiked(dummyTrack.id)).toBe(true);

    const stored = localStorage.getItem("duo_liked_tracks");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!) as Track[];
    expect(parsed[0]?.id).toBe(dummyTrack.id);
  });

  it("removes a track from liked songs", async () => {
    const { addLikedTrack, removeLikedTrack } = useLikedSongsStore.getState();
    await addLikedTrack(dummyTrack);
    await addLikedTrack(dummyTrack2);

    expect(useLikedSongsStore.getState().likedTracks).toHaveLength(2);

    await removeLikedTrack(dummyTrack.id);
    const state = useLikedSongsStore.getState();
    expect(state.likedTracks).toHaveLength(1);
    expect(state.isLiked(dummyTrack.id)).toBe(false);
    expect(state.isLiked(dummyTrack2.id)).toBe(true);
  });

  it("toggles like state correctly", async () => {
    const { toggleLike } = useLikedSongsStore.getState();

    const isNowLiked = await toggleLike(dummyTrack);
    expect(isNowLiked).toBe(true);
    expect(useLikedSongsStore.getState().isLiked(dummyTrack.id)).toBe(true);

    const isNowUnliked = await toggleLike(dummyTrack);
    expect(isNowUnliked).toBe(false);
    expect(useLikedSongsStore.getState().isLiked(dummyTrack.id)).toBe(false);
  });
});
