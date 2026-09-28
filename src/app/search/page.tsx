import { TopBar } from '@/components/layout/TopBar';

export default function SearchPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar />
      <div className="px-6 py-6 -mt-16 pt-20">
        <h1 className="text-2xl font-black text-text-primary mb-6">Search</h1>
        <p className="text-text-secondary">Search will be wired to Jamendo in Phase 3.</p>
      </div>
    </div>
  );
}
