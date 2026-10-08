import { useCallback, useEffect, useState } from 'react';
import { extractBusinessIdFromSlug } from '../utils/directoryUrl';

function readLocation() {
  if (typeof window === 'undefined') {
    return { token: '', path: '/search', search: '', revision: 0 };
  }
  const params = new URLSearchParams(window.location.search);
  const raw =
    window.location.pathname.match(/^\/biz\/([^/]+)/)?.[1] ||
    params.get('biz') ||
    params.get('place') ||
    params.get('b') ||
    params.get('id') ||
    params.get('preview') ||
    '';
  const token = extractBusinessIdFromSlug(raw);
  const currentPath = window.location.pathname;
  const background = token
    ? window.history.state?.directoryBackground || (currentPath.startsWith('/biz') ? '/search' : currentPath)
    : currentPath;
  return {
    token,
    path: background.split('?')[0] || '/search',
    search: window.location.search,
    revision: Date.now() + Math.random(),
  };
}

export function useDirectoryNavigation() {
  const [route, setRoute] = useState(readLocation);
  const sync = useCallback(() => setRoute(readLocation()), []);

  useEffect(() => {
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [sync]);

  const navigate = useCallback(
    (url: string, replace = false) => {
      window.history[replace ? 'replaceState' : 'pushState'](null, '', url);
      sync();
    },
    [sync]
  );

  const open = useCallback(
    (path: string) => {
      const state = window.history.state;
      const already = Boolean(readLocation().token);
      const currentFull = window.location.pathname + window.location.search;
      const background = already
        ? state?.directoryBackground || '/search'
        : currentFull.startsWith('/biz')
        ? '/search'
        : currentFull;
      const owned = already ? Boolean(state?.directoryModal) : true;
      window.history[already ? 'replaceState' : 'pushState'](
        { directoryModal: owned, directoryBackground: background },
        '',
        path
      );
      sync();
    },
    [sync]
  );

  const close = useCallback(() => {
    if (window.history.state?.directoryModal) {
      window.history.back();
    } else {
      const fallback = window.history.state?.directoryBackground || '/search';
      navigate(fallback, true);
    }
  }, [navigate]);

  return { ...route, navigate, open, close };
}
