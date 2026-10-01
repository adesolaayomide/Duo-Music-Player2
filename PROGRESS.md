# Duo Player — Progress

## Current Phase

Phase 2 — Player Core ✅ COMPLETE

## Completed Tasks

### Phase 1 — Foundation ✅

- [x] Project scaffolded: Next.js 16 App Router + TypeScript strict mode
- [x] Tailwind v4 configured with `@theme` CSS-first design tokens
- [x] CSS variables for all design tokens in `globals.css`
- [x] AGENTS.md and PROGRESS.md created
- [x] `.env.example` committed (secrets never committed)
- [x] Shared types: `Track`, `Album`, `Artist`, `Playlist`, `PlayerState`, `MusicProvider` interface
- [x] Zustand `uiStore` — sidebar collapse, right panel, toasts
- [x] `AppShell` (root `layout.tsx`) — 3-zone desktop + AudioProvider + PlayerBar
- [x] `Sidebar` — collapse to icon rail, nav links, Library panel, Liked Songs
- [x] `TopBar` — back/forward nav, user menu placeholder, accent gradient
- [x] `MobileNav` — bottom tab bar, safe-area-inset-bottom
- [x] `DuoLogo` — original SVG wordmark + icon mark
- [x] `Skeleton`, `SkeletonTrackRow`, `SkeletonCard`, `SkeletonShelf` components
- [x] `Button` component — 5 variants, 4 sizes, loading state, Radix Slot
- [x] Page stubs: Home, Search, Library, Liked Songs
- [x] `providers.tsx` — TanStack Query client wrapper
- [x] ESLint config — no-any, no-unused-vars, consistent type imports, no console
- [x] Prettier config — 100 char width, single quotes, LF
- [x] Husky pre-commit hook — runs lint-staged
- [x] GitHub Actions CI workflow (lint, typecheck, test, build)
- [x] PWA manifest at `public/manifest.json`

### Phase 2 — Player Core ✅

- [x] **A. AudioEngine (`src/lib/audio/AudioEngine.ts`)**:
  - Singleton wrapping native `HTMLAudioElement`, created lazily client-side
  - Typed event emitter (`timeupdate`, `durationchange`, `ended`, `play`, `pause`, `waiting`, `canplay`, `error`, `bufferedchange`)
  - Public API: `load`, `play`, `pause`, `toggle`, `seek`, `setVolume`, `setMuted`, `preload`, `destroy`
  - Handles autoplay rejections gracefully with friendly status
  - 1 automatic network retry before surfacing errors
  - Stale load cancellation tokens preventing race conditions on rapid switching
- [x] **B. playerStore (`src/store/playerStore.ts`)**:
  - Zustand store managing `queue`, `originalQueue`, `currentIndex`, `status`, `currentTime`, `duration`, `buffered`, `volume`, `isMuted`, `shuffle`, `repeat`, `error`
  - Complete public actions: `playTrack`, `playQueue`, `togglePlay`, `next`, `previous`, `seek`, `setVolume`, `toggleMute`, `toggleShuffle`, `cycleRepeat`, `addToQueue`, `playNext`, `removeFromQueue`, `reorderQueue`, `clearQueue`
  - Rules: `previous()` restarts if `> 3s`; `next()` wraps on `repeat === 'all'` and stops at end on `repeat === 'off'`; `repeat === 'one'` replays same track; Fisher-Yates shuffle with pinned current track & exact un-shuffle restoration
  - Granular selectors (`selectCurrentTime`, `selectDuration`, `selectBuffered`, etc.) avoiding app-wide re-renders
  - LocalStorage persistence for user preferences (`volume`, `isMuted`, `shuffle`, `repeat`)
- [x] **C. PlayerBar UI (`src/components/layout/PlayerBar.tsx` + `src/components/player/*`)**:
  - Modularized components: `PlayButton`, `ProgressBar`, `VolumeControl`, `QueuePanel`, `MiniPlayer`
  - Pointer events with `setPointerCapture` for smooth seek and volume scrubbing (mouse and touch)
  - Full keyboard accessibility (`role="slider"`, aria values, arrow keys)
  - States: idle placeholder, loading spinner, error banner + retry
  - Mobile mini-player docked above bottom navigation
  - Root layout persistence: playback continues uninterrupted across route changes
- [x] **D. Keyboard Shortcuts + Media Session**:
  - `useKeyboardShortcuts`: Space (play/pause with scroll prevention), Arrow keys (seek ±5s, volume ±5%), Shift+Arrows (prev/next), M (mute), S (shuffle), R (repeat). Form inputs ignored.
  - `mediaSession.ts`: `navigator.mediaSession` metadata (title, artist, album, artwork in 3 sizes), playbackState, position state, action handlers
- [x] **E. Preloading + Edge Cases**:
  - Preloads next track via hidden audio element when progress >= 70% or <= 15s remaining
  - Skips preloading on `repeat === 'one'` and `saveData` mode
  - Handles single-track queue, current track removal, playing queue reorder
  - Track load error recovery with consecutive error counter to prevent infinite skip loops
- [x] **F. Dev Fixtures & Tests**:
  - `src/lib/dev/fixtures.ts`: sample audio tracks in `public/dev-audio/` (DEV ONLY - delete in Phase 3)
  - `src/lib/dev/DevPlayButton.tsx`: sample queue trigger on Home page (DEV ONLY - delete in Phase 3)
  - Vitest unit tests: 29 / 29 tests passing (18 playerStore tests + 11 helper tests)
  - Extended Playwright smoke test: verifies playback across route navigation

## Dev Items for Phase 3 Removal

- `public/dev-audio/` (sample WAV audio tracks)
- `src/lib/dev/fixtures.ts` (dev tracks fixture)
- `src/lib/dev/DevPlayButton.tsx` (sample queue button)
- DevPlayButton reference in `src/app/page.tsx`

## Open Decisions

- Queue persistence across app restarts: deferred to Phase 4 (Supabase persistent queue)
- Draggable re-ordering in queue panel: UI reorder action ready, drag gesture interaction in Phase 5 polish

## Known Issues

(none)

## Next Steps

Phase 3 — Catalog:

- Jamendo MusicProvider implementation with normalization to `Track`, `Album`, `Artist`
- Home shelves ("Featured", "Popular", "Made for you", genre shelves)
- Search view with debounced input and tabs (All / Tracks / Albums / Artists)
- Album, Artist, and Playlist detail pages
- Remove Phase 2 dev fixtures
