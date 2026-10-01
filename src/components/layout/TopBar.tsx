"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TopBarProps {
  /** Optional gradient color inherited from page cover (hex or CSS color) */
  accentColor?: string;
  children?: React.ReactNode;
}

export function TopBar({ accentColor, children }: TopBarProps) {
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
      {/* ── Left: Navigation + Optional Search / Content ──── */}
      <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2 shrink-0">
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

        {children && <div className="flex-1 max-w-md min-w-0">{children}</div>}
      </div>

      {/* ── Right: User Menu Placeholder ─────────────────── */}
      <div className="flex items-center gap-3 shrink-0">
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
