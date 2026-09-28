'use client';

import { useState, useRef, useCallback } from 'react';
import { Volume2, Volume1, VolumeX } from 'lucide-react';
import { usePlayerStore, selectVolume, selectIsMuted } from '@/store/playerStore';
import { cn } from '@/lib/utils/cn';

interface VolumeControlProps {
  className?: string;
}

export function VolumeControl({ className }: VolumeControlProps) {
  const volume = usePlayerStore(selectVolume);
  const isMuted = usePlayerStore(selectIsMuted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);

  const [isDragging, setIsDragging] = useState(false);
  const [dragVolume, setDragVolume] = useState(volume);
  const sliderRef = useRef<HTMLDivElement>(null);

  const effectiveVolume = isMuted ? 0 : isDragging ? dragVolume : volume;
  const percent = Math.round(effectiveVolume * 100);

  const calculateVolumeFromPointer = useCallback((clientX: number): number => {
    if (!sliderRef.current) return 0;
    const rect = sliderRef.current.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, ratio));
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    const newVol = calculateVolumeFromPointer(e.clientX);
    setDragVolume(newVol);
    setVolume(newVol);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const newVol = calculateVolumeFromPointer(e.clientX);
    setDragVolume(newVol);
    setVolume(newVol);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const finalVol = calculateVolumeFromPointer(e.clientX);
    setVolume(finalVol);
    setIsDragging(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      setVolume(Math.min(1, volume + 0.05));
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setVolume(Math.max(0, volume - 0.05));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setVolume(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setVolume(1);
    }
  };

  const renderIcon = () => {
    if (isMuted || effectiveVolume === 0) {
      return <VolumeX size={18} />;
    }
    if (effectiveVolume < 0.5) {
      return <Volume1 size={18} />;
    }
    return <Volume2 size={18} />;
  };

  return (
    <div className={cn('flex items-center gap-2 group', className)}>
      <button
        type="button"
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        className="text-text-secondary hover:text-white transition-colors duration-fast p-1 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
      >
        {renderIcon()}
      </button>

      <div
        ref={sliderRef}
        role="slider"
        tabIndex={0}
        aria-label="Volume slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent}%`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setIsDragging(false)}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative w-24 h-3 flex items-center cursor-pointer touch-none outline-none',
          'focus-visible:ring-1 focus-visible:ring-accent rounded-full'
        )}
      >
        {/* Track */}
        <div className="w-full h-1 bg-bg-hover rounded-full overflow-hidden relative">
          <div
            className="absolute top-0 bottom-0 left-0 bg-white group-hover:bg-accent transition-colors duration-fast rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Thumb */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-md pointer-events-none transition-opacity duration-fast',
            isDragging ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100'
          )}
          style={{ left: `${percent}%` }}
        />
      </div>
    </div>
  );
}
