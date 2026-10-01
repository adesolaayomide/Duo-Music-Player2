import * as React from "react";
import { cn } from "@/lib/utils/cn";

// ─────────────────────────────────────────────
//  Skeleton — single animated shimmer block
// ─────────────────────────────────────────────

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Explicit width, e.g. "120px" or "w-32" via className */
  width?: string | number;
  /** Explicit height, e.g. "16px" or "h-4" via className */
  height?: string | number;
  /** Round the skeleton into a circle */
  circle?: boolean;
}

export function Skeleton({
  width,
  height,
  circle,
  className,
  style,
  ...rest
}: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading…"
      className={cn(
        "animate-pulse bg-bg-hover",
        circle ? "rounded-full" : "rounded-sm",
        className,
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      {...rest}
    />
  );
}

// ─────────────────────────────────────────────
//  SkeletonTrackRow — placeholder for a track list item
// ─────────────────────────────────────────────

export function SkeletonTrackRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-2">
      {/* Index */}
      <Skeleton width={16} height={16} />
      {/* Cover */}
      <Skeleton width={40} height={40} className="rounded-sm flex-shrink-0" />
      {/* Title + artist */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <Skeleton height={14} className="w-2/3" />
        <Skeleton height={12} className="w-1/3" />
      </div>
      {/* Album */}
      <Skeleton height={12} className="w-32 hidden md:block" />
      {/* Duration */}
      <Skeleton width={36} height={12} />
    </div>
  );
}

// ─────────────────────────────────────────────
//  SkeletonCard — placeholder for a media card
// ─────────────────────────────────────────────

export function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 p-4 bg-bg-surface rounded-md">
      <Skeleton className="w-full aspect-square rounded-md" />
      <Skeleton height={14} className="w-3/4" />
      <Skeleton height={12} className="w-1/2" />
    </div>
  );
}

// ─────────────────────────────────────────────
//  SkeletonShelf — placeholder for a horizontal shelf
// ─────────────────────────────────────────────

export function SkeletonShelf({ cardCount = 6 }: { cardCount?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Shelf heading */}
      <Skeleton height={24} className="w-48" />
      {/* Cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: cardCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
