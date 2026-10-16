import React, { useMemo, useEffect, useState } from 'react';
import { type SearchViewProps, CadastralBuildingCard } from '../../features/search';
import { computeFilteredBusinesses } from '../showcase/model/showcaseFilterModel';
import { BusinessCardGrid } from '../../components/cards/BusinessCardGrid';
import { ActivityListHeader } from './ActivityListHeader';
import { useBuildingIntent } from '../showcase/hooks/useBuildingIntent';
import { getRecommendedGateForZone } from '../../shared/data/hadayek/hadayekGeo';
import { filterBusinessesForMap } from '../../utils/hadayekZoneHelper';
import { SearchQuickSortPills } from './SearchQuickSortPills';
import { HadayekEmergencyModal } from './HadayekEmergencyModal';

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
  onSortChange,
  openNowOnly,
  onToggleOpenNow,
  verifiedOnly = false,
  onToggleVerified,
  hasRatingOnly,
  hasVideoOnly,
  userCoords,
  isLocatingUser = false,
  onRequestLocation,
  onOpenBusiness,
  onToggleFavorite,
  favorites,
  onResetAllFilters,
  hasActiveFilters = false,
  onNavigate,
  directoryScope = 'hadayek',
  onDirectoryScopeChange,
}) => {
  const { buildingIntent, buildingCoords } = useBuildingIntent(searchQuery || '', selectedZone);

  const effectiveFilteredBusinesses = useMemo(() => {
    if (filteredBusinesses) return filteredBusinesses;
    return computeFilteredBusinesses({
      publicBusinesses: allBusinesses,
      activityIntent: null,
      deferredSearchQuery: searchQuery,
      buildingIntent,
      buildingCoords,
      categoryFilter,
      subcategoryFilter,
      effectiveSearchZone: selectedZone,
      govFilter: selectedGov,
      cityFilter: selectedCity,
      openNowOnly,
      verifiedOnly,
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
    buildingIntent,
    buildingCoords,
    categoryFilter,
    subcategoryFilter,
    selectedZone,
    selectedGov,
    selectedCity,
    openNowOnly,
    verifiedOnly,
    hasRatingOnly,
    hasVideoOnly,
    sortBy,
    userCoords,
  ]);

  const cadastralBuilding = useMemo(() => {
    if (!buildingIntent) return null;
    const gateInfo = getRecommendedGateForZone(buildingIntent.zoneLetter);
    return {
      buildingNumber: buildingIntent.buildingNumber,
      zoneLetter: buildingIntent.zoneLetter,
      nearestGateName: gateInfo?.primaryGate?.popularNameAr || 'البوابة الأولى',
    };
  }, [buildingIntent]);

  const buildingFound = Boolean(buildingIntent && buildingCoords);
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);

  const scopeCatalog = useMemo(
    () => (directoryScope === 'all' ? allBusinesses : filterBusinessesForMap(allBusinesses, 'all', 'all', false)),
    [allBusinesses, directoryScope]
  );

  useEffect(() => {
    let saved = 0;
    try {
      saved = Number(sessionStorage.getItem('dalilak:list-scroll') || 0);
    } catch {
      return;
    }
    if (saved > 0) {
      let tries = 0;
      const restore = () => {
        window.scrollTo(0, saved);
        if (window.scrollY < saved - 8 && tries < 10) {
          tries += 1;
          setTimeout(restore, 60);
        }
      };
      restore();
    }
    const persist = () => {
      if (window.location.pathname !== '/search') return;
      const scroller = document.scrollingElement;
      if (window.scrollY === 0 && scroller && scroller.scrollHeight <= scroller.clientHeight + 1) return;
      try {
        sessionStorage.setItem('dalilak:list-scroll', String(window.scrollY));
      } catch {
        /* sessionStorage unavailable */
      }
    };
    window.addEventListener('scroll', persist, { passive: true });
    return () => {
      window.removeEventListener('scroll', persist);
      if (window.location.pathname === '/search') persist();
    };
  }, []);

  return (
    <div
      className="max-w-7xl mx-auto w-full px-3 min-[380px]:px-4 sm:px-6 pt-2 pb-[calc(140px+env(safe-area-inset-bottom,0px))] bg-[var(--bg)]"
      dir="rtl"
    >

      <ActivityListHeader
        shown={effectiveFilteredBusinesses.length}
        total={scopeCatalog.length}
        filtered={hasActiveFilters}
        loading={loading}
        categoryId={categoryFilter}
        subcategoryId={subcategoryFilter}
        zone={selectedZone}
        scope={directoryScope}
        onScopeChange={onDirectoryScopeChange}
      />

      {onSortChange && onToggleOpenNow && (
        <div className="mb-3">
          <SearchQuickSortPills
            sortBy={sortBy}
            onSortChange={onSortChange}
            openNowOnly={openNowOnly}
            onToggleOpenNow={onToggleOpenNow}
            verifiedOnly={verifiedOnly}
            onToggleVerified={onToggleVerified}
            onRequestLocation={onRequestLocation}
            isLocatingUser={isLocatingUser}
            onOpenEmergency={() => setShowEmergencyModal(true)}
          />
        </div>
      )}

      {cadastralBuilding && buildingFound && (
        <div className="mb-4">
          <CadastralBuildingCard
            buildingNumber={cadastralBuilding.buildingNumber}
            zoneLetter={cadastralBuilding.zoneLetter}
            nearestGateName={cadastralBuilding.nearestGateName}
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

      <HadayekEmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        onSelectCategory={onCategoryChange}
      />
    </div>
  );
};
