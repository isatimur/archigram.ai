import type { DiagramTheme } from '@/types';

/** Hex background for default (dark) theme; use in API routes / email HTML where CSS vars are not available. */
export const THEME_DARK_BG_HEX = '#0d0d0f';

/** CSS custom property values (RGB tuples) applied to root for theming. */
export type ThemeVars = Record<`--${string}`, string>;

/** Single source of truth for app theme CSS variables. Matches :root in app/globals.css. */
export const THEMES: Record<DiagramTheme, ThemeVars> = {
  // Obsidian — void black with electric indigo
  dark: {
    '--bg': '9 9 11',
    '--surface': '17 17 20',
    '--surface-hover': '26 26 30',
    '--surface-elevated': '35 35 42',
    '--border': '44 44 52',
    '--text': '230 230 235',
    '--text-muted': '110 110 122',
    '--text-dim': '58 58 68',
    '--primary': '129 140 248',
    '--primary-hover': '99 102 241',
    '--primary-bg': '28 28 62',
    '--accent': '196 130 249',
  },
  // Abyss — deep ocean with electric cyan
  midnight: {
    '--bg': '3 7 18',
    '--surface': '8 16 36',
    '--surface-hover': '14 28 55',
    '--surface-elevated': '20 38 70',
    '--border': '28 52 90',
    '--text': '240 248 255',
    '--text-muted': '138 158 180',
    '--text-dim': '55 75 105',
    '--primary': '34 211 238',
    '--primary-hover': '6 182 212',
    '--primary-bg': '8 28 58',
    '--accent': '244 114 182',
  },
  // Phosphor — terminal green on near-void
  forest: {
    '--bg': '4 10 4',
    '--surface': '7 20 8',
    '--surface-hover': '10 33 12',
    '--surface-elevated': '14 45 16',
    '--border': '18 58 22',
    '--text': '220 252 231',
    '--text-muted': '74 222 128',
    '--text-dim': '20 64 24',
    '--primary': '74 222 128',
    '--primary-hover': '34 197 94',
    '--primary-bg': '4 40 12',
    '--accent': '253 224 71',
  },
  // Arctic — crisp white with cobalt precision
  neutral: {
    '--bg': '255 255 255',
    '--surface': '245 247 250',
    '--surface-hover': '233 237 244',
    '--surface-elevated': '220 228 240',
    '--border': '204 214 228',
    '--text': '10 15 30',
    '--text-muted': '88 108 136',
    '--text-dim': '150 170 195',
    '--primary': '37 99 235',
    '--primary-hover': '29 78 216',
    '--primary-bg': '214 232 255',
    '--accent': '248 113 113',
  },
  // Ember — warm charcoal with amber fire
  ember: {
    '--bg': '12 8 6',
    '--surface': '22 15 10',
    '--surface-hover': '34 22 14',
    '--surface-elevated': '46 30 18',
    '--border': '60 38 22',
    '--text': '255 237 213',
    '--text-muted': '180 128 80',
    '--text-dim': '80 50 28',
    '--primary': '251 146 60',
    '--primary-hover': '234 88 12',
    '--primary-bg': '48 24 8',
    '--accent': '252 211 77',
  },
  // Dusk — twilight indigo with rose gold
  dusk: {
    '--bg': '8 6 20',
    '--surface': '16 12 38',
    '--surface-hover': '26 20 58',
    '--surface-elevated': '36 28 78',
    '--border': '50 38 100',
    '--text': '240 234 255',
    '--text-muted': '160 140 210',
    '--text-dim': '72 58 110',
    '--primary': '192 132 252',
    '--primary-hover': '168 85 247',
    '--primary-bg': '30 20 65',
    '--accent': '251 113 133',
  },
};
