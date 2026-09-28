import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': '#000000',
        'bg-elevated': '#121212',
        'bg-surface': '#181818',
        'bg-hover': '#282828',
        'text-primary': '#FFFFFF',
        'text-secondary': '#B3B3B3',
        'text-muted': '#6A6A6A',
        accent: '#1ED760',
        danger: '#E22134',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.4' }],
        sm: ['14px', { lineHeight: '1.4' }],
        base: ['16px', { lineHeight: '1.5' }],
        xl: ['24px', { lineHeight: '1.3' }],
        '2xl': ['32px', { lineHeight: '1.2' }],
        '4xl': ['48px', { lineHeight: '1.1' }],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        full: '9999px',
      },
      spacing: {
        'player-h': 'var(--player-height)',
        'sidebar-w': 'var(--sidebar-width)',
      },
      transitionTimingFunction: {
        duo: 'cubic-bezier(0.25, 0, 0, 1)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '250ms',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'slide-up': 'slide-up 200ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
