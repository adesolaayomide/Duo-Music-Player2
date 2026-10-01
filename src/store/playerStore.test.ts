import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Track } from "@/types";

// Mock the AudioEngine before importing playerStore
vi.mock("@/lib/audio/AudioEngine", () => {
  const mockEngine = {
    load: vi.fn(),
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    toggle: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    setMuted: vi.fn(),
    preload: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn().mockReturnValue(() => {}),
  };
  return {
    AudioEngine: {
      getInstance: () => mockEngine,
    },
    getAudioEngine: () => mockEngine,
  };
});

import { usePlayerStore } from "@/store/playerStore";

const sampleTracks: Track[] = [
  {
    id: "track-1",
    title: "Track One",
    artistId: "artist-1",
    artistName: "Artist A",
    albumId: "album-1",
    albumName: "Album A",
    audioUrl: "https://example.com/1.mp3",
    coverUrl: "https://example.com/1.jpg",
    duration: 180,
    license: "cc-by",
    licenseLabel: "CC",
    provider: "local",
    providerTrackId: "1",
  },
  {
    id: "track-2",
    title: "Track Two",
    artistId: "artist-2",
    artistName: "Artist B",
    albumId: "album-2",
    albumName: "Album B",
    audioUrl: "https://example.com/2.mp3",
    coverUrl: "https://example.com/2.jpg",
    duration: 200,
    license: "cc-by",
    licenseLabel: "CC",
    provider: "local",
    providerTrackId: "2",
  },
  {
    id: "track-3",
    title: "Track Three",
    artistId: "artist-3",
    artistName: "Artist C",
    albumId: "album-3",
    albumName: "Album C",
    audioUrl: "https://example.com/3.mp3",
    coverUrl: "https://example.com/3.jpg",
    duration: 220,
    license: "cc-by",
    licenseLabel: "CC",
    provider: "local",
    providerTrackId: "3",
  },
];

