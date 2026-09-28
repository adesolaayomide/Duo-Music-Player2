/**
 * ─────────────────────────────────────────────────────────────────
 * DEV ONLY - delete in Phase 3
 * Sample audio tracks for exercising the player core during Phase 2.
 * ─────────────────────────────────────────────────────────────────
 */

import type { Track } from '@/types';

export const DEV_TRACKS: Track[] = [
  {
    id: 'dev-track-1',
    title: 'Ambient Breeze',
    artistId: 'dev-artist-1',
    artistName: 'Echo Horizon',
    albumId: 'dev-album-1',
    albumName: 'Atmospheres Vol. 1',
    audioUrl: '/dev-audio/ambient-breeze.wav',
    coverUrl: '',
    duration: 8,
    license: 'cc-by',
    licenseLabel: 'Creative Commons Attribution',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    genre: 'Ambient',
    provider: 'local',
    providerTrackId: 'dev-1',
  },
  {
    id: 'dev-track-2',
    title: 'Midnight Drive',
    artistId: 'dev-artist-2',
    artistName: 'Neon Cascade',
    albumId: 'dev-album-2',
    albumName: 'Nightlines',
    audioUrl: '/dev-audio/midnight-drive.wav',
    coverUrl: '',
    duration: 8,
    license: 'cc-by',
    licenseLabel: 'Creative Commons Attribution',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    genre: 'Synthwave',
    provider: 'local',
    providerTrackId: 'dev-2',
  },
  {
    id: 'dev-track-3',
    title: 'Solar Drift',
    artistId: 'dev-artist-3',
    artistName: 'Aura Polaris',
    albumId: 'dev-album-3',
    albumName: 'Interstellar Waves',
    audioUrl: '/dev-audio/solar-drift.wav',
    coverUrl: '',
    duration: 8,
    license: 'cc-by',
    licenseLabel: 'Creative Commons Attribution',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    genre: 'Chillout',
    provider: 'local',
    providerTrackId: 'dev-3',
  },
];
