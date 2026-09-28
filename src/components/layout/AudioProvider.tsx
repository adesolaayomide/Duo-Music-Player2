'use client';

import { useEffect } from 'react';
import { initAudioEngineSubscriptions } from '@/store/playerStore';

/**
 * AudioProvider — mounts once in the root layout.
 * Ensures the singleton AudioEngine event subscriptions and listeners
 * are initialized client-side and remain active across route changes.
 */
export function AudioProvider() {
  useEffect(() => {
    initAudioEngineSubscriptions();
  }, []);

  return null;
}
