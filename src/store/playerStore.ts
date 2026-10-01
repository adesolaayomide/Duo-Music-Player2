import type { PlayerState, PlayerStatus, RepeatMode, Track } from "@/types";
import { getAudioEngine } from "@/lib/audio/AudioEngine";
import { useUIStore } from "@/store/uiStore";
import { useRecentlyPlayedStore } from "@/hooks/useRecentlyPlayed";
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";

// ─────────────────────────────────────────────
//  Helper: Fisher-Yates Shuffle
// ─────────────────────────────────────────────

function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }
  return result;
}

// ─────────────────────────────────────────────
//  Public Player Actions Interface
// ─────────────────────────────────────────────

export interface PlayerActions {
  /** Play a specific track, optionally providing a full queue context */
  playTrack: (track: Track, queue?: Track[]) => void;
  /** Play an entire queue starting from a given index */
  playQueue: (tracks: Track[], startIndex?: number) => void;
  /** Toggle between playing and paused */
  togglePlay: () => void;
  /** Skip to next track according to repeat / shuffle rules */
  next: () => void;
  /** Go to previous track, or restart if >3s in */
  previous: () => void;
  /** Seek to target seconds */
  seek: (seconds: number) => void;
  /** Set volume (0 to 1) */
  setVolume: (volume: number) => void;
  /** Toggle mute state */
  toggleMute: () => void;
  /** Toggle shuffle state */
  toggleShuffle: () => void;
  /** Cycle repeat between 'off' -> 'all' -> 'one' */
  cycleRepeat: () => void;
  /** Add tracks to the end of the queue */
  addToQueue: (tracks: Track | Track[]) => void;
  /** Queue a track to play immediately after the current one */
  playNext: (track: Track) => void;
  /** Remove a track by index from the queue */
  removeFromQueue: (index: number) => void;
  /** Reorder tracks in the active queue */
  reorderQueue: (from: number, to: number) => void;
  /** Clear the current queue and reset player status */
  clearQueue: () => void;
  /** Set status internally */
  setStatus: (status: PlayerStatus) => void;
  /** Set error internally */
  setError: (error: string | null) => void;
}

// ─────────────────────────────────────────────
//  Initial State
// ─────────────────────────────────────────────

const initialState: PlayerState = {
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
};

// ─────────────────────────────────────────────
//  Zustand Store
// ─────────────────────────────────────────────

