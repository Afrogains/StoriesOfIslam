export const palette = {
  standard: {
    paper: '#F6F0E4',
    ink: '#1C1917',
    muted: '#57534E',
    emerald: '#0F766E',
    emeraldDark: '#115E59',
    emeraldLight: '#CCFBF1',
    gold: '#B45309',
    goldSoft: '#FDE68A',
    card: '#FFFCF6',
  },
  kids: {
    cream: '#FFF7ED',
    sunset: '#F97316',
    coral: '#FB7185',
    teal: '#0D9488',
    sky: '#38BDF8',
    butter: '#FDE68A',
    ink: '#431407',
    card: '#FFFFFF',
  },
} as const;

export type AppMode = 'standard' | 'kids';
