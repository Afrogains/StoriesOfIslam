/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        arabic: [
          'KFGQPC_uthmanic_script_hafs_r_regular',
          'Noto Naskh Arabic',
          'Amiri',
          'serif',
        ],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper: {
          DEFAULT: '#F8F5EC',
          dark: '#090F0D',
        },
        ink: {
          DEFAULT: '#0F172A',
          light: '#F8FAFC',
        },
        muted: {
          DEFAULT: '#475569',
          light: '#CBD5E1',
        },
        card: {
          DEFAULT: '#FFFFFF',
          dark: '#121C19',
        },
        emerald: {
          DEFAULT: '#0F766E',
          dark: '#115E59',
          light: '#CCFBF1',
          bg: '#E6F4F1',
        },
        gold: {
          DEFAULT: '#B45309',
          warm: '#D97706',
          soft: '#FEF3C7',
          bg: '#FEF8E8',
        },
        azure: {
          DEFAULT: '#0284C7',
          dark: '#0369A1',
          light: '#E0F2FE',
          bg: '#F0F9FF',
        },
        terracotta: {
          DEFAULT: '#C2410C',
          dark: '#9A3412',
          light: '#FFEDD5',
          bg: '#FFF7ED',
        },
        kids: {
          cream: '#FFF8F0',
          ink: '#3B1808',
          sunset: '#EA580C',
          coral: '#E11D48',
          teal: '#0D9488',
          sky: '#0284C7',
          yellow: '#D97706',
          purple: '#9333EA',
          mint: '#059669',
        },
      },
    },
  },
  plugins: [],
};
