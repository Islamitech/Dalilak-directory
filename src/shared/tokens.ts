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
  dark: {
    bg: '#0b0f19',
    bgSecondary: '#111827',
    surface: '#1f2937',
    surfaceHover: '#283548',
    border: '#374151',
    borderSecondary: '#4b5563',
    text: '#f9fafb',
    textSecondary: '#e5e7eb',
    textMuted: '#9ca3af',
    primary: '#f59e0b',
    primaryDark: '#d97706',
    primarySoft: 'rgba(245, 158, 11, 0.15)',
    accent: '#10b981',
    accentSoft: 'rgba(16, 185, 129, 0.15)',
    danger: '#ef4444',
    dangerSoft: 'rgba(239, 68, 68, 0.15)',
    info: '#3b82f6',
    infoSoft: 'rgba(59, 130, 246, 0.15)',
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
