# Duo Player — Progress

## Current Phase

Phase 1 — Foundation ✅ COMPLETE

## Completed Tasks

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
- [x] `PlayerBar` — full controls layout wired to playerStore (Phase 2 will wire audio)
- [x] `MobileNav` — bottom tab bar, safe-area-inset-bottom
- [x] `DuoLogo` — original SVG wordmark + icon mark
- [x] `Skeleton`, `SkeletonTrackRow`, `SkeletonCard`, `SkeletonShelf` components
- [x] `Button` component — 5 variants, 4 sizes, loading state, Radix Slot
- [x] Page stubs: Home, Search, Library, Liked Songs
- [x] `providers.tsx` — TanStack Query client wrapper
- [x] ESLint config — no-any,
 no-unused-vars, consistent type imports, no console
- [x] Prettier config — 100 char width, single quotes, LF
- [x] Husky pre-commit hook — runs lint-staged
- [x] Vitest config + 11 unit tests (helpers) all passing ✅
- [x] Playwright smoke test config
- [x] GitHub Actions CI workflow (lint, typecheck, test, build)
- [x] PWA manifest at `public/manifest.json`
- [x] TypeScript: 0 errors ✅
- [x] Unit tests: 11/11 passing ✅

## Open Decisions

- PWA offline: cache-first for shell, network-first for API (implement in Phase 1 polish or Phase 6)
- Sidebar resize: currently CSS width transition; draggable resize handle deferred to Phase 5
- ID3 parsing: will use `jsmediatags` in Phase 5 (local file upload)
- `next-pwa`: deferred to Phase 5/6; manifest + meta tags are in place

## Known Issues

- `tailwind.config.ts` present but unused (Tailwind v4 uses CSS-first `@theme`)
- `noUncheckedIndexedAccess` in tsconfig means array access returns `T | undefined`; handled with `!` assertion in store (safe, documented)

## Next Steps

Phase 2 — Player Core:

- Wire `AudioProvider` fully (currently has wiring code, needs testing with real track)
- Add keyboard shortcuts (Space = play/pause, ← → = prev/next, M = mute)
- Implement Media Session API (`mediaSession.ts`)
- Preload next track in queue
- Animate PlayerBar progress smoothly with requestAnimationFrame
