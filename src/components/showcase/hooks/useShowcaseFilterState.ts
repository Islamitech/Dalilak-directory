import { useState, useEffect, useCallback, useDeferredValue } from 'react';
import { resolveCategorySelection } from '../../../utils/categoryMatcher';

export function useShowcaseFilterState() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [govFilter, setGovFilter] = useState<string>('الجيزة');
  const [cityFilter, setCityFilter] = useState<string>('حدائق الأهرام');
  const [hadayekZoneFilter, setHadayekZoneFilter] = useState<string>(() => {
    if (typeof window === 'undefined') return 'all';
    return new URLSearchParams(window.location.search).get('zone') || 'all';
  });
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const [openNowOnly, setOpenNowOnly] = useState<boolean>(false);
  const [hasRatingOnly, setHasRatingOnly] = useState<boolean>(false);
  const [hasVideoOnly, setHasVideoOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'default' | 'nearest' | 'newest' | 'has_video' | 'open_now' | 'alpha'>('default');
  const [shuffleSeed, setShuffleSeed] = useState<number>(() => Math.floor(Math.random() * 1000000) + 1);

  const handleCategoryChange = useCallback((nextCategory: string) => {
    const selection = resolveCategorySelection(nextCategory);
    setCategoryFilter(selection.mainCategoryId);
    setSubcategoryFilter(selection.subcategoryId);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get('cat');
    const subcategoryParam = params.get('subcat');
    if (categoryParam) {
      const selection = resolveCategorySelection(categoryParam);
      setCategoryFilter(selection.mainCategoryId);
      if (subcategoryParam) {
        const subSelection = resolveCategorySelection(subcategoryParam);
        setSubcategoryFilter(
          subSelection.mainCategoryId === selection.mainCategoryId ? subSelection.subcategoryId : selection.subcategoryId
        );
      } else {
        setSubcategoryFilter(selection.subcategoryId);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.pathname.startsWith('/search')) return;
    const url = new URL(window.location.href);
    if (categoryFilter === 'all') url.searchParams.delete('cat');
    else url.searchParams.set('cat', categoryFilter);
    if (subcategoryFilter === 'all') url.searchParams.delete('subcat');
    else url.searchParams.set('subcat', subcategoryFilter);
    window.history.replaceState(window.history.state, '', url.toString());
  }, [categoryFilter, subcategoryFilter]);

  const resetAllFilters = useCallback(() => {
    setSearchQuery('');
    setGovFilter('الجيزة');
    setCityFilter('حدائق الأهرام');
    setHadayekZoneFilter('all');
    setCategoryFilter('all');
    setSubcategoryFilter('all');
    setOpenNowOnly(false);
    setHasRatingOnly(false);
    setHasVideoOnly(false);
    setSortBy('default');
  }, []);

  const hasActiveFilters =
    searchQuery !== '' ||
    (govFilter !== 'الجيزة' && govFilter !== 'all') ||
    (cityFilter !== 'حدائق الأهرام' && cityFilter !== 'all') ||
    hadayekZoneFilter !== 'all' ||
    categoryFilter !== 'all' ||
    subcategoryFilter !== 'all' ||
    openNowOnly ||
    hasRatingOnly ||
    hasVideoOnly ||
    sortBy !== 'default';

  return {
    searchQuery,
    setSearchQuery,
    deferredSearchQuery,
    govFilter,
    setGovFilter,
    cityFilter,
    setCityFilter,
    hadayekZoneFilter,
    setHadayekZoneFilter,
    categoryFilter,
    setCategoryFilter,
    subcategoryFilter,
    setSubcategoryFilter,
    openNowOnly,
    setOpenNowOnly,
    hasRatingOnly,
    setHasRatingOnly,
    hasVideoOnly,
    setHasVideoOnly,
    sortBy,
    setSortBy,
    shuffleSeed,
    setShuffleSeed,
    handleCategoryChange,
    resetAllFilters,
    hasActiveFilters,
  };
}
