import React, { useState, useMemo } from 'react';
import { Business } from '../../types';
import {
  FilterDrawer,
  SearchHeroHeader,
  SearchDiscoveryCategories,
  SearchResultsSection,
  type SearchViewProps,
  computeFeaturedBusinesses,
  handleLocationSelection,
} from '../../features/search';
import { getBusinessesInZone } from '../../utils/hadayekZoneHelper';
import { computeFilteredBusinesses } from '../showcase/model/showcaseFilterModel';
import { SearchDiscoveryFeatured } from './search/SearchDiscoveryFeatured';

export type { SearchViewProps };

export const SearchView: React.FC<SearchViewProps> = ({
  filteredBusinesses,
  allBusinesses,
  loading,
  searchQuery,
  onSearchChange,
  selectedGov,
  onGovChange,
  selectedCity,
  onCityChange,
  selectedZone,
  onZoneChange,
  categoryFilter,
  onCategoryChange,
  subcategoryFilter,
  onSubcategoryChange,
  sortBy,
  onSortChange,
  openNowOnly,
  onToggleOpenNow,
  hasRatingOnly,
  onToggleHasRating,
  hasVideoOnly,
  onToggleHasVideo,
  userCoords,
  isLocatingUser,
  onRequestLocation,
  onOpenBusiness,
  onToggleFavorite,
  favorites,
  onResetAllFilters,
  hasActiveFilters,
  onOpenVideoModal,
  onNavigate,
  onReshuffle,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showAllManually, setShowAllManually] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.location.search.includes('mode=all');
  });

  const isFilteringOrSearching = useMemo(() => {
    return Boolean(
      showAllManually ||
      searchQuery.trim() ||
      (categoryFilter && categoryFilter !== 'all') ||
      (subcategoryFilter && subcategoryFilter !== 'all') ||
      (selectedGov && selectedGov !== 'all') ||
      (selectedCity && selectedCity !== 'all') ||
      (selectedZone && selectedZone !== 'all') ||
      openNowOnly ||
      hasRatingOnly ||
      hasVideoOnly ||
      sortBy !== 'default' ||
      hasActiveFilters
    );
  }, [
    showAllManually, searchQuery, categoryFilter, subcategoryFilter, selectedGov,
    selectedCity, selectedZone, openNowOnly, hasRatingOnly, hasVideoOnly, sortBy, hasActiveFilters,
  ]);

  const effectiveFilteredBusinesses = useMemo(() => {
    if (filteredBusinesses && filteredBusinesses.length > 0) return filteredBusinesses;
    return computeFilteredBusinesses({
      publicBusinesses: allBusinesses,
      activityIntent: null,
      deferredSearchQuery: searchQuery,
      categoryFilter,
      subcategoryFilter,
      effectiveSearchZone: selectedZone,
      govFilter: selectedGov,
      cityFilter: selectedCity,
      openNowOnly,
      hasRatingOnly,
      hasVideoOnly,
      sortBy,
      userCoords,
      shuffleSeed: 1,
      pinnedDirectBizId: null,
    });
  }, [
    filteredBusinesses,
    allBusinesses,
    searchQuery,
    categoryFilter,
    subcategoryFilter,
    selectedZone,
    selectedGov,
    selectedCity,
    openNowOnly,
    hasRatingOnly,
    hasVideoOnly,
    sortBy,
    userCoords,
  ]);

  const featuredBusinesses = useMemo(() => computeFeaturedBusinesses(allBusinesses), [allBusinesses]);

  const advancedFiltersCount = [
    selectedGov !== 'all',
    selectedCity !== 'all',
    selectedZone !== 'all',
    hasRatingOnly,
  ].filter(Boolean).length;

  const categoryScopeBusinesses = useMemo(
    () => selectedZone && selectedZone !== 'all' ? getBusinessesInZone(allBusinesses, selectedZone) : allBusinesses,
    [allBusinesses, selectedZone]
  );

  const handleReturnToDiscovery = () => {
    setShowAllManually(false);
    onResetAllFilters();
    try {
      window.history.replaceState(null, '', '/search');
    } catch {}
  };

  const handleLocationSelect = (val: string) => handleLocationSelection(val, onGovChange, onCityChange);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-7 sm:space-y-10 pb-24 bg-[#f8fafc]" dir="rtl">
      <div className="space-y-7 sm:space-y-10">
        <SearchHeroHeader
          categoryFilter={categoryFilter}
          selectedZone={selectedZone}
          selectedCity={selectedCity}
          selectedGov={selectedGov}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onLocationSelect={handleLocationSelect}
          onRequestLocation={onRequestLocation}
          isLocatingUser={isLocatingUser}
          userCoords={userCoords}
          onNavigate={onNavigate}
          onSearchSubmit={() => setShowAllManually(true)}
        />

        <SearchDiscoveryCategories
          categoryFilter={categoryFilter}
          subcategoryFilter={subcategoryFilter}
          onCategoryChange={onCategoryChange}
          onSubcategoryChange={onSubcategoryChange}
          categoryScopeBusinesses={categoryScopeBusinesses}
          onShowAll={() => {
            setShowAllManually(true);
            onCategoryChange('all');
            onSubcategoryChange('all');
          }}
        />

        {isFilteringOrSearching ? (
          <SearchResultsSection
            filteredBusinesses={effectiveFilteredBusinesses}
            loading={loading}
            categoryFilter={categoryFilter}
            onCategoryChange={onCategoryChange}
            subcategoryFilter={subcategoryFilter}
            onSubcategoryChange={onSubcategoryChange}
            sortBy={sortBy}
            onSortChange={onSortChange}
            openNowOnly={openNowOnly}
            onToggleOpenNow={onToggleOpenNow}
            hasVideoOnly={hasVideoOnly}
            onToggleHasVideo={onToggleHasVideo}
            onOpenFilterDrawer={() => setDrawerOpen(true)}
            advancedFiltersCount={advancedFiltersCount}
            onNavigate={onNavigate}
            onReshuffle={onReshuffle}
            handleReturnToDiscovery={handleReturnToDiscovery}
            hasActiveFilters={hasActiveFilters}
            selectedGov={selectedGov}
            onGovChange={onGovChange}
            selectedCity={selectedCity}
            onCityChange={onCityChange}
            onOpenBusiness={onOpenBusiness}
            onToggleFavorite={onToggleFavorite}
            favorites={favorites}
            userCoords={userCoords}
            onOpenVideoModal={onOpenVideoModal}
          />
        ) : (
          <SearchDiscoveryFeatured
            featuredBusinesses={featuredBusinesses}
            allBusinessesCount={allBusinesses.length}
            onShowAll={() => setShowAllManually(true)}
            onOpenBusiness={onOpenBusiness}
            onToggleFavorite={onToggleFavorite}
            favorites={favorites}
            userCoords={userCoords}
            onOpenVideoModal={onOpenVideoModal}
            onNavigate={onNavigate}
          />
        )}
      </div>

      <FilterDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        allBusinesses={allBusinesses}
        selectedGov={selectedGov}
        onGovChange={onGovChange}
        selectedCity={selectedCity}
        onCityChange={onCityChange}
        selectedZone={selectedZone}
        onZoneChange={onZoneChange}
        categoryFilter={categoryFilter}
        onCategoryChange={onCategoryChange}
        subcategoryFilter={subcategoryFilter}
        onSubcategoryChange={onSubcategoryChange}
        openNowOnly={openNowOnly}
        onToggleOpenNow={onToggleOpenNow}
        hasRatingOnly={hasRatingOnly}
        onToggleHasRating={onToggleHasRating}
        hasVideoOnly={hasVideoOnly}
        onToggleHasVideo={onToggleHasVideo}
        sortBy={sortBy}
        onSortChange={onSortChange}
        onResetAll={onResetAllFilters}
        resultsCount={effectiveFilteredBusinesses.length}
      />
    </div>
  );
};
