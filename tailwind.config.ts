import type { Config } from 'tailwindcss';

// Case-file noir — palette locked to the Agent FERPA Visual Bible
// (wiki/abya/agent-ferpa-visual-bible.md, canonical 2026-06-30):
//   navy base #003D6B · mid blue #005696 · cyan hero-light #9CEAFF ·
//   amber resolution #FFB347–#E8A33D · BreachCorp acid green #7CFC4D · black redaction.
// Rule: the world lives on the navy-to-cyan base; the hero side warms to amber;
// the villain side corrupts toward acid green and black redaction bars.
export default {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // The vault: a dark navy ramp anchored to the #003D6B base.
        ink: {
          DEFAULT: '#04101c', // page — near-black navy
          800: '#06192b', // raised surface (dossier)
          700: '#0a2440',
          600: '#0f3253',
          500: '#17466b', // borders — reads as the #003D6B navy edge
        },
        // Navy anchors, straight from the bible.
        navy: {
          DEFAULT: '#003D6B',
          mid: '#005696',
        },
        // Amber — resolution, golden hour, the hero's warmth. Primary CTA + stamps.
        amber: {
          DEFAULT: '#FFB347',
          bright: '#FFC875',
          dim: '#E8A33D',
        },
        // Cyan hero-light — the truth signal. The directory's "vetted" accent.
        signal: {
          DEFAULT: '#9CEAFF',
          bright: '#C8F4FF',
          dim: '#4FA9CE',
        },
        // BreachCorp corruption — villain/gated accent. Pairs with black redaction.
        acid: '#7CFC4D',
        // Pure black redaction bars.
        redact: '#000000',
        // Cool near-white for body copy on the navy base.
        paper: '#e6f3fb',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
        sans: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      backgroundImage: {
        'vault-gradient': 'radial-gradient(120% 100% at 50% 0%, #003D6B 0%, #06192b 45%, #04101c 100%)',
        'case-grain':
          'repeating-linear-gradient(0deg, rgba(156,234,255,0.02) 0px, rgba(156,234,255,0.02) 1px, transparent 1px, transparent 3px)',
      },
      boxShadow: {
        dossier: '0 24px 60px -20px rgba(0,0,0,0.75)',
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
