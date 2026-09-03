/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        paper: '#F6F0E4',
        ink: '#1C1917',
        muted: '#57534E',
        card: '#FFFCF6',
        emerald: {
          DEFAULT: '#0F766E',
          dark: '#115E59',
          light: '#CCFBF1',
        },
        gold: {
          DEFAULT: '#B45309',
          soft: '#FDE68A',
        },
        kids: {
          cream: '#FFF7ED',
          sunset: '#F97316',
          coral: '#FB7185',
          teal: '#0D9488',
          sky: '#38BDF8',
          butter: '#FDE68A',
          ink: '#431407',
        },
      },
    },
  },
  plugins: [],
};
