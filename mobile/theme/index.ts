/**
 * BookCars mobile design tokens.
 * Shared with the web/admin palette so every surface reads as one brand.
 */
export const colors = {
  brand: '#214c3c',
  brandDark: '#173d30',
  brandLight: '#eaf3e7',
  brandTint: '#f2f7ef',
  ink: '#193329',
  inkSoft: '#4d6057',
  inkMuted: '#7b8d84',
  surface: '#ffffff',
  canvas: '#f6f8f4',
  line: '#e2e9df',
  lineSoft: '#eef2ec',
  accent: '#2f6b4f',
  accentSoft: '#f1f5ee',
  danger: '#c0392b',
  warning: '#b4761c',
  success: '#1f9201',
} as const

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
} as const

export const shadow = {
  card: {
    shadowColor: '#1a3627',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  soft: {
    shadowColor: '#1a3627',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 1,
  },
} as const

export default { colors, radii, spacing, shadow }
