import { TopBar } from '@/components/layout/TopBar';
import { Heart } from 'lucide-react';

export default function LikedSongsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar accentColor="#5038a0" />
      <div
        className="px-6 py-6 -mt-16 pt-20"
        style={{
          background: 'linear-gradient(to bottom, #5038a080 0%, transparent 300px)',
        }}
      >
        <div className="flex items-end gap-6 mb-8">
          <div className="h-48 w-48 bg-gradient-to-br from-[#450af5] to-[#c4efd9] rounded-sm flex items-center justify-center flex-shrink-0">
            <Heart size={64} className="text-white" fill="white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-text-secondary tracking-widest mb-2">
              Playlist
            </p>
            <h1 className="text-4xl font-black text-text-primary mb-4">Liked Songs</h1>
            <p className="text-text-secondary text-sm">
              Sign in to see your liked songs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