export const usePlayerStore = create<PlayerState & PlayerActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,

        setStatus: (status) => set({ status }),
        setError: (error) => set({ error }),

        playTrack: (track, queueContext) => {
          const engine = getAudioEngine();
          const baseQueue =
            queueContext && queueContext.length > 0 ? queueContext : [track];
          const { shuffle } = get();

          let activeQueue: Track[];
          let activeIndex: number;

          if (shuffle) {
            const others = baseQueue.filter((t) => t.id !== track.id);
            activeQueue = [track, ...fisherYatesShuffle(others)];
            activeIndex = 0;
          } else {
            activeQueue = [...baseQueue];
            const foundIndex = activeQueue.findIndex((t) => t.id === track.id);
            activeIndex = foundIndex >= 0 ? foundIndex : 0;
          }

          set({
            queue: activeQueue,
            originalQueue: [...baseQueue],
            currentIndex: activeIndex,
            status: "loading",
            currentTime: 0,
            duration: track.duration || 0,
            buffered: 0,
            error: null,
          });

          engine.load(track);
          useRecentlyPlayedStore.getState().recordPlayed(track);
          engine.play().catch(() => {
            set({ status: "paused" });
          });
        },

        playQueue: (tracks, startIndex = 0) => {
          if (!tracks || tracks.length === 0) return;
          const engine = getAudioEngine();
          const safeIndex = Math.max(
            0,
            Math.min(startIndex, tracks.length - 1),
          );
          const currentTrack = tracks[safeIndex]!;
          const { shuffle } = get();

          let activeQueue: Track[];
          let activeIndex: number;

          if (shuffle) {
            const others = tracks.filter((_, idx) => idx !== safeIndex);
            activeQueue = [currentTrack, ...fisherYatesShuffle(others)];
            activeIndex = 0;
          } else {
            activeQueue = [...tracks];
            activeIndex = safeIndex;
          }

          set({
            queue: activeQueue,
            originalQueue: [...tracks],
            currentIndex: activeIndex,
            status: "loading",
            currentTime: 0,
            duration: currentTrack.duration || 0,
            buffered: 0,
            error: null,
          });

          engine.load(currentTrack);
          useRecentlyPlayedStore.getState().recordPlayed(currentTrack);
          engine.play().catch(() => {
            set({ status: "paused" });
          });
        },

        togglePlay: () => {
          const { status, queue, currentIndex, playQueue } = get();
          const engine = getAudioEngine();

          if (status === "idle") {
            if (queue.length > 0 && currentIndex >= 0) {
              const track = queue[currentIndex];
              if (track) {
                engine.load(track);
                engine.play();
                set({ status: "loading" });
              }
            } else if (queue.length > 0) {
              playQueue(queue, 0);
            }
            return;
          }

          if (status === "playing") {
            engine.pause();
            set({ status: "paused" });
          } else if (status === "paused" || status === "error") {
            engine.play();
            set({ status: "playing", error: null });
          }
        },

        next: () => {
          const { queue, currentIndex, repeat } = get();
          if (queue.length === 0) return;

          const engine = getAudioEngine();

          // repeat = 'one' replays current track
          if (repeat === "one") {
            engine.seek(0);
            engine.play();
            set({ currentTime: 0, status: "playing", error: null });
            return;
          }

          const isLast = currentIndex === queue.length - 1;

          if (isLast) {
            if (repeat === "all") {
              const nextTrack = queue[0]!;
              set({
                currentIndex: 0,
                status: "loading",
                currentTime: 0,
                duration: nextTrack.duration || 0,
                buffered: 0,
                error: null,
              });
              engine.load(nextTrack);
              useRecentlyPlayedStore.getState().recordPlayed(nextTrack);
              engine.play();
            } else {
              // repeat === 'off': stop and reset to first track paused
              const firstTrack = queue[0];
              if (firstTrack) {
                engine.load(firstTrack);
                engine.pause();
                engine.seek(0);
              }
              set({
                currentIndex: 0,
                status: "paused",
                currentTime: 0,
                buffered: 0,
                error: null,
              });
            }
            return;
          }

          // Advance to next track
          const nextIndex = currentIndex + 1;
          const nextTrack = queue[nextIndex]!;
          set({
            currentIndex: nextIndex,
            status: "loading",
            currentTime: 0,
            duration: nextTrack.duration || 0,
            buffered: 0,
            error: null,
          });
          engine.load(nextTrack);
          useRecentlyPlayedStore.getState().recordPlayed(nextTrack);
          engine.play();
        },

        previous: () => {
          const { queue, currentIndex, currentTime } = get();
          if (queue.length === 0) return;

          const engine = getAudioEngine();

          // Rule: if > 3s, restart current track
          if (currentTime > 3) {
            engine.seek(0);
            set({ currentTime: 0 });
            return;
          }

          if (currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            const prevTrack = queue[prevIndex]!;
            set({
              currentIndex: prevIndex,
              status: "loading",
              currentTime: 0,
              duration: prevTrack.duration || 0,
              buffered: 0,
              error: null,
            });
            engine.load(prevTrack);
            useRecentlyPlayedStore.getState().recordPlayed(prevTrack);
            engine.play();
          } else {
            // At first track, restart it
            engine.seek(0);
            set({ currentTime: 0 });
          }
        },

        seek: (seconds) => {
          const { duration } = get();
          const clamped = Math.max(0, Math.min(seconds, duration || seconds));
          const engine = getAudioEngine();
          engine.seek(clamped);
          set({ currentTime: clamped });
        },

        setVolume: (volume) => {
          const clamped = Math.min(1, Math.max(0, volume));
          const engine = getAudioEngine();
          engine.setVolume(clamped);
          if (clamped > 0 && get().isMuted) {
            engine.setMuted(false);
            set({ isMuted: false });
          }
          set({ volume: clamped, isMuted: clamped === 0 });
        },

        toggleMute: () => {
          const { isMuted, volume } = get();
          const nextMuted = !isMuted;
          const engine = getAudioEngine();
          engine.setMuted(nextMuted);
          if (!nextMuted && volume === 0) {
            engine.setVolume(0.5);
            set({ volume: 0.5, isMuted: false });
            return;
          }
          set({ isMuted: nextMuted });
        },

        toggleShuffle: () => {
          const { shuffle, queue, originalQueue, currentIndex } = get();
          const nextShuffle = !shuffle;

          if (nextShuffle) {
            // Turning shuffle ON: keep current track first, shuffle remainder
            if (queue.length <= 1) {
              set({ shuffle: true });
              return;
            }

            const currentTrack = queue[currentIndex];
            if (!currentTrack) {
              set({
                shuffle: true,
                queue: fisherYatesShuffle(queue),
                currentIndex: 0,
              });
              return;
            }

            const others = queue.filter((_, idx) => idx !== currentIndex);
            const shuffledQueue = [currentTrack, ...fisherYatesShuffle(others)];
            set({
              shuffle: true,
              queue: shuffledQueue,
              currentIndex: 0,
            });
          } else {
            // Turning shuffle OFF: restore originalQueue, keep current track active
            const currentTrack = queue[currentIndex];
            const restoredQueue = [...originalQueue];

            let restoredIndex = 0;
            if (currentTrack) {
              const found = restoredQueue.findIndex(
                (t) => t.id === currentTrack.id,
              );
              restoredIndex = found >= 0 ? found : 0;
            }

            set({
              shuffle: false,
              queue: restoredQueue,
              currentIndex: restoredIndex,
            });
          }
        },

        cycleRepeat: () => {
          const modes: RepeatMode[] = ["off", "all", "one"];
          const current = get().repeat;
          const nextIndex = (modes.indexOf(current) + 1) % modes.length;
          const nextMode = modes[nextIndex]!;
          set({ repeat: nextMode });
        },

        addToQueue: (tracks) => {
          const items = Array.isArray(tracks) ? tracks : [tracks];
          if (items.length === 0) return;

          set((s) => ({
            queue: [...s.queue, ...items],
            originalQueue: [...s.originalQueue, ...items],
          }));
        },

        playNext: (track) => {
          set((s) => {
            const nextQueue = [...s.queue];
            const nextOriginal = [...s.originalQueue];
            const insertIndex = s.currentIndex + 1;

            nextQueue.splice(insertIndex, 0, track);
            nextOriginal.push(track);

            return {
              queue: nextQueue,
              originalQueue: nextOriginal,
            };
          });
        },

        removeFromQueue: (index) => {
          const { queue, originalQueue, currentIndex, status } = get();
          if (index < 0 || index >= queue.length) return;

          const trackToRemove = queue[index];
          const newQueue = queue.filter((_, i) => i !== index);
          const newOriginal = originalQueue.filter(
            (t) => t.id !== trackToRemove?.id,
          );

          if (newQueue.length === 0) {
            const engine = getAudioEngine();
            engine.pause();
            set({
              queue: [],
              originalQueue: [],
              currentIndex: -1,
              status: "idle",
              currentTime: 0,
              duration: 0,
              buffered: 0,
            });
            return;
          }

          if (index < currentIndex) {
            set({
              queue: newQueue,
              originalQueue: newOriginal,
              currentIndex: currentIndex - 1,
            });
          } else if (index === currentIndex) {
            // Removed current track: play the track now at this index (or wrap/clamp)
            const nextIndex = index < newQueue.length ? index : 0;
            const nextTrack = newQueue[nextIndex]!;
            const engine = getAudioEngine();

            set({
              queue: newQueue,
              originalQueue: newOriginal,
              currentIndex: nextIndex,
              currentTime: 0,
              duration: nextTrack.duration || 0,
              buffered: 0,
            });

            engine.load(nextTrack);
            if (status === "playing") {
              engine.play();
            }
          } else {
            set({
              queue: newQueue,
              originalQueue: newOriginal,
            });
          }
        },

        reorderQueue: (from, to) => {
          set((s) => {
            if (
              from < 0 ||
              from >= s.queue.length ||
              to < 0 ||
              to >= s.queue.length ||
              from === to
            ) {
              return s;
            }

            const queue = [...s.queue];
            const moved = queue.splice(from, 1)[0]!;
            queue.splice(to, 0, moved);

            let nextIndex = s.currentIndex;
            if (s.currentIndex === from) {
              nextIndex = to;
            } else if (from < s.currentIndex && to >= s.currentIndex) {
              nextIndex -= 1;
            } else if (from > s.currentIndex && to <= s.currentIndex) {
              nextIndex += 1;
            }

            return {
              queue,
              currentIndex: nextIndex,
            };
          });
        },

        clearQueue: () => {
          const engine = getAudioEngine();
          engine.pause();
          set({
            queue: [],
            originalQueue: [],
            currentIndex: -1,
            status: "idle",
            currentTime: 0,
            duration: 0,
            buffered: 0,
            error: null,
          });
        },
      }),
      {
        name: "duo-player-settings",
        partialize: (s) => ({
          volume: s.volume,
          isMuted: s.isMuted,
          shuffle: s.shuffle,
          repeat: s.repeat,
          queue: s.queue,
          originalQueue: s.originalQueue,
          currentIndex: s.currentIndex,
        }),
        onRehydrateStorage: () => (state) => {
          if (
            state &&
            state.queue &&
            state.queue.length > 0 &&
            state.currentIndex >= 0 &&
            state.currentIndex < state.queue.length
          ) {
            state.status = "paused";
            const cur = state.queue[state.currentIndex];
            if (cur) {
              state.duration = cur.duration || 0;
            }
          }
        },
      },
    ),
  ),
);