describe("playerStore", () => {
  beforeEach(() => {
    usePlayerStore.setState({
      queue: [],
      originalQueue: [],
      currentIndex: -1,
      status: "idle",
      currentTime: 0,
      duration: 0,
      buffered: 0,
      volume: 0.8,
      isMuted: false,
      shuffle: false,
      repeat: "off",
      error: null,
    });
  });

  describe("playQueue & playTrack", () => {
    it("loads and plays the requested track within a queue", () => {
      const store = usePlayerStore.getState();
      store.playQueue(sampleTracks, 1);

      const state = usePlayerStore.getState();
      expect(state.queue).toHaveLength(3);
      expect(state.currentIndex).toBe(1);
      expect(state.queue[state.currentIndex]?.id).toBe("track-2");
      expect(state.status).toBe("loading");
    });

    it("plays single track and initializes queue", () => {
      const store = usePlayerStore.getState();
      store.playTrack(sampleTracks[0]!);

      const state = usePlayerStore.getState();
      expect(state.queue).toHaveLength(1);
      expect(state.currentIndex).toBe(0);
      expect(state.queue[0]?.id).toBe("track-1");
    });
  });

  describe("next() and previous() rules", () => {
    it("advances to next track when available", () => {
      usePlayerStore.getState().playQueue(sampleTracks, 0);
      usePlayerStore.getState().next();

      const state = usePlayerStore.getState();
      expect(state.currentIndex).toBe(1);
      expect(state.queue[state.currentIndex]?.id).toBe("track-2");
    });

    it('stops and resets to index 0 paused when reaching end of queue with repeat="off"', () => {
      usePlayerStore.getState().playQueue(sampleTracks, 2);
      usePlayerStore.setState({ repeat: "off" });

      usePlayerStore.getState().next();

      const state = usePlayerStore.getState();
      expect(state.currentIndex).toBe(0);
      expect(state.status).toBe("paused");
      expect(state.currentTime).toBe(0);
    });

    it('wraps to index 0 and plays when reaching end with repeat="all"', () => {
      usePlayerStore.getState().playQueue(sampleTracks, 2);
      usePlayerStore.setState({ repeat: "all" });

      usePlayerStore.getState().next();

      const state = usePlayerStore.getState();
      expect(state.currentIndex).toBe(0);
      expect(state.queue[state.currentIndex]?.id).toBe("track-1");
      expect(state.status).toBe("loading");
    });

    it('replays same track on next() when repeat="one"', () => {
      usePlayerStore.getState().playQueue(sampleTracks, 1);
      usePlayerStore.setState({ repeat: "one", currentTime: 45 });

      usePlayerStore.getState().next();

      const state = usePlayerStore.getState();
      expect(state.currentIndex).toBe(1);
      expect(state.currentTime).toBe(0);
      expect(state.status).toBe("playing");
    });

    it("restarts current track on previous() if currentTime > 3s", () => {
      usePlayerStore.getState().playQueue(sampleTracks, 1);
      usePlayerStore.setState({ currentTime: 15 });

      usePlayerStore.getState().previous();

      const state = usePlayerStore.getState();
      expect(state.currentIndex).toBe(1); // Didn't change index
      expect(state.currentTime).toBe(0); // Restarted
    });

    it("goes to previous track on previous() if currentTime <= 3s", () => {
      usePlayerStore.getState().playQueue(sampleTracks, 2);
      usePlayerStore.setState({ currentTime: 1.5 });

      usePlayerStore.getState().previous();

      const state = usePlayerStore.getState();
      expect(state.currentIndex).toBe(1);
      expect(state.queue[state.currentIndex]?.id).toBe("track-2");
    });

    it("restarts current track if on index 0 and previous() called with currentTime <= 3s", () => {
      usePlayerStore.getState().playQueue(sampleTracks, 0);
      usePlayerStore.setState({ currentTime: 1 });

      usePlayerStore.getState().previous();

      const state = usePlayerStore.getState();
      expect(state.currentIndex).toBe(0);
      expect(state.currentTime).toBe(0);
    });
  });

  describe("repeat modes", () => {
    it("cycles repeat mode off -> all -> one -> off", () => {
      const store = usePlayerStore.getState();
      expect(usePlayerStore.getState().repeat).toBe("off");

      store.cycleRepeat();
      expect(usePlayerStore.getState().repeat).toBe("all");

      store.cycleRepeat();
      expect(usePlayerStore.getState().repeat).toBe("one");

      store.cycleRepeat();
      expect(usePlayerStore.getState().repeat).toBe("off");
    });
  });

  describe("shuffle and un-shuffle", () => {
    it("pins the currently active track to index 0 on shuffle", () => {
      const store = usePlayerStore.getState();
      store.playQueue(sampleTracks, 1); // track-2 is playing

      store.toggleShuffle();

      const state = usePlayerStore.getState();
      expect(state.shuffle).toBe(true);
      expect(state.currentIndex).toBe(0);
      expect(state.queue[0]?.id).toBe("track-2"); // Must remain current
      expect(state.queue).toHaveLength(3);
    });

    it("restores originalQueue and updates currentIndex when shuffle is toggled off", () => {
      const store = usePlayerStore.getState();
      store.playQueue(sampleTracks, 0);

      store.toggleShuffle(); // ON
      expect(usePlayerStore.getState().shuffle).toBe(true);

      // Advance to what is currently at index 1
      store.next();
      const currentTrack =
        usePlayerStore.getState().queue[usePlayerStore.getState().currentIndex];

      store.toggleShuffle(); // OFF

      const state = usePlayerStore.getState();
      expect(state.shuffle).toBe(false);
      expect(state.queue.map((t) => t.id)).toEqual(
        state.originalQueue.map((t) => t.id),
      );
      // Current track must still be the active track in restored order
      expect(state.queue[state.currentIndex]?.id).toBe(currentTrack?.id);
    });
  });

  describe("queue modifications", () => {
    it("addToQueue appends items to queue and originalQueue", () => {
      const store = usePlayerStore.getState();
      store.playQueue([sampleTracks[0]!], 0);

      store.addToQueue([sampleTracks[1]!, sampleTracks[2]!]);

      const state = usePlayerStore.getState();
      expect(state.queue).toHaveLength(3);
      expect(state.originalQueue).toHaveLength(3);
    });

    it("playNext inserts a track right after currentIndex", () => {
      const store = usePlayerStore.getState();
      store.playQueue([sampleTracks[0]!, sampleTracks[2]!], 0);

      store.playNext(sampleTracks[1]!);

      const state = usePlayerStore.getState();
      expect(state.queue).toHaveLength(3);
      expect(state.queue[1]?.id).toBe("track-2");
    });

    it("removeFromQueue shifts currentIndex down when removing earlier track", () => {
      const store = usePlayerStore.getState();
      store.playQueue(sampleTracks, 2);

      store.removeFromQueue(0);

      const state = usePlayerStore.getState();
      expect(state.queue).toHaveLength(2);
      expect(state.currentIndex).toBe(1);
      expect(state.queue[state.currentIndex]?.id).toBe("track-3");
    });

    it("removeFromQueue transitions to next track when removing currently playing track", () => {
      const store = usePlayerStore.getState();
      store.playQueue(sampleTracks, 0);

      store.removeFromQueue(0);

      const state = usePlayerStore.getState();
      expect(state.queue).toHaveLength(2);
      expect(state.currentIndex).toBe(0);
      expect(state.queue[0]?.id).toBe("track-2");
    });

    it("removeFromQueue clears queue when only track is removed", () => {
      const store = usePlayerStore.getState();
      store.playQueue([sampleTracks[0]!], 0);

      store.removeFromQueue(0);

      const state = usePlayerStore.getState();
      expect(state.queue).toHaveLength(0);
      expect(state.currentIndex).toBe(-1);
      expect(state.status).toBe("idle");
    });

    it("reorderQueue moves items and keeps track of currentIndex", () => {
      const store = usePlayerStore.getState();
      store.playQueue(sampleTracks, 0); // track-1 at index 0

      store.reorderQueue(0, 2); // move track-1 to index 2

      const state = usePlayerStore.getState();
      expect(state.currentIndex).toBe(2);
      expect(state.queue[2]?.id).toBe("track-1");
    });
  });
});
