import type { Config } from 'tailwindcss';

/**
 * ElixiHire design tokens.
 *
 * Every colour is a CSS custom property holding an "R G B" triplet, so Tailwind's
 * opacity modifiers (`bg-jade/10`) still work and a single `data-theme` swap on the
 * root element repaints the whole app. Light values and their dark counterparts both
 * live in `app/globals.css`.
 */
const token = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        jade: {
          DEFAULT: token('--jade'),
          dark: token('--jade-dark'),
          tint: token('--jade-tint'),
        },
        // Surfaces & text
        surface: {
          DEFAULT: token('--surface'),
          raised: token('--surface-raised'),
        },
        slate: { ink: token('--ink') },
        body: token('--body'),
        muted: token('--muted'),
        hairline: token('--hairline'),
        // The demo ribbon, which inverts against the page in both themes
        banner: {
          DEFAULT: token('--banner-bg'),
          fg: token('--banner-fg'),
        },
        // Status — reserved for state, never reused as a series colour
        warn: {
          bg: token('--warn-bg'),
          border: token('--warn-border'),
          fg: token('--warn-fg'),
        },
        danger: {
          bg: token('--danger-bg'),
          border: token('--danger-border'),
          fg: token('--danger-fg'),
        },
        info: {
          bg: token('--info-bg'),
          border: token('--info-border'),
          fg: token('--info-fg'),
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: [
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgb(var(--shadow) / 0.05), 0 4px 16px rgb(var(--shadow) / 0.07)',
        pop: '0 8px 30px rgb(var(--shadow) / 0.16)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
};

export default config;