// ─────────────────────────────────────────────
//  Granular Selectors (Prevent App-Wide Re-Renders)
// ─────────────────────────────────────────────

export const selectCurrentTrack = (s: PlayerState): Track | null =>
  s.queue[s.currentIndex] ?? null;

export const selectIsPlaying = (s: PlayerState): boolean =>
  s.status === "playing";

export const selectIsLoading = (s: PlayerState): boolean =>
  s.status === "loading";

export const selectCurrentTime = (s: PlayerState): number => s.currentTime;

export const selectDuration = (s: PlayerState): number => s.duration;

export const selectBuffered = (s: PlayerState): number => s.buffered;

export const selectVolume = (s: PlayerState): number => s.volume;

export const selectIsMuted = (s: PlayerState): boolean => s.isMuted;

export const selectShuffle = (s: PlayerState): boolean => s.shuffle;

export const selectRepeat = (s: PlayerState): RepeatMode => s.repeat;

export const selectStatus = (s: PlayerState): PlayerStatus => s.status;

export const selectError = (s: PlayerState): string | null => s.error;

// ─────────────────────────────────────────────
//  Client AudioEngine Subscription
// ─────────────────────────────────────────────

let isEngineSubscribed = false;
let lastPreloadedTrackId: string | null = null;
let consecutiveErrorsCount = 0;

