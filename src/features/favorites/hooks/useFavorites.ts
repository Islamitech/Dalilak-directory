import { useState, useEffect, useCallback } from 'react';

const FAVORITES_STORAGE_KEY = 'dalelak_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.filter((id) => typeof id === 'string');
      }
    } catch {}
    return [];
  });

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
