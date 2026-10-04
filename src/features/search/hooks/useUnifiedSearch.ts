import { useState, useEffect, useMemo, useCallback } from 'react';
import { normalizeArabicText, matchesArabicSearch } from '../../../shared/lib';
import {
  getRecentSearches,
  saveRecentSearchTerm,
  clearRecentSearchesList,
} from '../model/recentSearches';

export interface UseUnifiedSearchOptions<T = unknown> {
  initialQuery?: string;
  debounceMs?: number;
  items?: readonly T[];
  getItemSearchText?: (item: T) => string;
  onQueryChange?: (query: string) => void;
}

export function useUnifiedSearch<T = unknown>(options: UseUnifiedSearchOptions<T> = {}) {
  const {
    initialQuery = '',
    debounceMs = 200,
    items,
    getItemSearchText,
    onQueryChange,
  } = options;

  const [query, setQueryState] = useState<string>(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches());

  useEffect(() => {
    if (initialQuery !== undefined && initialQuery !== query) {
      setQueryState(initialQuery);
      setDebouncedQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery);
      onQueryChange?.(newQuery);
    },
    [onQueryChange]
  );

  const clearQuery = useCallback(() => {
    setQuery('');
  }, [setQuery]);

  const normalizedQuery = useMemo(() => normalizeArabicText(query), [query]);
  const normalizedDebouncedQuery = useMemo(() => normalizeArabicText(debouncedQuery), [debouncedQuery]);

  const saveRecent = useCallback(
    (term?: string) => {
      const textToSave = term !== undefined ? term : query;
      if (textToSave && textToSave.trim().length > 1) {
        const updated = saveRecentSearchTerm(textToSave, recentSearches);
        setRecentSearches(updated);
      }
    },
    [query, recentSearches]
  );

  const clearRecent = useCallback(() => {
    clearRecentSearchesList();
    setRecentSearches([]);
  }, []);

  const searchResults = useMemo(() => {
    if (!items || !items.length) return [];
    if (!normalizedDebouncedQuery) return items as T[];
    return items.filter((item) => {
      const text = getItemSearchText ? getItemSearchText(item) : String(item);
      return matchesArabicSearch(text, normalizedDebouncedQuery);
    });
  }, [items, normalizedDebouncedQuery, getItemSearchText]);

  const resultCount = useMemo(() => {
    if (items) return searchResults.length;
    return 0;
  }, [items, searchResults.length]);

  return {
    query,
    setQuery,
    debouncedQuery,
    normalizedQuery,
    normalizedDebouncedQuery,
    clearQuery,
    recentSearches,
    saveRecent,
    clearRecent,
    resultCount,
    searchResults,
  };
}
