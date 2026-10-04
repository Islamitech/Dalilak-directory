import React, { useMemo } from 'react';
import { type SearchViewProps } from '../../features/search';
import { computeFilteredBusinesses } from '../showcase/model/showcaseFilterModel';
import { BusinessCardGrid } from '../../components/cards/BusinessCardGrid';
import { ViewSegmentedSwitch } from '../layout/ViewSegmentedSwitch';

export type { SearchViewProps };

/**
 * 📋 SearchView — simplified activity list (/search)
 *
 * Shows only the simplified business cards: vertical stack on phones,
 * expanding to 3-4 columns on large screens. Filtering happens via the
 * single header search; no extra toolbars on this page.
 */
export const SearchView: React.FC<SearchViewProps> = ({
  filteredBusinesses,
  allBusinesses,
  loading,
  searchQuery,
  selectedGov,
  selectedCity,
  selectedZone,
  categoryFilter,
  subcategoryFilter,
  sortBy,
  openNowOnly,
  hasRatingOnly,
  hasVideoOnly,
  userCoords,
  onOpenBusiness,
  onToggleFavorite,
  favorites,
  onResetAllFilters,
  onNavigate,
}) => {
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

  return (
    <div
      className="max-w-7xl mx-auto w-full px-3 min-[380px]:px-4 sm:px-6 py-3 sm:py-5 pb-[calc(96px+env(safe-area-inset-bottom,0px))] bg-[#f8fafc]"
      dir="rtl"
    >
      <div className="sticky top-[112px] sm:top-[68px] z-30 flex justify-center pointer-events-none mb-3">
        <div className="pointer-events-auto">
          <ViewSegmentedSwitch
            activeView="list"
            onViewChange={(view) => {
              if (view === 'map') onNavigate('/map');
            }}
          />
        </div>
      </div>
      <BusinessCardGrid
        businesses={effectiveFilteredBusinesses}
        loading={loading}
        onOpenBusiness={onOpenBusiness}
        onToggleFavorite={onToggleFavorite}
        favorites={favorites}
        userCoords={userCoords}
        onResetFilters={onResetAllFilters}
      />
    </div>
  );
};
