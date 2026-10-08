import React, { useMemo, useState, useEffect } from 'react';
import { type SearchViewProps, CadastralBuildingCard, UnifiedSearchFilterBar } from '../../features/search';
import { computeFilteredBusinesses } from '../showcase/model/showcaseFilterModel';
import { BusinessCardGrid } from '../../components/cards/BusinessCardGrid';
import { ViewSegmentedSwitch } from '../layout/ViewSegmentedSwitch';
import { parseHadayekBuildingAddress } from '../../utils/hadayekBuildingSearch';
import { getRecommendedGateForZone } from '../../data/hadayekAtlasData';

export type { SearchViewProps };

/**
 * 📋 SearchView — simplified activity list (/search)
 *
 * Shows unified search and quick category/zone chips above the business cards:
 * vertical stack on phones, expanding to 3-4 columns on large screens.
 */
export const SearchView: React.FC<SearchViewProps> = ({
  filteredBusinesses,
  allBusinesses,
  loading,
  searchQuery,
  onSearchChange,
  selectedGov,
  selectedCity,
  selectedZone,
  onZoneChange,
  categoryFilter,
  onCategoryChange,
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

  const cadastralBuilding = useMemo(() => {
    if (!searchQuery) return null;
    const match = parseHadayekBuildingAddress(searchQuery, selectedZone);
    if (!match) return null;
    const gateInfo = getRecommendedGateForZone(match.zoneLetter);
    return {
      buildingNumber: match.buildingNumber,
      zoneLetter: match.zoneLetter,
      nearestGateName: gateInfo?.primaryGate?.popularNameAr || 'البوابة الأولى',
    };
  }, [searchQuery, selectedZone]);

  const [isBuildingFound, setIsBuildingFound] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    if (!cadastralBuilding) {
      setIsBuildingFound(true);
      return;
    }
    import('../../data/hadayekAtlasData').then(({ searchBuildingCoordinatesExact }) => {
      searchBuildingCoordinatesExact(cadastralBuilding.zoneLetter, cadastralBuilding.buildingNumber).then((coords) => {
        if (!cancelled) {
          setIsBuildingFound(Boolean(coords));
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [cadastralBuilding?.zoneLetter, cadastralBuilding?.buildingNumber]);

  return (
    <div
      className="max-w-7xl mx-auto w-full px-3 min-[380px]:px-4 sm:px-6 py-3 sm:py-5 pb-[calc(96px+env(safe-area-inset-bottom,0px))] bg-[#f8fafc]"
      dir="rtl"
    >
      <div className="sticky top-[112px] sm:top-[68px] z-30 flex justify-center pointer-events-none mb-4">
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <ViewSegmentedSwitch
            activeView="list"
            size="sm"
            onViewChange={(view) => {
              if (view === 'map') onNavigate('/map');
            }}
          />
          <UnifiedSearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            selectedCategory={categoryFilter}
            onCategoryChange={onCategoryChange}
            selectedZone={selectedZone}
            onZoneChange={onZoneChange}
            businesses={allBusinesses}
            matchingCount={effectiveFilteredBusinesses.length}
            onResetAll={onResetAllFilters}
            variant="list"
          />
        </div>
      </div>

      {cadastralBuilding && (
        <div className="mb-4">
          <CadastralBuildingCard
            buildingNumber={cadastralBuilding.buildingNumber}
            zoneLetter={cadastralBuilding.zoneLetter}
            nearestGateName={cadastralBuilding.nearestGateName}
            isFound={isBuildingFound}
            onNavigateToMap={(z, b) => onNavigate(`/map?zone=${encodeURIComponent(z)}&bldg=${encodeURIComponent(b)}`)}
          />
        </div>
      )}

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
