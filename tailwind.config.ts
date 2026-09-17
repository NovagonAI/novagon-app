import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        // New palette
        paper: '#E8F2FF',
        card: '#FFFFFF',
        ink: '#003369',
        primary: {
          DEFAULT: '#1A5BA1',
          light: '#AAD3FF',
          medium: '#84A0E4',
          dark: '#003369',
        },
        ocean: {
          50: '#EBF4FF',
          100: '#AAD3FF',
          200: '#84A0E4',
          300: '#6B8FD4',
          400: '#4A7BC4',
          500: '#1A5BA1',
          600: '#1A5BA1',
          700: '#003369',
          800: '#002755',
        },
        slate: '#D0DCF0',
        slate2: '#EBF4FF',
        success: {
          100: '#DEEFE2',
          500: '#2F7D52',
          600: '#25623F',
          700: '#1E4F33',
        },
        danger: {
          100: '#F6DEDA',
          500: '#B14432',
          600: '#8F362A',
        },
        amber: {
          100: '#F7ECD6',
          500: '#B4863C',
          600: '#8F6A2E',
        },
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'ui-serif', 'serif'],
        sans: ['var(--font-ibm-plex-sans)', 'ui-sans-serif', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
