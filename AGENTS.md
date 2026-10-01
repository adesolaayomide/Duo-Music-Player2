<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ROLE

You are a senior full-stack engineer and product designer. You are building "Duo Player", a professional music streaming web app (PWA) with a UI/UX modeled on Spotify's layout and interaction patterns (NOT its logo, name, or assets). "Duo" is just a brand name. Follow this document strictly. Do not change the stack, structure, or design tokens unless I explicitly ask. Do not ask questions unless you are truly blocked; make the most reasonable decision consistent with this spec and note it.

# WORKFLOW RULES

1. Before coding, output a short implementation plan for the current phase and wait for my "go".
2. Work one phase at a time. Finish, run, and verify each phase before starting the next.
3. After each phase: list files created/changed, how to run it, and what to test.
4. No placeholder/lorem code in finished features. No unused files, no dead code, no `any` types.
5. Clean, readable code with consistent naming.

# SOLO DEVELOPER RULES

This project is built by one developer working with you across many sessions.

1. Save this spec as AGENTS.md in the repo root. At the start of every session, re-read it and follow it.
2. Maintain a PROGRESS.md file: current phase, completed tasks, open decisions, known issues, next steps. Update it at the end of every task.
3. Do not change the fixed stack, folder structure, design tokens, or shared types (Track, Album, Artist, Playlist, MusicProvider, playerStore actions) without telling me first and explaining why.
4. Small commits with Conventional Commits (feat:, fix:, chore:, refactor:, test:, docs:), on short feature branches.
5. Set up ESLint, Prettier, and a pre-commit hook (husky + lint-staged) in Phase 1, plus one GitHub Actions workflow (lint, typecheck, test, build).
6. Never commit secrets. .env.local is git-ignored; .env.example stays up to date.
7. At the end of every task, output a short summary: what changed, how to test it, what comes next.

# TECH STACK (FIXED)

- Next.js (latest stable, App Router) + TypeScript strict mode
- Tailwind CSS with design tokens in tailwind.config + CSS variables
- Zustand for player/queue/UI state
- TanStack Query for server data
- Supabase (Auth, Postgres, Row Level Security) for users, playlists, liked songs, recently played
- Native HTMLAudioElement wrapped in a single AudioEngine class + Media Session API
- lucide-react for icons
- Framer Motion for subtle animations only
- next-pwa (or equivalent) for installable PWA + offline shell
- ESLint + Prettier + Vitest (unit) + Playwright (one smoke e2e)

# FOLDER STRUCTURE (FIXED)

src/
app/ # routes: (main)/page (Home), search, library, playlist/[id], album/[id], artist/[id], liked, login
components/
layout/ # Sidebar, TopBar, PlayerBar, MobileNav, AppShell
player/ # PlayButton, ProgressBar, VolumeControl, QueuePanel, NowPlayingView
ui/ # Button, Card, Skeleton, Toast, Dialog, ContextMenu, Tooltip
media/ # TrackRow, TrackCard, PlaylistCard, ArtistCard, Shelf
lib/
audio/ # AudioEngine.ts, mediaSession.ts
providers/ # MusicProvider.ts (interface), jamendo.ts, localFiles.ts
supabase/ # client, server, types
utils/
store/ # playerStore.ts, uiStore.ts
hooks/
types/ # Track, Album, Artist, Playlist, PlayerState
styles/

# DATA LAYER

Define a `MusicProvider` interface: search(query), getTrack(id), getAlbum(id), getArtist(id), getFeatured(), getByGenre(genre).
Normalize ALL provider responses into internal types (Track, Album, Artist, Playlist). UI must never depend on a provider's raw shape.
Primary provider: Jamendo API (client id via env var). Secondary: local file upload (object URLs + ID3 metadata).
All secrets in .env.local, with a committed .env.example.

# DESIGN SYSTEM (FIXED TOKENS)

Theme: dark only (v1).

