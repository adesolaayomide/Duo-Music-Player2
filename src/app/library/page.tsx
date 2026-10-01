import { TopBar } from "@/components/layout/TopBar";

export default function LibraryPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar />
      <div className="px-6 py-6 -mt-16 pt-20">
        <h1 className="text-2xl font-black text-text-primary mb-6">
          Your Library
        </h1>
        <p className="text-text-secondary">
          Your playlists and liked songs will appear here. Sign in to get
          started.
        </p>
      </div>
    </div>
  );
}
