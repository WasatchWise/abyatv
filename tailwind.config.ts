import type { Config } from 'tailwindcss';

// Case-file noir palette. Dark, cinematic, dossier-forward.
export default {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // The vault: near-black blues the interface sits on.
        ink: {
          DEFAULT: '#080b14',
          800: '#0c1120',
          700: '#111a30',
          600: '#182742',
          500: '#22354f',
        },
        // Clearance amber — stamps, seals, primary CTA.
        amber: {
          DEFAULT: '#f0a92b',
          bright: '#ffc857',
          dim: '#b47d1c',
        },
        // Signal cyan — the "vetted / safe" accent for the directory.
        signal: {
          DEFAULT: '#3fb6c9',
          bright: '#6fe3f2',
          dim: '#2a7f8c',
        },
        // Redaction / danger — used sparingly (THE BROKER, gated stamps).
        redact: '#c8493f',
        paper: '#e8e4d8',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
        sans: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      backgroundImage: {
        'vault-gradient': 'radial-gradient(120% 100% at 50% 0%, #182742 0%, #0c1120 45%, #080b14 100%)',
        'case-grain':
          'repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 3px)',
      },
      boxShadow: {
        dossier: '0 24px 60px -20px rgba(0,0,0,0.7)',
        stamp: '0 0 0 2px currentColor inset',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config;
