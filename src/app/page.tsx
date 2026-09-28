import { TopBar } from '@/components/layout/TopBar';
import { SkeletonShelf } from '@/components/ui/Skeleton';
import { DevPlayButton } from '@/lib/dev/DevPlayButton';

export default function HomePage() {
  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex flex-col min-h-full">
      <TopBar />

      <div className="px-6 pb-24 flex flex-col gap-8 -mt-16 pt-20">
        {/* ── Greeting ───────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-black text-text-primary">{greeting}</h1>
          {/* Temporary dev player fixture */}
          <DevPlayButton />
        </div>

        {/* ── Quick access 2×4 grid (placeholder) ──── */}
        <section aria-label="Quick access" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-bg-hover rounded-sm overflow-hidden hover:bg-[#333] transition-colors duration-fast cursor-pointer group"
            >
              <div className="h-12 w-12 bg-bg-surface flex-shrink-0" />
              <span className="text-sm font-semibold text-text-primary truncate pr-2">
                Liked Songs
              </span>
            </div>
          ))}
        </section>

        {/* ── Shelves (skeleton during load) ─────────── */}
        <SkeletonShelf cardCount={6} />
        <SkeletonShelf cardCount={6} />
        <SkeletonShelf cardCount={6} />
      </div>
    </div>
  );
}