export function initAudioEngineSubscriptions(): void {
  if (typeof window === "undefined" || isEngineSubscribed) return;
  isEngineSubscribed = true;

  const engine = getAudioEngine();
  const store = usePlayerStore;

  // Apply persisted settings
  const state = store.getState();
  engine.setVolume(state.volume);
  engine.setMuted(state.isMuted);

  engine.on("timeupdate", ({ currentTime, duration }) => {
    store.setState((s) => ({
      currentTime,
      duration: duration > 0 ? duration : s.duration,
    }));

    // Preloading next track logic:
    // When playback passes 70% or is within 15s of end
    const s = store.getState();
    const shouldCheckPreload =
      duration > 0 &&
      (currentTime / duration >= 0.7 ||
        (duration - currentTime <= 15 && duration > 20));

    if (shouldCheckPreload && s.repeat !== "one") {
      // Check data-saver mode
      const isDataSaver =
        typeof navigator !== "undefined" &&
        "connection" in navigator &&
        Boolean(
          (navigator as unknown as { connection?: { saveData?: boolean } })
            .connection?.saveData,
        );

      if (!isDataSaver) {
        let nextTrack: Track | undefined;
        if (s.currentIndex < s.queue.length - 1) {
          nextTrack = s.queue[s.currentIndex + 1];
        } else if (s.repeat === "all" && s.queue.length > 1) {
          nextTrack = s.queue[0];
        }

        if (nextTrack && nextTrack.id !== lastPreloadedTrackId) {
          lastPreloadedTrackId = nextTrack.id;
          engine.preload(nextTrack);
        }
      }
    }
  });

  engine.on("durationchange", ({ duration }) => {
    if (duration > 0) {
      store.setState({ duration });
    }
  });

  engine.on("play", () => {
    consecutiveErrorsCount = 0;
    store.setState({ status: "playing", error: null });
  });

  engine.on("canplay", () => {
    consecutiveErrorsCount = 0;
    store.setState((s) => (s.status === "loading" ? { status: "playing" } : s));
  });

  engine.on("pause", () => {
    store.setState((s) => (s.status === "playing" ? { status: "paused" } : s));
  });

  engine.on("waiting", () => {
    store.setState((s) => (s.status === "playing" ? { status: "loading" } : s));
  });

  engine.on("bufferedchange", ({ buffered }) => {
    store.setState({ buffered });
  });

  engine.on("ended", () => {
    const s = store.getState();
    lastPreloadedTrackId = null;
    if (s.repeat === "one") {
      engine.seek(0);
      engine.play();
      store.setState({ currentTime: 0, status: "playing" });
    } else {
      s.next();
    }
  });

  engine.on("error", ({ message, isAutoplayBlocked }) => {
    if (isAutoplayBlocked) {
      store.setState({
        status: "paused",
        error: message,
      });
      return;
    }

    const s = store.getState();
    const currentTrack = s.queue[s.currentIndex];
    consecutiveErrorsCount++;

    if (consecutiveErrorsCount >= s.queue.length || s.queue.length <= 1) {
      // All tracks failed, or only single track failed. Halt to avoid infinite loop.
      consecutiveErrorsCount = 0;
      store.setState({
        status: "error",
        error: message,
      });
      useUIStore.getState().addToast({
        type: "error",
        message: `Playback stopped: ${currentTrack ? currentTrack.title : "Track"} could not be played.`,
      });
    } else {
      // Skip to next track
      store.setState({
        status: "loading",
        error: message,
      });
      useUIStore.getState().addToast({
        type: "error",
        message: `Error playing "${currentTrack?.title || "track"}". Skipping to next...`,
      });
      s.next();
    }
  });
}
