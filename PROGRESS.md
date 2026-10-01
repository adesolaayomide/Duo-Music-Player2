# Duo Player — Progress

## Current Phase

Phase 3 — Catalog ✅ COMPLETE

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
  - Vitest unit tests: 29 / 29 tests passing (18 playerStore tests + 11 helper tests)

### Phase 3 — Catalog ✅

- [x] **A. Jamendo Provider + Server Proxy**:
  - Jamendo API client ID (`5e8f6ba4`) secured server-side in `.env.local`, never exposed to browser bundles.
  - Server Route Handlers under `/api/catalog/*`:
    - `/api/catalog/search`: validates `q`, `type`, `limit` with `zod`, cached for 5 minutes (`revalidate: 300`).
    - `/api/catalog/featured`: aggregates trending tracks, albums, playlists, cached for 1 hour (`revalidate: 3600`).
    - `/api/catalog/track/[id]`: cached for 24 hours (`revalidate: 86400`).
    - `/api/catalog/album/[id]`: full album metadata + tracklist, cached for 24 hours (`revalidate: 86400`).
    - `/api/catalog/artist/[id]`: artist info + top tracks + albums, cached for 24 hours (`revalidate: 86400`).
    - `/api/catalog/playlist/[id]`: playlist tracks, cached for 1 hour (`revalidate: 3600`).
    - `/api/catalog/genre/[tag]`: tracks filtered by tag, cached for 1 hour (`revalidate: 3600`).
  - In-memory sliding window rate limiter (`src/lib/server/rateLimit.ts`): 60 req/min per IP.
  - Normalizers (`src/lib/providers/jamendo.normalize.ts`): maps raw Jamendo responses to internal domain `Track`, `Album`, `Artist`, `Playlist`.
  - SSR-safe HTML entity decoding (`&amp;`, `&quot;`, `&#039;`, accented entities, hex/dec entities).
  - Creative Commons license parsing: maps CC URLs to short codes (`cc-by-sa`, `cc-by-nc`, etc.) and human-readable labels.
  - Image upgrade to 500px resolution (`width=500`) with SVG fallbacks (`/images/fallback-cover.svg`, `/images/fallback-artist.svg`).
  - Client-side provider (`src/lib/providers/jamendo.ts`): implements `MusicProvider` interface by calling `/api/catalog` proxy endpoints.
- [x] **B. Data Hooks (`src/hooks/useCatalog.ts`)**:
  - TanStack Query hooks: `useFeatured`, `useSearch`, `useTrack`, `useAlbum`, `useArtist`, `usePlaylist`, `useGenreTracks`.
  - Configured with `placeholderData: keepPreviousData` for search typing, sensible `staleTime`, and `retry: 1`.
- [x] **C. Shared Media Components (`src/components/media/`)**:
  - `TrackRow`: index -> play button on hover, title/artist links, album, duration, like heart, more options menu (`Play next`, `Add to queue`, `Go to album/artist`, `License info`). Animated equalizer icon while active. Single click plays in list context (`playQueue(tracks, index)`).
  - `TrackCard`, `AlbumCard`, `ArtistCard` (circular), `PlaylistCard`: Spotify-styled cards with floating green play buttons that slide up on hover. Instant playback trigger without mandatory navigation.
  - `Shelf`: smooth horizontal scrolling collection with header, subtitle, "Show all" link, and responsive chevron navigation buttons.
  - `LicenseDialog`: Creative Commons attribution modal detailing track license, link to CC deed, and link back to Jamendo track source.
- [x] **D. Home Page (`src/app/page.tsx`)**:
  - Dynamic local time-based greeting ("Good morning / afternoon / evening").
  - Quick Access 2×4 grid with top featured items and hover play buttons.
  - Independent horizontal shelves for *Featured Tracks*, *Popular Albums*, *Curated Playlists*, and *Explore Genres*.
  - Skeleton loading states (`SkeletonShelf`, `SkeletonCard`).
- [x] **E. Search View (`src/app/search/page.tsx`)**:
  - Pill search bar in TopBar with magnifying glass and clear button.
  - 300ms debounce with URL synchronization (`?q=...&tab=...`).
  - Empty query state: Recent searches list (localStorage) + colorful "Browse all" genre tiles grid.
  - Active query state: Tabs for *All*, *Songs*, *Albums*, *Artists*.
    - *All* tab: Spotify-style "Top Result" card with instant play button + top 4 tracks + albums/artists shelves.
    - Specialized tabs: Paginated grid/list of results.
  - Friendly empty state for queries without matches.
- [x] **F. Detail Views**:
  - `/album/[id]`: sticky header with cover art, release year, duration, action bar (big play, shuffle, like), and full tracklist.
  - `/artist/[id]`: circular avatar header, verified artist badge, top 5 popular tracks with "See more" expansion, and discography shelf.
  - `/playlist/[id]`: curated playlist header, owner info, action bar, and tracklist.
- [x] **G. Genre Browse (`src/app/genre/[slug]/page.tsx`)**:
  - Genre registry (`src/lib/utils/genres.ts`) with distinct pastel/vibrant colors and descriptions.
  - Genre hub page with stylized header banner, play/shuffle controls, genre tracklist, and explore shelf.
- [x] **H. Dev Fixture Removal & Test Verification**:
  - Removed temporary Phase 2 dev artifacts: `public/dev-audio/`, `src/lib/dev/fixtures.ts`, `src/lib/dev/DevPlayButton.tsx`.
  - Vitest unit tests: 40 / 40 tests passing (11 normalizer tests + 18 playerStore tests + 11 helper tests).
  - Next.js production build: compiles and optimizes all 15 routes cleanly.
  - Playwright e2e tests: 3 / 3 passing (`home page loads and shows navigation and shelves`, `search page searches catalog and shows results`, `catalog playback survives route navigation`).

## Open Decisions

- Queue persistence across app restarts: deferred to Phase 4 (Supabase persistent queue)
- Draggable re-ordering in queue panel: UI reorder action ready, drag gesture interaction in Phase 5 polish
- Rate limiting on server proxy: in-memory token bucket implementation suitable for single-instance Next.js deployment; can upgrade to Redis (Upstash) in Phase 6 if distributed multi-instance deployment is used.

## Known Issues

(none)

## Next Steps

Phase 4 — Accounts & User Data:
- Supabase Auth integration (email/password, OAuth provider, sessions)
- User playlists (create, edit, delete, add track, reorder tracks)
- Liked songs collection synced with Supabase Postgres
- Recently played tracks history
- Persistent player queue saved to user profile
