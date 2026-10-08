"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderDown,
  Home,
  Search,
  Library,
  Plus,
  Heart,
  ChevronLeft,
  ChevronRight,
  Music,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUIStore } from "@/store/uiStore";
import { DuoLogo } from "@/components/ui/DuoLogo";
import { Button } from "@/components/ui/Button";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useLikedSongs } from "@/hooks/useLikedSongs";
import { PlaylistModal } from "@/components/media/PlaylistModal";

// ─────────────────────────────────────────────
//  Nav item definition
// ─────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const mainNav: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
];

// ─────────────────────────────────────────────
//  Sidebar
// ─────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { playlists } = usePlaylists();
  const { count: likedCount } = useLikedSongs();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <>
      <aside
        className={cn(
          "hidden md:flex flex-col bg-bg-base flex-shrink-0 transition-all duration-base overflow-hidden",
          sidebarCollapsed ? "w-[72px]" : "w-[var(--sidebar-width)]",
        )}
        aria-label="Main navigation"
      >
        {/* ── Logo + collapse toggle ─────────────────── */}
        <div
          className={cn(
            "flex items-center h-16 px-4 flex-shrink-0",
            sidebarCollapsed ? "justify-center" : "justify-between",
          )}
        >
          <Link href="/" aria-label="Duo Player home">
            <DuoLogo collapsed={sidebarCollapsed} />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            className={cn("text-text-secondary", sidebarCollapsed && "hidden")}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </Button>
        </div>

        {/* ── Top nav panel ─────────────────────────── */}
        <nav className="flex flex-col gap-1 px-2 bg-bg-elevated rounded-md mx-2 py-2">
          {mainNav.map((item) => (
            <SidebarNavLink
              key={item.href}
              {...item}
              pathname={pathname}
              collapsed={sidebarCollapsed}
            />
          ))}
        </nav>

        {/* ── Library panel ─────────────────────────── */}
        <div className="flex flex-col flex-1 bg-bg-elevated rounded-md mx-2 mt-2 mb-2 overflow-hidden">
          {/* Library header */}
          <div
            className={cn(
              "flex items-center px-4 py-3 flex-shrink-0",
              sidebarCollapsed ? "justify-center" : "justify-between",
            )}
          >
            <Link
              href="/library"
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors duration-fast font-semibold text-sm"
              title="Your Library"
            >
              <Library size={20} />
              {!sidebarCollapsed && <span>Your Library</span>}
            </Link>

            {!sidebarCollapsed && (
              <div className="flex items-center gap-1">
                <Link href="/library/imports" title="Import playlists">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Import playlists"
                    className="h-8 w-8 hover:text-white"
                  >
                    <FolderDown size={16} />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCreateModalOpen(true)}
                  aria-label="Create playlist"
                  className="h-8 w-8 hover:text-white"
                >
                  <Plus size={16} />
                </Button>
              </div>
            )}
          </div>

          {/* Library Scrollable Items */}
          <div className="px-2 overflow-y-auto flex-1 space-y-1 pb-4">
            {/* Liked Songs pinned item */}
            <Link
              href="/liked"
              className={cn(
                "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-semibold transition-colors duration-fast",
                pathname === "/liked"
                  ? "bg-[var(--color-bg-hover)] text-white"
                  : "text-text-secondary hover:text-white hover:bg-[var(--color-bg-hover)]/50",
                sidebarCollapsed ? "justify-center" : "",
              )}
              title={sidebarCollapsed ? "Liked Songs" : undefined}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded bg-gradient-to-br from-[#450af5] to-[#c4efd9] text-white shrink-0">
                <Heart size={16} fill="white" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="truncate">Liked Songs</span>
                  <span className="text-xs text-[var(--color-text-muted)] font-normal">
                    Playlist • {likedCount}{" "}
                    {likedCount === 1 ? "song" : "songs"}
                  </span>
                </div>
              )}
            </Link>

            {/* Custom User Playlists */}
            {playlists.map((pl) => {
              const isPlActive = pathname === `/playlist/${pl.id}`;
              return (
                <Link
                  key={pl.id}
                  href={`/playlist/${pl.id}`}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors duration-fast",
                    isPlActive
                      ? "bg-[var(--color-bg-hover)] text-white font-semibold"
                      : "text-text-secondary hover:text-white hover:bg-[var(--color-bg-hover)]/50",
                    sidebarCollapsed ? "justify-center" : "",
                  )}
                  title={sidebarCollapsed ? pl.name : undefined}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] shrink-0 border border-[var(--color-bg-hover)]">
                    <Music size={16} />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-white font-medium">
                        {pl.name}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        Playlist • {pl.tracks.length}{" "}
                        {pl.tracks.length === 1 ? "song" : "songs"}
                      </span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Collapse toggle (bottom) ────────────────── */}
        {sidebarCollapsed && (
          <div className="px-2 pb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              className="w-full"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </aside>

      <PlaylistModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        mode="create"
      />
    </>
  );
}

// ─────────────────────────────────────────────
//  SidebarNavLink
// ─────────────────────────────────────────────

interface SidebarNavLinkProps extends NavItem {
  pathname: string;
  collapsed: boolean;
  iconClassName?: string;
}

function SidebarNavLink({
  href,
  label,
  icon: Icon,
  pathname,
  collapsed,
  iconClassName,
}: SidebarNavLinkProps) {
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-sm px-2 py-2 text-sm font-semibold transition-colors duration-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
        isActive
          ? "text-text-primary"
          : "text-text-secondary hover:text-text-primary",
        collapsed ? "justify-center" : "",
      )}
      title={collapsed ? label : undefined}
    >
      <Icon size={22} className={cn("flex-shrink-0", iconClassName)} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
