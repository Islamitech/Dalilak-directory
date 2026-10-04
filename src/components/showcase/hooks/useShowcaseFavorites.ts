import { useState, useEffect, useCallback } from 'react';
import { parseFavorites } from '../../../services/catalogState';

export function useShowcaseFavorites(showToast: (msg: string) => void) {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return parseFavorites(localStorage.getItem('dalelak_user_favorites'));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === 'dalelak_user_favorites' || event.key === null) {
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
          current = parseFavorites(localStorage.getItem('dalelak_user_favorites'));
        } catch {
          persisted = false;
        }
        const added = !current.includes(bizId);
        const next = added ? [...current, bizId] : current.filter((id) => id !== bizId);
        try {
          localStorage.setItem('dalelak_user_favorites', JSON.stringify(next));
        } catch {
          persisted = false;
        }
        setFavorites(next);
        showToast(
          persisted
            ? added
              ? 'تمت الإضافة إلى المفضلة'
              : 'تمت الإزالة من المفضلة'
            : 'تم التغيير لهذه الجلسة؛ تعذر حفظ المفضلة على الجهاز'
        );
      };
      if (navigator.locks) await navigator.locks.request('dalelak-favorites', update);
      else update();
    },
    [favorites, showToast]
  );

  return { favorites, toggleFavorite };
}