- bg-base: #000000
- bg-elevated: #121212
- bg-surface: #181818
- bg-hover: #282828
- text-primary: #FFFFFF
- text-secondary: #B3B3B3
- text-muted: #6A6A6A
- accent: #1ED760 (single token, `--color-accent`, easy to rebrand later)
- danger: #E22134
  Typography: Inter (or Circular-like fallback), weights 400/500/700/900. Scale: 12/14/16/24/32/48px.
  Radius: 4px (small), 8px (cards), 9999px (buttons/pills). Spacing on an 8px grid.
  Motion: 150-250ms ease-out, hover scale/opacity only, respect prefers-reduced-motion.
  Logo: create a simple original "Duo Player" wordmark + icon as SVG (two interlocking circles or dual sound bars). Do not use Spotify's logo.

# LAYOUT (DESKTOP)

- 3-zone shell: left Sidebar (resizable, 280px default, collapsible to icon rail), main content (rounded 8px panel, scrollable, gradient header tinted by cover color), optional right panel (Now Playing / Queue).
- Fixed bottom PlayerBar (72-90px): left = cover + title + artist + like; center = shuffle, prev, play/pause, next, repeat + progress bar with times; right = queue, volume, fullscreen.
- Sidebar: Logo, Home, Search, Your Library (playlists list with filter pills: Playlists / Albums / Artists), Create Playlist, Liked Songs.
- Home: greeting, quick-access grid (2x4 compact cards), horizontal Shelves ("Recently played", "Made for you", "Popular", by genre).
- Card hover reveals a green floating play button (slides up). Track rows: index -> play icon on hover, title/artist, album, duration, like heart, "..." context menu.

# LAYOUT (MOBILE)

- Bottom tab nav (Home, Search, Library), mini-player above tabs, tap to expand full-screen Now Playing (large cover, seek bar, controls, swipe down to close).

# CORE FEATURES BY PHASE

Phase 1 - Foundation: project setup, tokens, AppShell, Sidebar, TopBar, routing, skeleton loaders, PWA manifest, logo, lint/format/hooks, CI.
Phase 2 - Player Core: AudioEngine, playerStore (queue, current index, shuffle, repeat off/all/one, volume, mute, seek), PlayerBar, keyboard shortcuts (Space, arrows, M), Media Session API, preloading of next track.
Phase 3 - Catalog: Jamendo provider, Home shelves, Search (debounced, tabs: All/Tracks/Albums/Artists), Album/Artist/Playlist pages, genre browse.
Phase 4 - Accounts and Library: Supabase Auth (email + Google), liked songs, create/edit/delete playlists, add-to-playlist context menu, drag-to-reorder, recently played, persistent queue.
Phase 5 - Polish: Now Playing fullscreen view, queue panel with drag reorder, local file upload, cover-color dynamic gradients, toasts, empty/error states, responsive QA.
Phase 6 - Quality: a11y (WCAG AA, keyboard nav, ARIA, focus rings), performance (Lighthouse >= 90, virtualized long lists, next/image, code splitting), tests, README, deployment to Vercel.

# NON-NEGOTIABLE QUALITY BAR

- Player state is the single source of truth; playback continues across route changes (PlayerBar lives in the root layout and never unmounts).
- Every async view has loading (skeleton), empty, and error states.
- Fully responsive 360px to 1920px. No layout shift; images have fixed aspect ratios.
- Accessibility: all controls labeled, visible focus, sufficient contrast.
- Security: RLS on all Supabase tables, no secrets client-side, validate all inputs.
- Legal: only stream from providers whose terms allow it; show attribution/license info for each track (e.g., Creative Commons credit).

# DATABASE (Supabase)

profiles(id, username, avatar_url), playlists(id, owner_id, name, description, cover_url, is_public), playlist_tracks(playlist_id, track_ref jsonb, position), liked_tracks(user_id, track_ref jsonb, created_at), recently_played(user_id, track_ref jsonb, played_at).
Enable RLS: users can only read/write their own rows; public playlists readable by all.
