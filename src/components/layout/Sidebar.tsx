"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Library,
  Plus,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUIStore } from "@/store/uiStore";
import { DuoLogo } from "@/components/ui/DuoLogo";
import { Button } from "@/components/ui/Button";

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

  return (
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
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
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
          {!sidebarCollapsed && (
            <button className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors duration-fast font-semibold text-sm">
              <Library size={20} />
              Your Library
            </button>
          )}
          {sidebarCollapsed && (
            <button
              className="text-text-secondary hover:text-text-primary transition-colors duration-fast"
              aria-label="Your Library"
            >
              <Library size={20} />
            </button>
          )}
          {!sidebarCollapsed && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Create playlist"
                className="h-8 w-8"
              >
                <Plus size={16} />
              </Button>
            </div>
          )}
        </div>

        {/* Liked Songs pinned item */}
        <div className="px-2 overflow-y-auto flex-1">
          <SidebarNavLink
            href="/liked"
            label="Liked Songs"
            icon={Heart}
            pathname={pathname}
            collapsed={sidebarCollapsed}
            iconClassName="text-accent"
          />
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
