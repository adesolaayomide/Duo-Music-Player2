'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TopBarProps {
  /** Optional gradient color inherited from page cover (hex or CSS color) */
  accentColor?: string;
}

export function TopBar({ accentColor }: TopBarProps) {
  const router = useRouter();

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-6 h-16 bg-transparent"
      style={
        accentColor
          ? {
              background: `linear-gradient(to bottom, ${accentColor}cc 0%, transparent 100%)`,
            }
          : undefined
      }
    >
      {/* ── Back / Forward navigation ──────────────── */}
      <div className="flex items-center gap-2">
        <Button
          variant="icon"
          size="icon"
          onClick={() => router.back()}
          aria-label="Go back"
          className="bg-black/40 hover:bg-black/60 text-white rounded-full h-8 w-8"
        >
          <ChevronLeft size={20} />
        </Button>
        <Button
          variant="icon"
          size="icon"
          onClick={() => router.forward()}
          aria-label="Go forward"
          className="bg-black/40 hover:bg-black/60 text-white rounded-full h-8 w-8"
        >
          <ChevronRight size={20} />
        </Button>
      </div>

      {/* ── Right: user menu placeholder ───────────── */}
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full h-8 flex items-center gap-2 bg-black/40 border-transparent hover:bg-black/60"
          aria-label="User menu"
        >
          <span className="bg-text-muted rounded-full p-0.5">
            <User size={14} />
          </span>
          <span className="text-sm font-semibold text-white pr-1">Log in</span>
        </Button>
      </div>
    </header>
  );
}
