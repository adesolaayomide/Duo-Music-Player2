'use client';

import { useRef, useEffect } from 'react';
import { usePlayerStore, selectCurrentTrack } from '@/store/playerStore';

/**
 * AudioProvider — renders nothing but owns the HTMLAudioElement lifecycle.
 * Mount this ONCE in the root layout so the audio never unmounts across
 * route changes. All control flows through the Zustand playerStore.
 */
export function AudioProvider() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    isPlaying,
    volume,
    isMuted,
    position,
    repeat,
    setPlaying,
    setBuffering,
    setPosition,
    playNext,
  } = usePlayerStore();

  const currentTrack = usePlayerStore(selectCurrentTrack);

  // ── Create the audio element once ──────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // ── Sync track source ───────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentTrack) {
      audio.pause();
      audio.src = '';
      return;
    }
    if (audio.src !== currentTrack.audioUrl) {
      audio.src = currentTrack.audioUrl;
      audio.load();
      if (isPlaying) audio.play().catch(() => setPlaying(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.audioUrl]);

  // ── Sync play/pause ─────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (isPlaying) {
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack, setPlaying]);

  // ── Sync volume / mute ──────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // ── Sync repeat ─────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = repeat === 'one';
  }, [repeat]);

  // ── Audio event listeners ───────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onWaiting = () => setBuffering(true);
    const onCanPlay = () => setBuffering(false);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => setPosition(audio.currentTime);
    const onEnded = () => {
      if (repeat !== 'one') playNext();
    };

    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [repeat, playNext, setBuffering, setPlaying, setPosition]);

  // ── Seek when store position changes externally ─────────────────────────
  const lastStorePosition = useRef(0);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // Only seek if the delta is large (user scrubbed, not natural playback)
    if (Math.abs(position - lastStorePosition.current) > 1.5) {
      audio.currentTime = position;
    }
    lastStorePosition.current = position;
  }, [position]);

  return null; // renders nothing
}
