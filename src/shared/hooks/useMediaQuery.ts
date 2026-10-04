import { useSyncExternalStore } from 'react';

/**
 * 📱 Hook to listen to CSS media queries with hydration safety
 */
export function useMediaQuery(query: string, defaultValue = false): boolean {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === 'undefined' || !window.matchMedia) {
        return () => {};
      }
      const media = window.matchMedia(query);
      media.addEventListener('change', callback);
      return () => media.removeEventListener('change', callback);
    },
    () => {
      if (typeof window === 'undefined' || !window.matchMedia) {
        return defaultValue;
      }
      return window.matchMedia(query).matches;
    },
    () => defaultValue
  );
}

/**
 * 🖥️ True when viewport is >= 1024px (Tailwind lg breakpoint / Owner Decision D4)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)', false);
}
