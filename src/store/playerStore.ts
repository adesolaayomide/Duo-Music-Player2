import type { PlayerState, Track, RepeatMode } from '@/types';
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

// ─────────────────────────────────────────────
//  Actions
// ─────────────────────────────────────────────

interface PlayerActions {
  /** Replace the queue and start playing from the given index */
  loadQueue: (tracks: Track[], startIndex?: number) => void;
  /** Append tracks to the end of the queue */
  enqueue: (tracks: Track[]) => void;
  /** Play the track at a specific queue index */
  jumpTo: (index: number) => void;
  playNext: () => void;
  playPrev: () => void;
  setPlaying: (playing: boolean) => void;
  setBuffering: (buffering: boolean) => void;
  setPosition: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
}

// ─────────────────────────────────────────────
//  Initial state
// ─────────────────────────────────────────────

const initialState: PlayerState = {
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  isBuffering: false,
  position: 0,
  volume: 0.8,
  isMuted: false,
  shuffle: false,
  repeat: 'off',
};

// ─────────────────────────────────────────────
//  Store
// ─────────────────────────────────────────────

export const usePlayerStore = create<PlayerState & PlayerActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,

        loadQueue: (tracks, startIndex = 0) => {
          set({
            queue: tracks,
            currentIndex: startIndex,
            isPlaying: true,
            position: 0,
            isBuffering: false,
          });
        },

        enqueue: (tracks) => {
          set((s) => ({ queue: [...s.queue, ...tracks] }));
        },

        jumpTo: (index) => {
          const { queue } = get();
          if (index < 0 || index >= queue.length) return;
          set({ currentIndex: index, position: 0, isPlaying: true, isBuffering: false });
        },

        playNext: () => {
          const { queue, currentIndex, shuffle, repeat } = get();
          if (queue.length === 0) return;

          if (shuffle) {
            let next: number;
            do {
              next = Math.floor(Math.random() * queue.length);
            } while (next === currentIndex && queue.length > 1);
            set({ currentIndex: next, position: 0, isBuffering: false });
            return;
          }

          const isLast = currentIndex === queue.length - 1;
          if (isLast && repeat === 'all') {
            set({ currentIndex: 0, position: 0, isBuffering: false });
          } else if (!isLast) {
            set({ currentIndex: currentIndex + 1, position: 0, isBuffering: false });
          } else {
            // End of queue, stop
            set({ isPlaying: false, position: 0 });
          }
        },

        playPrev: () => {
          const { queue, currentIndex, position } = get();
          if (queue.length === 0) return;
          // If > 3 s in, restart current track
          if (position > 3) {
            set({ position: 0 });
            return;
          }
          const prev = currentIndex > 0 ? currentIndex - 1 : 0;
          set({ currentIndex: prev, position: 0, isBuffering: false });
        },

        setPlaying: (playing) => set({ isPlaying: playing }),
        setBuffering: (buffering) => set({ isBuffering: buffering }),
        setPosition: (seconds) => set({ position: seconds }),

        setVolume: (volume) => {
          const clamped = Math.min(1, Math.max(0, volume));
          set({ volume: clamped, isMuted: clamped === 0 });
        },

        toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

        toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),

        cycleRepeat: () => {
          const order: RepeatMode[] = ['off', 'all', 'one'];
          set((s) => {
            const next = order[(order.indexOf(s.repeat) + 1) % order.length];
            return { repeat: next };
          });
        },

        removeFromQueue: (index) => {
          set((s) => {
            const queue = s.queue.filter((_, i) => i !== index);
            let currentIndex = s.currentIndex;
            if (index < currentIndex) currentIndex -= 1;
            else if (index === currentIndex) currentIndex = Math.min(currentIndex, queue.length - 1);
            return { queue, currentIndex };
          });
        },

        reorderQueue: (from, to) => {
          set((s) => {
            const queue = [...s.queue];
            const [moved] = queue.splice(from, 1);
            queue.splice(to, 0, moved);
            let currentIndex = s.currentIndex;
            if (s.currentIndex === from) {
              currentIndex = to;
            } else if (from < s.currentIndex && to >= s.currentIndex) {
              currentIndex -= 1;
            } else if (from > s.currentIndex && to <= s.currentIndex) {
              currentIndex += 1;
            }
            return { queue, currentIndex };
          });
        },
      }),
      {
        name: 'duo-player-state',
        // Only persist non-transient fields
        partialize: (s) => ({
          queue: s.queue,
          currentIndex: s.currentIndex,
          volume: s.volume,
          isMuted: s.isMuted,
          shuffle: s.shuffle,
          repeat: s.repeat,
          // Position not persisted — resume from start
        }),
      }
    )
  )
);

// ─────────────────────────────────────────────
//  Selectors (memoized)
// ─────────────────────────────────────────────

export const selectCurrentTrack = (s: PlayerState & PlayerActions): Track | null =>
  s.queue[s.currentIndex] ?? null;
