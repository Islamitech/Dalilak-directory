/**
 * 🎨 Dalilak Prototype Experience Design Tokens
 * 
 * Centralized theme constants aligned with Tailwind CSS v4 and docs/design/00-prototype-spec.md
 * Pure constants: Zero UI/React dependencies.
 */

export const THEME_COLORS = {
  light: {
    bg: '#f8fafc',
    bgSecondary: '#f1f5f9',
    surface: '#ffffff',
    surfaceHover: '#f8fafc',
    border: '#e2e8f0',
    borderSecondary: '#cbd5e1',
    text: '#0f172a',
    textSecondary: '#334155',
    textMuted: '#64748b',
    primary: '#d97706',
    primaryDark: '#b45309',
    primarySoft: '#fef3c7',
    accent: '#059669',
    accentSoft: '#d1fae5',
    danger: '#dc2626',
    dangerSoft: '#fee2e2',
    info: '#2563eb',
    infoSoft: '#eff6ff',
  },
} as const;

export const BREAKPOINTS = {
  mobileMax: 767,
  tabletMin: 768,
  tabletMax: 1023,
  desktopMin: 1024,
  compactMobileMax: 399,
} as const;

export const MOTION = {
  fast: '180ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '280ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '380ms cubic-bezier(0.34, 1.4, 0.64, 1)',
} as const;
