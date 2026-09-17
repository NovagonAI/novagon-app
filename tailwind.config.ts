import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F5F9FD',
        card: '#FFFFFF',
        ink: '#12263D',
        ocean: {
          50: '#EAF3FB',
          100: '#D2E7F7',
          200: '#A6CEEF',
          300: '#78B3E3',
          400: '#4A93D1',
          500: '#1F6BB0',
          600: '#155691',
          700: '#114674',
          800: '#0D3760',
        },
        slate: '#DCE6F0',
        slate2: '#EEF4FA',
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
