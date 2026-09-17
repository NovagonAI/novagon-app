import type { Config } from 'tailwindcss'

// Tokens lifted from the Figma file "Bridge" (section "fix"). Names describe
// the role, values are the exact hex used in the design.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#003369',
        blue: '#1a5ba1',
        sky: '#78b9ff',
        mist: '#e2f0ff',
        pale: '#f2f8ff',
        line: '#aad3ff',
        ink: '#000000',
        grey: {
          text: '#606060',
          bar: '#a1a1a1',
          nav: '#a8a8a8',
          track: '#d9d9d9',
          chip: '#f3f3f3',
          fade: '#dfdfdf',
        },
        ok: { DEFAULT: '#00a120', dark: '#007417', bg: '#eefff2', border: '#009d1f', bar: '#54d16d' },
        warn: { DEFAULT: '#f68300', dark: '#a05500', deep: '#9c5300', bg: '#fffeee' },
        bad: { DEFAULT: '#ba0000', dark: '#7e0000', bg: '#ffeeee' },
      },
      fontFamily: {
        serif: ['var(--font-libre)', 'Georgia', 'serif'],
        sans: ['var(--font-montserrat)', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: {
        card: '0px 5px 19.4px 0px rgba(0,0,0,0.25)',
        tile: '0px 4px 4px 0px rgba(0,0,0,0.25)',
        nav: '0px 3px 31.1px 0px rgba(0,0,0,0.14)',
        hero: '0px 4px 25.6px 0px rgba(0,0,0,0.25)',
      },
      backgroundImage: {
        'btn-gradient': 'linear-gradient(to bottom, #78b9ff, #1a5ba1)',
        'sidebar-gradient': 'linear-gradient(to bottom, #003369 0%, #1a5ba1 50%, #78b9ff 100%)',
        'header-fade': 'linear-gradient(to right, #ffffff, #dfdfdf)',
      },
    },
  },
  plugins: [],
}
export default config
