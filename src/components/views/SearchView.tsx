import React, { useMemo, useState, useEffect } from 'react';
import { type SearchViewProps, CadastralBuildingCard, UnifiedSearchFilterBar } from '../../features/search';
import { computeFilteredBusinesses } from '../showcase/model/showcaseFilterModel';
import { BusinessCardGrid } from '../../components/cards/BusinessCardGrid';
import { ViewSegmentedSwitch } from '../layout/ViewSegmentedSwitch';
import { Button } from '../../shared/ui';
import { X } from 'lucide-react';
import { parseHadayekBuildingAddress } from '../../utils/hadayekBuildingSearch';
import { getRecommendedGateForZone } from '../../shared/data/hadayek/hadayekGeo';

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
  verifiedOnly = false,
  hasRatingOnly,
  hasVideoOnly,
  userCoords,
  onOpenBusiness,
  onToggleFavorite,
  favorites,
  onResetAllFilters,
  hasActiveFilters = false,
  onNavigate,
}) => {
  const effectiveFilteredBusinesses = useMemo(() => {
    if (filteredBusinesses) return filteredBusinesses;
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
    import('../../shared/data/hadayek/hadayekGeo').then(({ searchBuildingCoordinatesExact }) => {
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
      className="max-w-7xl mx-auto w-full px-3 min-[380px]:px-4 sm:px-6 pt-2 pb-[calc(96px+env(safe-area-inset-bottom,0px))] bg-[var(--bg)]"
      dir="rtl"
    >
      <div className="sticky top-[calc(var(--app-header-h,var(--header-h))+0.5rem)] z-30 flex justify-center pointer-events-none mb-4">
        <div className="pointer-events-auto flex flex-nowrap items-center justify-center gap-2 max-w-full">
          <div className="shrink-0 rounded-pill bg-white border border-slate-200/80 shadow-sm p-0.5">
            <ViewSegmentedSwitch
              activeView="list"
              size="sm"
              onViewChange={(view) => {
                if (view === 'map') onNavigate('/map');
              }}
            />
          </div>
          <div className="rounded-pill bg-white border border-slate-200/80 shadow-sm px-1 py-0.5">
            <UnifiedSearchFilterBar
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              selectedCategory={categoryFilter}
              onCategoryChange={onCategoryChange}
              selectedZone={selectedZone}
              onZoneChange={onZoneChange}
              businesses={allBusinesses}
              variant="list"
            />
          </div>
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

      {hasActiveFilters && (
        <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] inset-x-0 z-40 flex justify-center pointer-events-none">
          <Button
            size="sm"
            variant="secondary"
            className="pointer-events-auto min-h-11! px-3! text-caption! shadow-md"
            leadingIcon={<X />}
            onClick={onResetAllFilters}
            aria-label="مسح الفلاتر"
          >
            مسح الفلتر
          </Button>
        </div>
      )}
    </div>
  );
};
