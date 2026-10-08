const STORAGE_KEY = 'dalelak_recent_searches';

export function getRecentSearches(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === 'string').slice(0, 5);
      }
    }
  } catch {}
  return [];
}

export function saveRecentSearchTerm(term: string, current: string[]): string[] {
  if (!term || !term.trim()) return current;
  const clean = term.trim();
  const updated = [clean, ...current.filter((t) => t !== clean)].slice(0, 5);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function clearRecentSearchesList(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
