import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b0c0a',
        'ink-raised': '#15160f',
        paper: '#ece7d6',
        'paper-dim': '#8d8a77',
        amber: '#ffb300',
        'amber-dim': '#7a5a00',
        alarm: '#ff5f56',
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
