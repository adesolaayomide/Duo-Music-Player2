import { describe, it, expect, beforeEach } from "vitest";
import { usePlaylistsStore } from "./usePlaylists";
import type { Track } from "@/types";

const dummyTrack1: Track = {
  id: "pl-track-1",
  title: "Synthwave Dream",
  artistId: "art-1",
  artistName: "Neon City",
  albumId: "alb-1",
  albumName: "Neon Album",
  audioUrl: "https://example.com/synth.mp3",
  coverUrl: "https://example.com/cover1.jpg",
  duration: 150,
  license: "CC-BY",
  licenseLabel: "Creative Commons",
  provider: "jamendo",
  providerTrackId: "201",
};

const dummyTrack2: Track = {
  id: "pl-track-2",
  title: "Retro Arcade",
  artistId: "art-2",
  artistName: "8-Bit Knight",
  albumId: "alb-2",
  albumName: "Retro Album",
  audioUrl: "https://example.com/retro.mp3",
  coverUrl: "https://example.com/cover2.jpg",
  duration: 180,
  license: "CC-BY",
  licenseLabel: "Creative Commons",
  provider: "jamendo",
  providerTrackId: "202",
};

describe("usePlaylistsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    usePlaylistsStore.setState({
      playlists: [],
      isLoading: false,
      isInitialized: true,
    });
  });

  it("creates a new playlist and saves to localStorage", async () => {
    const { createPlaylist } = usePlaylistsStore.getState();
    const created = await createPlaylist(
      "My Chill Beats",
      "Relaxing instrumental tracks",
    );

    expect(created.name).toBe("My Chill Beats");
    expect(created.description).toBe("Relaxing instrumental tracks");
    expect(created.tracks).toEqual([]);

    const state = usePlaylistsStore.getState();
    expect(state.playlists).toHaveLength(1);
    expect(state.getPlaylist(created.id)).toBeDefined();

    const stored = localStorage.getItem("duo_user_playlists");
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toHaveLength(1);
  });

  it("updates a playlist name and description", async () => {
    const { createPlaylist, updatePlaylist, getPlaylist } =
      usePlaylistsStore.getState();
    const pl = await createPlaylist("Original Name");

    await updatePlaylist(pl.id, {
      name: "Updated Name",
      description: "Brand new description",
    });

    const updated = getPlaylist(pl.id);
    expect(updated?.name).toBe("Updated Name");
    expect(updated?.description).toBe("Brand new description");
  });

  it("adds tracks to playlist and rejects duplicates", async () => {
    const { createPlaylist, addTrackToPlaylist, getPlaylist } =
      usePlaylistsStore.getState();
    const pl = await createPlaylist("Rock Vault");

    const added1 = await addTrackToPlaylist(pl.id, dummyTrack1);
    expect(added1).toBe(true);

    const added2 = await addTrackToPlaylist(pl.id, dummyTrack2);
    expect(added2).toBe(true);

    // Duplicate add should return false
    const duplicate = await addTrackToPlaylist(pl.id, dummyTrack1);
    expect(duplicate).toBe(false);

    const updated = getPlaylist(pl.id);
    expect(updated?.tracks).toHaveLength(2);
    expect(updated?.tracks[0]?.id).toBe(dummyTrack1.id);
    expect(updated?.tracks[1]?.id).toBe(dummyTrack2.id);
  });

  it("removes a track from a playlist", async () => {
    const {
      createPlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      getPlaylist,
    } = usePlaylistsStore.getState();
    const pl = await createPlaylist("Workout Energy");
    await addTrackToPlaylist(pl.id, dummyTrack1);
    await addTrackToPlaylist(pl.id, dummyTrack2);

    await removeTrackFromPlaylist(pl.id, dummyTrack1.id);
    const updated = getPlaylist(pl.id);
    expect(updated?.tracks).toHaveLength(1);
    expect(updated?.tracks[0]?.id).toBe(dummyTrack2.id);
  });

  it("reorders tracks in a playlist", async () => {
    const {
      createPlaylist,
      addTrackToPlaylist,
      reorderPlaylistTracks,
      getPlaylist,
    } = usePlaylistsStore.getState();
    const pl = await createPlaylist("Reorder Test");
    await addTrackToPlaylist(pl.id, dummyTrack1);
    await addTrackToPlaylist(pl.id, dummyTrack2);

    // Swap position 0 and 1
    await reorderPlaylistTracks(pl.id, 0, 1);
    const updated = getPlaylist(pl.id);
    expect(updated?.tracks[0]?.id).toBe(dummyTrack2.id);
    expect(updated?.tracks[1]?.id).toBe(dummyTrack1.id);
  });

  it("deletes a playlist", async () => {
    const { createPlaylist, deletePlaylist, getPlaylist } =
      usePlaylistsStore.getState();
    const pl = await createPlaylist("To Delete");
    expect(usePlaylistsStore.getState().playlists).toHaveLength(1);

    await deletePlaylist(pl.id);
    expect(usePlaylistsStore.getState().playlists).toHaveLength(0);
    expect(getPlaylist(pl.id)).toBeUndefined();
  });
});
