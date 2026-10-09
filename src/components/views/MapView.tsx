import React, { useMemo, useCallback } from 'react';
import { Business } from '../../types';
import { InteractiveMap, stashCameraReturn, useMapViewUrlState } from '../../features/map';
import { computeFilteredBusinesses } from '../showcase/model/showcaseFilterModel';
import { parseActivitySearchIntent } from '../../utils/activitySearchIntent';
import { filterBusinessesForMap } from '../../utils/hadayekZoneHelper';
import {
  getHadayekZone,
  getRecommendedGateForZone,
} from '../../shared/data/hadayek/hadayekGeo';

export interface MapViewProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  businesses: Business[];
  filteredBusinesses?: Business[];
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  selectedZone?: string;
  onZoneChange?: (zone: string) => void;
  sortBy: any;
  onSortChange: (s: any) => void;
  openNowOnly: boolean;
  onToggleOpenNow: () => void;
  verifiedOnly?: boolean;
  hideActivities?: boolean;
  filtersActive?: boolean;
  onResetAllFilters?: () => void;
  onOpenBusiness: (biz: Business) => void;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
  userCoords: { lat: number; lng: number } | null;
  onNavigate: (path: string) => void;
  lat?: number;
  lng?: number;
  focusedBusiness?: Business | null;
  onClearFocusedBusiness?: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  searchQuery,
  onSearchChange,
  businesses,
  filteredBusinesses,
  categoryFilter,
  onCategoryChange,
  selectedZone,
  onZoneChange,
  sortBy,
  onSortChange,
  openNowOnly,
  verifiedOnly = false,
  hideActivities = false,
  filtersActive = false,
  onResetAllFilters,
  onToggleOpenNow,
  onOpenBusiness,
  onToggleFavorite,
  favorites,
  userCoords,
  onNavigate,
  lat = 29.9683,
  lng = 31.1002,
  focusedBusiness,
  onClearFocusedBusiness,
}) => {
  const {
    activeZoneLetter,
    setActiveZoneLetter,
    activeBuildingNumber,
    setActiveBuildingNumber,
    exactBuildingCoords,
    clearTarget,
    clearBuilding,
  } = useMapViewUrlState(focusedBusiness, selectedZone, onZoneChange);

  const targetBuilding = useMemo(() => {
    if (!activeZoneLetter || !activeBuildingNumber || !exactBuildingCoords) return null;
    const zone = getHadayekZone(activeZoneLetter);
    if (!zone) return null;
    return {
      zone,
      zoneLetter: zone.letterAr,
      buildingNumber: activeBuildingNumber,
      lat: exactBuildingCoords.lat,
      lng: exactBuildingCoords.lng,
      coords: { lat: exactBuildingCoords.lat, lng: exactBuildingCoords.lng },
    };
  }, [activeZoneLetter, activeBuildingNumber, exactBuildingCoords]);

  const gateInfo = useMemo(() => {
    if (!activeZoneLetter) return null;
    return getRecommendedGateForZone(activeZoneLetter);
  }, [activeZoneLetter]);

  const handleSelectZoneJump = useCallback((letter: string) => {
    setActiveZoneLetter(!letter || letter === 'all' ? '' : letter);
  }, [setActiveZoneLetter]);

  const handleSelectBuilding = useCallback((bldg: { buildingNumber: string; zoneLetter: string; lat: number; lng: number }) => {
    stashCameraReturn();
    setActiveZoneLetter(bldg.zoneLetter);
    setActiveBuildingNumber(bldg.buildingNumber);
    if (typeof window === 'undefined') return;
    const withBuilding = (base: string) => {
      const url = new URL(base, window.location.origin);
      url.searchParams.set('zone', bldg.zoneLetter);
      url.searchParams.set('bldg', bldg.buildingNumber);
      return `${url.pathname}${url.search}`;
    };
    const historyState = window.history.state;
    if (historyState?.directoryModal) {
      window.history.replaceState({ buildingSheet: true }, '', withBuilding(historyState.directoryBackground || '/map'));
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    const next = withBuilding(`${window.location.pathname}${window.location.search}`);
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.pushState({ buildingSheet: true }, '', next);
    }
  }, [setActiveZoneLetter, setActiveBuildingNumber]);

  React.useEffect(() => {
    const handleBuildingSearch = (event: Event) => {
      const building = (event as CustomEvent<{ buildingNumber: string; zoneLetter: string; lat: number; lng: number }>).detail;
      if (building && Number.isFinite(building.lat) && Number.isFinite(building.lng)) {
        handleSelectBuilding(building);
      }
    };
    window.addEventListener('map:searchBuilding', handleBuildingSearch);
    return () => window.removeEventListener('map:searchBuilding', handleBuildingSearch);
  }, [handleSelectBuilding]);

  const activityIntent = useMemo(() => parseActivitySearchIntent(searchQuery || ''), [searchQuery]);

  const effectiveFilteredBusinesses = useMemo(() => {
    const listed = computeFilteredBusinesses({
      publicBusinesses: businesses,
      activityIntent,
      deferredSearchQuery: searchQuery || '',
      categoryFilter: activityIntent ? 'all' : categoryFilter,
      subcategoryFilter: 'all',
      effectiveSearchZone: 'all',
      govFilter: 'all',
      cityFilter: 'all',
      openNowOnly,
      verifiedOnly,
      hasRatingOnly: false,
      hasVideoOnly: false,
      sortBy: sortBy || 'default',
      userCoords,
      shuffleSeed: 1,
      pinnedDirectBizId: null,
    });
    return filterBusinessesForMap(listed, 'all', 'all', false);
  }, [
    businesses,
    activityIntent,
    searchQuery,
    categoryFilter,
    openNowOnly,
    verifiedOnly,
    sortBy,
    userCoords,
  ]);

  return (
    <div className="w-full h-full min-h-0 relative flex-1 flex flex-col overflow-hidden">
      <div className="relative w-full h-full min-h-0 flex-1 overflow-hidden">
        <InteractiveMap
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          businesses={hideActivities ? [] : effectiveFilteredBusinesses}
          mode="view"
          lat={lat}
          lng={lng}
          initialShowBusinesses={false}
          categoryFilter={categoryFilter}
          onCategoryChange={onCategoryChange}
          targetBuilding={targetBuilding}
          showHadayekGates={true}
          selectedZone={activeZoneLetter}
          onSelectZone={handleSelectZoneJump}
          onSelectBusiness={onOpenBusiness}
          onSelectBuilding={handleSelectBuilding}
          onClearBuilding={clearBuilding}
          heightClass="h-full"
          defaultExpanded={false}
          onExploreDirectory={() => onNavigate('/search')}
          onResetFilters={onResetAllFilters}
          filtersActive={filtersActive}
          focusedBusiness={focusedBusiness}
          onClearFocusedBusiness={onClearFocusedBusiness}
          resultsReady={filteredBusinesses !== undefined}
        />
      </div>
    </div>
  );
};
