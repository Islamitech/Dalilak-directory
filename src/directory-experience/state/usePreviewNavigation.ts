import { useEffect, useRef, useState } from 'react';

/** Read the current hash and normalise it to a page path. */
const readPath = () => {
  const path = window.location.hash.slice(1) || '/map';
  return path === '/' ? '/map' : path;
};

/**
 * Hash-based navigation confined to the preview entry point.
 *
 * Behavioural guarantees:
 *  - Opening #/place/<id> directly lands on the map page with the detail dialog open.
 *  - Closing the dialog goes back one step in browser history (if the user navigated
 *    to the detail) or stays on the current page otherwise.
 *  - Pressing the browser Back button from a detail returns to the map, not a blank state.
 *  - Page scroll positions are restored when switching between visited sections.
 */
export function usePreviewNavigation() {
  const [path, setPath] = useState(readPath);
  // The active "page" is always a section path, never a /place/ path
  const [page, setPage] = useState(() => {
    const p = readPath();
    return p.startsWith('/place/') ? '/map' : p;
  });
  // We keep a visited-sections list so React can mount each section once and hide/show
  const [visited, setVisited] = useState<string[]>(() => {
    const p = readPath();
    return [p.startsWith('/place/') ? '/map' : p];
  });

  const previousPage = useRef(page);
  const scrolls = useRef<Record<string, number>>({});
  const openedDetail = useRef(false);

  useEffect(() => {
    const handle = () => {
      const next = readPath();
      setPath(next);

      if (!next.startsWith('/place/')) {
        setPage(next);
        setVisited(items => items.includes(next) ? items : [...items, next]);
        requestAnimationFrame(() => {
          if (previousPage.current !== next) {
            document.getElementById('preview-main')?.focus({ preventScroll: true });
          }
          window.scrollTo(0, scrolls.current[next] ?? 0);
          previousPage.current = next;
        });
      }
    };

    window.addEventListener('hashchange', handle);
    return () => window.removeEventListener('hashchange', handle);
  }, []);

  const navigate = (next: string) => {
    scrolls.current[page] = window.scrollY;
    if (next.startsWith('/place/')) {
      openedDetail.current = true;
      // Ensure the map page is in the visited list so the detail can close back onto it
      setVisited(items => items.includes('/map') ? items : [...items, '/map']);
    }
    window.location.hash = next;
  };

  /**
   * Close the currently open detail dialog.
   * - If the user navigated to the detail (openedDetail flag is true) → go back in history.
   * - If the page was loaded with a detail hash directly → replace the hash with the map page.
   */
  const closeDetail = () => {
    if (openedDetail.current) {
      openedDetail.current = false;
      window.history.back();
    } else {
      // User arrived directly at a #/place/… URL; go to the map page cleanly
      window.location.replace(
        `${window.location.pathname}${window.location.search}#/map`
      );
    }
  };

  return { path, page, visited, navigate, closeDetail };
}
