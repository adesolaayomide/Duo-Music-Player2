"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderDown,
  Heart,
  Library,
  LogOut,
  Settings,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";

interface TopBarProps {
  /** Optional gradient color inherited from page cover (hex or CSS color) */
  accentColor?: string;
  children?: React.ReactNode;
}

export function TopBar({ accentColor, children }: TopBarProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const signOut = useAuthStore((s) => s.signOut);

  const isAuthenticated = status === "authenticated" && user !== null;

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
    router.push("/");
  };

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

      {/* ── Right: User Menu & Auth Actions ───────────────── */}
      <div className="relative flex items-center gap-3 shrink-0">
        {isAuthenticated ? (
          <>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-full bg-black/50 hover:bg-black/70 p-1 pr-3 text-xs font-semibold text-white transition border border-white/10"
              aria-label="User profile menu"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-bg-hover)] text-[var(--color-accent)] font-bold">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <span className="max-w-[120px] truncate">{user.username}</span>
              <ChevronDown
                size={14}
                className="text-[var(--color-text-secondary)]"
              />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-[var(--color-bg-hover)] bg-[var(--color-bg-elevated)] p-1.5 shadow-2xl animate-in fade-in duration-150 text-xs">
                  <div className="px-3 py-2 border-b border-[var(--color-bg-hover)] mb-1">
                    <p className="font-bold text-white truncate">
                      {user.username}
                    </p>
                    {user.email && (
                      <p className="text-[11px] text-[var(--color-text-secondary)] truncate">
                        {user.email}
                      </p>
                    )}
                  </div>

                  <Link
                    href="/library"
                    onClick={() => setDropdownOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white transition"
                  >
                    <Library size={16} />
                    <span>Your Library</span>
                  </Link>

                  <Link
                    href="/liked"
                    onClick={() => setDropdownOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white transition"
                  >
                    <Heart size={16} className="text-[var(--color-accent)]" />
                    <span>Liked Songs</span>
                  </Link>

                  <Link
                    href="/library/imports"
                    onClick={() => setDropdownOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white transition"
                  >
                    <FolderDown size={16} />
                    <span>Import Playlists</span>
                  </Link>

                  <Link
                    href="/settings/connections"
                    onClick={() => setDropdownOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white transition"
                  >
                    <Settings size={16} />
                    <span>Connected Accounts</span>
                  </Link>

                  <div className="my-1 border-t border-[var(--color-bg-hover)]" />

                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                  >
                    <LogOut size={16} />
                    <span>Log out</span>
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/library/imports"
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3.5 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-white hover:border-white/40 transition"
            >
              <FolderDown size={14} />
              <span>Import</span>
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-bold text-black hover:scale-105 hover:bg-white/90 transition shadow-md"
            >
              <UserIcon size={14} />
              <span>Log in</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
