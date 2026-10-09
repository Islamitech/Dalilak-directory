import { useState, useEffect, useCallback, useDeferredValue } from 'react';
import { resolveCategorySelection } from '../../../utils/categoryMatcher';
import { hydrateCategoryQuery, queryFlag, querySort, queryValue, writeShowcaseQuery, type ShowcaseSort } from '../model/showcaseFilterQuery';

export function useShowcaseFilterState(pathname = '') {
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('q') || new URLSearchParams(window.location.search).get('search') || '';
  });
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [govFilter, setGovFilter] = useState<string>('الجيزة');
  const [cityFilter, setCityFilter] = useState<string>('حدائق الأهرام');
  const [hadayekZoneFilter, setHadayekZoneFilter] = useState<string>(() => queryValue('zone') || 'all');
  const [categoryFilter, setCategoryFilter] = useState<string>(() => queryValue('cat') || 'all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const [openNowOnly, setOpenNowOnly] = useState<boolean>(() => queryFlag('open'));
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(() => queryFlag('verified'));
  const [hideActivities, setHideActivities] = useState<boolean>(() => queryFlag('hide'));
  const [hasRatingOnly, setHasRatingOnly] = useState<boolean>(false);
  const [hasVideoOnly, setHasVideoOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<ShowcaseSort>(querySort);
  const [shuffleSeed, setShuffleSeed] = useState<number>(() => Math.floor(Math.random() * 1000000) + 1);

  const handleCategoryChange = useCallback((nextCategory: string) => {
    const selection = resolveCategorySelection(nextCategory);
    setCategoryFilter(selection.mainCategoryId);
    setSubcategoryFilter(selection.subcategoryId);
  }, []);

  useEffect(() => {
    const hydrated = hydrateCategoryQuery(resolveCategorySelection);
    if (hydrated.main) {
      setCategoryFilter(hydrated.main);
      if (hydrated.sub) setSubcategoryFilter(hydrated.sub);
    }
    if (hydrated.q) setSearchQuery(hydrated.q);
  }, []);

  useEffect(() => {
    const onVerified = (event: Event) => setVerifiedOnly(Boolean((event as CustomEvent<boolean>).detail));
    const onHide = (event: Event) => setHideActivities(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener('showcase:verified', onVerified);
    window.addEventListener('showcase:hide-activities', onHide);
    return () => {
      window.removeEventListener('showcase:verified', onVerified);
      window.removeEventListener('showcase:hide-activities', onHide);
    };
  }, []);

  useEffect(() => {
    writeShowcaseQuery({ categoryFilter, subcategoryFilter, hadayekZoneFilter, openNowOnly, verifiedOnly, hideActivities, sortBy, searchQuery });
  }, [pathname, categoryFilter, subcategoryFilter, hadayekZoneFilter, openNowOnly, verifiedOnly, hideActivities, sortBy, searchQuery]);

  const resetAllFilters = useCallback(() => {
    setSearchQuery('');
    setGovFilter('الجيزة');
    setCityFilter('حدائق الأهرام');
    setHadayekZoneFilter('all');
    setCategoryFilter('all');
    setSubcategoryFilter('all');
    setOpenNowOnly(false);
    setVerifiedOnly(false);
    setHideActivities(false);
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
    verifiedOnly ||
    hideActivities ||
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
    verifiedOnly,
    setVerifiedOnly,
    hideActivities,
    setHideActivities,
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
