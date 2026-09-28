import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { PlayerBar } from '@/components/layout/PlayerBar';
import { MobileNav } from '@/components/layout/MobileNav';
import { AudioProvider } from '@/components/layout/AudioProvider';
import { ToastContainer } from '@/components/ui/Toast';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Duo Player', template: '%s | Duo Player' },
  description: 'Stream music, discover artists, build playlists.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Duo Player',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-bg-base text-text-primary font-sans antialiased">
        <Providers>
          {/* Headless audio engine — never unmounts */}
          <AudioProvider />

          {/* ── App shell ─────────────────────────────────────── */}
          <div
            className="flex h-screen overflow-hidden"
            style={{ paddingBottom: 'var(--player-height)' }}
          >
            {/* Left sidebar (desktop) */}
            <Sidebar />

            {/* Main content area */}
            <main
              id="main-content"
              className="flex-1 overflow-y-auto bg-bg-elevated rounded-md m-2 mb-0"
              tabIndex={-1}
            >
              {children}
            </main>
          </div>

          {/* Fixed bottom player bar */}
          <PlayerBar />

          {/* Toast notifications */}
          <ToastContainer />

          {/* Mobile bottom nav (hidden md+) */}
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
