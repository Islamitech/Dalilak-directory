import { useMemo, useCallback } from 'react';
import { Business } from '../../../types';
import { HADAYEK_OFFICIAL_DISTRICTS } from '../../../shared/data/hadayek/hadayekDistrictsGeoData';
import { classifyBusinessCategory } from '../../../utils/categoryMatcher';
import { getBusinessHadayekZoneLetter } from '../../../utils/hadayekZoneHelper';
import { INTEGRATED_FILTER_CATEGORIES } from '../model/filterModel';

const knownCategoryIds = new Set(INTEGRATED_FILTER_CATEGORIES.map((c) => c.id));

export interface UseIntegratedFiltersParams {
  businesses: Business[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedZone: string;
  onZoneChange: (zone: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onResetAll?: () => void;
}

export function useIntegratedFilters({
  businesses,
  searchQuery = '',
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedZone,
  onZoneChange,
  onResetAll,
}: UseIntegratedFiltersParams) {
  const activeCategory = selectedCategory || 'all';
  const activeZone = selectedZone || 'all';

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const biz of businesses) {
      if (activeZone !== 'all') {
        const bizZone = getBusinessHadayekZoneLetter(biz);
        if (bizZone !== activeZone) continue;
      }
      // Classify each business once (not once per category) and count by its main category.
      const mainCategoryId = classifyBusinessCategory(biz).mainCategoryId;
      if (knownCategoryIds.has(mainCategoryId)) {
        counts.set(mainCategoryId, (counts.get(mainCategoryId) || 0) + 1);
      }
    }
    return counts;
  }, [businesses, activeZone]);

  const activeCategoryName = useMemo(() => {
    if (activeCategory === 'all') return '';
    const found = INTEGRATED_FILTER_CATEGORIES.find((c) => c.id === activeCategory);
    return found ? found.name : activeCategory;
  }, [activeCategory]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() || activeCategory !== 'all' || activeZone !== 'all'
  );

  const clearCategory = useCallback(() => onCategoryChange('all'), [onCategoryChange]);
  const clearZone = useCallback(() => onZoneChange('all'), [onZoneChange]);
  const clearQuery = useCallback(() => onSearchChange?.(''), [onSearchChange]);

  const resetAll = useCallback(() => {
    onSearchChange?.('');
    onCategoryChange('all');
    onZoneChange('all');
    onResetAll?.();
  }, [onSearchChange, onCategoryChange, onZoneChange, onResetAll]);

  const zones = useMemo(() => HADAYEK_OFFICIAL_DISTRICTS.map((d) => d.letterAr), []);

  return {
    categories: INTEGRATED_FILTER_CATEGORIES,
    categoryCounts,
    zones,
    activeCategory,
    activeZone,
    activeCategoryName,
    hasActiveFilters,
    clearCategory,
    clearZone,
    clearQuery,
    resetAll,
  };
}
