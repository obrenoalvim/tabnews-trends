import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#08111d',
        'ink-raised': '#0e1c2e',
        paper: '#dbe9f5',
        'paper-dim': '#5c7891',
        accent: '#5ad1ff',
        'accent-dim': '#1c3f57',
        alarm: '#ff6b6b',
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
