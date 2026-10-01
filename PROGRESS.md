# Duo Player — Progress

## Current Phase

Phase 4 — Accounts & Library ✅ COMPLETE

## Completed Tasks

### Phase 1 — Foundation ✅

- [x] Project scaffolded: Next.js 16 App Router + TypeScript strict mode
- [x] Tailwind v4 configured with `@theme` CSS-first design tokens
- [x] CSS variables for all design tokens in `globals.css`
- [x] AGENTS.md and PROGRESS.md created
- [x] `.env.example` committed (secrets never committed)
- [x] Shared types: `Track`, `Album`, `Artist`, `Playlist`, `PlayerState`, `MusicProvider` interface
- [x] Zustand `playerStore` — queue, shuffle, repeat cycling, persist, selectors
- [x] Zustand `uiStore` — sidebar collapse, right panel, toasts
- [x] `AudioProvider` — headless audio component, mounts once, syncs with store
- [x] `AppShell` (root `layout.tsx`) — 3-zone desktop + AudioProvider + PlayerBar
- [x] `Sidebar` — collapse to icon rail, nav links, Library panel, Liked Songs
- [x] `TopBar` — back/forward nav, user menu placeholder, accent gradient
- [x] `PlayerBar` — full controls layout
- [x] `MobileNav` — bottom tab bar, safe-area-inset-bottom
- [x] `DuoLogo` — original SVG wordmark + icon mark
- [x] `Skeleton`, `SkeletonTrackRow`, `SkeletonCard`, `SkeletonShelf` components
- [x] `Button` component — 5 variants, 4 sizes, loading state, Radix Slot
- [x] `providers.tsx` — TanStack Query client wrapper
- [x] ESLint config, Prettier config, Husky + lint-staged
- [x] Vitest & Playwright configurations
- [x] GitHub Actions CI workflow (lint, typecheck, test, build)

### Phase 2 — Player Core ✅

- [x] `AudioEngine` singleton wrapping HTMLAudioElement with typed events
- [x] `playerStore` public actions: playTrack, playQueue, togglePlay, next, previous, seek, setVolume, toggleMute, toggleShuffle, cycleRepeat
- [x] Media Session API integration for OS/lock-screen controls
- [x] Keyboard shortcuts (Space = play/pause, ← → = prev/next, M = mute, S = shuffle, R = repeat)
- [x] Next track preloading in `AudioEngine`
- [x] Edge case handling: autoplay rejections, rapid switching, playback error toasts

### Phase 3 — Catalog ✅

- [x] Server-side Jamendo API proxy handlers (`/api/catalog/*` with zod validation, caching, rate limiting)
- [x] Response normalizers mapping to domain types with Creative Commons licensing
- [x] TanStack Query hooks: `useFeatured`, `useSearch`, `useTrack`, `useAlbum`, `useArtist`, `usePlaylist`, `useGenreTracks`
- [x] Shared media components: `TrackRow`, `TrackCard`, `AlbumCard`, `ArtistCard`, `PlaylistCard`, `Shelf`, `LicenseDialog`
- [x] Home page with greeting, quick access grid, and horizontal shelves
- [x] Search page with debounced input, category tabs, and genre browse cards
- [x] Detail views: `/album/[id]`, `/artist/[id]`, `/playlist/[id]`, `/genre/[slug]`

### Phase 4 — Accounts & Library ✅

- [x] Supabase Postgres schema (`supabase/schema.sql`) with tables: `profiles`, `playlists`, `playlist_tracks`, `liked_tracks`, `recently_played` and full RLS policies
- [x] Supabase browser & SSR clients with dual-mode fallback (`isSupabaseConfigured()`)
- [x] `authStore`: email/password sign-in/up, Google OAuth, and instant guest mode with `localStorage` persistence
- [x] `/login` page with Spotify styling, mode toggle, error banners, and "Continue as Guest"
- [x] TopBar user profile menu: avatar/initials, username display, links to Library and Liked Songs, and Log out
- [x] `useLikedSongs` store/hook: dual-mode persistence (Supabase `liked_tracks` / `localStorage`), O(1) ID lookup, toggle like, and toast notifications
- [x] Liked Songs UI: heart buttons in `TrackRow`, `PlayerBar`, `MiniPlayer`, and detail headers
- [x] `/liked` page: vibrant purple-to-emerald gradient header, play/shuffle actions, track table, and empty state
- [x] `usePlaylists` store/hook: custom user playlists with CRUD operations, track addition/removal, reordering, and dual-mode persistence
- [x] `PlaylistModal`: dialog for creating and renaming user playlists
- [x] TrackRow context menu ("..."): "Add to playlist" submenu (lists playlists + "+ New playlist"), and "Remove from this playlist"
- [x] `/library` page: filter pills ("All", "Playlists", "Albums", "Artists"), pinned Liked Songs card, playlist grid, and empty state
- [x] `Sidebar`: "+ Create playlist" shortcut, Liked Songs count badge, and user playlists list
- [x] `/playlist/[id]`: support for user-created playlists (edit details, delete playlist with confirmation modal, remove tracks)
- [x] `useRecentlyPlayed`: tracking played tracks, deduplication, and "Recently Played" shelf on Home page
- [x] `playerStore` persistent queue: active queue, original queue, and currentIndex persist across page reloads
- [x] Tests: 58/58 Vitest unit tests passing across 7 test files ✅
- [x] Playwright: 6/6 e2e tests passing ✅
- [x] ESLint: 0 errors, 0 warnings ✅
- [x] TypeScript: 0 errors ✅
- [x] Production build: Next.js Turbopack build succeeded ✅

## Open Decisions

- PWA offline: cache-first for shell, network-first for API (Phase 5/6)
- Draggable sidebar resize: Phase 5
- ID3 parsing for local files: `jsmediatags` in Phase 5

## Known Issues

(none)

## Next Steps

Phase 5 — Polish:

- Fullscreen Now Playing view with large artwork, lyrics stub, and ambient background glow
- Queue drawer panel with drag-to-reorder and clear queue
- Local file upload (drag & drop, object URLs, ID3 metadata extraction)
- Dynamic cover-based gradient themes on detail views
- Comprehensive toast notifications and polished empty/error states
