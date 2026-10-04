import { useState, useEffect, useCallback } from 'react';
import { parseFavorites } from '../../../services/catalogState';

export const FAVORITES_STORAGE_KEY = 'dalelak_user_favorites';

/**
 * Unified favorites management hook.
 * Preserves the exact storage key and JSON array format from commit 716b654,
 * with Web Locks API concurrency protection, storage event cross-tab sync,
 * and optional toast notifications on toggle.
 */
export function useFavorites(showToast?: (msg: string) => void) {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return parseFavorites(
        typeof localStorage !== 'undefined' ? localStorage.getItem(FAVORITES_STORAGE_KEY) : null
      );
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = (event: StorageEvent) => {
      if (event.key === FAVORITES_STORAGE_KEY || event.key === null) {
        setFavorites(parseFavorites(event.newValue));
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const toggleFavorite = useCallback(
    async (bizId: string) => {
      const update = () => {
        let current = favorites;
        let persisted = true;
        try {
          current = parseFavorites(
            typeof localStorage !== 'undefined' ? localStorage.getItem(FAVORITES_STORAGE_KEY) : null
          );
        } catch {
          persisted = false;
        }
        const added = !current.includes(bizId);
        const next = added ? [...current, bizId] : current.filter((id) => id !== bizId);
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
          }
        } catch {
          persisted = false;
        }
        setFavorites(next);
        showToast?.(
          persisted
            ? added
              ? 'تمت الإضافة إلى المفضلة'
              : 'تمت الإزالة من المفضلة'
            : 'تم التغيير لهذه الجلسة؛ تعذر حفظ المفضلة على الجهاز'
        );
      };
      if (typeof navigator !== 'undefined' && navigator.locks) {
        await navigator.locks.request('dalelak-favorites', update);
      } else {
        update();
      }
    },
    [favorites, showToast]
  );

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
