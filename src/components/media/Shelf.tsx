"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ShelfProps {
  title: string;
  subtitle?: string;
  showAllHref?: string;
  children: React.ReactNode;
}

export function Shelf({ title, subtitle, showAllHref, children }: ShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [children]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    const scrollAmount =
      direction === "left" ? -clientWidth * 0.75 : clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    setTimeout(checkScroll, 350);
  };

  return (
    <section className="group/shelf relative my-6">
      {/* Header */}
      <div className="mb-4 flex items-end justify-between px-1">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] hover:underline">
            {showAllHref ? <Link href={showAllHref}>{title}</Link> : title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs md:text-sm text-[var(--color-text-secondary)]">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showAllHref && (
            <Link
              href={showAllHref}
              className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-white hover:underline mr-2"
            >
              Show all
            </Link>
          )}

          {/* Navigation Arrows */}
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-bg-hover)] text-white shadow transition hover:scale-105 disabled:opacity-0 disabled:pointer-events-none`}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-bg-hover)] text-white shadow transition hover:scale-105 disabled:opacity-0 disabled:pointer-events-none`}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </section>
  );
}
