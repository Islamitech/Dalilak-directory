import React, { useState, useMemo, useCallback } from 'react';
import { Business } from '../../types';
import { InteractiveMap, MAP_QUICK_CATEGORIES } from '../InteractiveMap';
import { getAvailableQuickCategoriesInZone } from '../../utils/hadayekZoneHelper';
import { computeFilteredBusinesses } from '../showcase/model/showcaseFilterModel';
import {
  getHadayekZone,
  getRecommendedGateForZone,
} from '../../data/hadayekAtlasData';
import { ProximityRadarDrawer } from '../atlas/ProximityRadarDrawer';
import { HadayekGatesModal } from '../atlas/HadayekGatesModal';
import { useMapViewUrlState } from '../../features/map';

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
  const [isGatesModalOpen, setIsGatesModalOpen] = useState(false);
  const [isRadarOpen, setIsRadarOpen] = useState(false);

  const {
    activeZoneLetter,
    setActiveZoneLetter,
    activeBuildingNumber,
    setActiveBuildingNumber,
    exactBuildingCoords,
    selectZone,
    clearTarget,
    clearBuilding,
  } = useMapViewUrlState(focusedBusiness, selectedZone, onZoneChange);

  const quickCategories = useMemo(() => {
    return getAvailableQuickCategoriesInZone(businesses, activeZoneLetter, MAP_QUICK_CATEGORIES);
  }, [businesses, activeZoneLetter]);

  const activeCategoryObj = useMemo(() => {
    if (!categoryFilter || categoryFilter === 'all') return null;
    return quickCategories.find((c) => c.id === categoryFilter) || {
      id: categoryFilter,
      name: categoryFilter,
      icon: '📍',
      count: 0,
    };
  }, [categoryFilter, quickCategories]);

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
    setIsRadarOpen(false);
    selectZone(letter);
  }, [selectZone]);

  const effectiveFilteredBusinesses = useMemo(() => {
    if (filteredBusinesses && filteredBusinesses.length > 0) return filteredBusinesses;
    return computeFilteredBusinesses({
      publicBusinesses: businesses,
      activityIntent: null,
      deferredSearchQuery: searchQuery || '',
      categoryFilter,
      subcategoryFilter: 'all',
      effectiveSearchZone: activeZoneLetter || selectedZone || 'all',
      govFilter: 'all',
      cityFilter: 'all',
      openNowOnly,
      hasRatingOnly: false,
      hasVideoOnly: false,
      sortBy: sortBy || 'default',
      userCoords,
      shuffleSeed: 1,
      pinnedDirectBizId: null,
    });
  }, [
    filteredBusinesses,
    businesses,
    searchQuery,
    categoryFilter,
    activeZoneLetter,
    selectedZone,
    openNowOnly,
    sortBy,
    userCoords,
  ]);

  return (
    <div className="w-full h-full min-h-0 relative flex-1 flex flex-col overflow-hidden">
      <div className="relative w-full h-full min-h-0 flex-1 overflow-hidden">
        <InteractiveMap
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          businesses={effectiveFilteredBusinesses}
          searchableBusinesses={businesses}
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
          onSelectBuilding={(bldg) => {
            setActiveZoneLetter(bldg.zoneLetter);
            setActiveBuildingNumber(bldg.buildingNumber);
            setIsRadarOpen(true);
            if (typeof window !== 'undefined') {
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.set('zone', bldg.zoneLetter);
              newUrl.searchParams.set('bldg', bldg.buildingNumber);
              window.history.replaceState({}, '', newUrl.toString());
            }
          }}
          onClearBuilding={clearBuilding}
          onOpenRadar={() => setIsRadarOpen(true)}
          heightClass="h-full"
          defaultExpanded={false}
          onExploreDirectory={() => onNavigate('/search')}
          onOpenGatesGuide={() => setIsGatesModalOpen(true)}
          quickCategories={quickCategories}
          focusedBusiness={focusedBusiness}
          onClearFocusedBusiness={onClearFocusedBusiness}
        />

        {targetBuilding && isRadarOpen && (
          <ProximityRadarDrawer
            target={targetBuilding}
            businesses={businesses}
            onOpenBusiness={onOpenBusiness}
            onClose={() => setIsRadarOpen(false)}
          />
        )}
      </div>

      <HadayekGatesModal
        isOpen={isGatesModalOpen}
        onClose={() => setIsGatesModalOpen(false)}
        onSelectZone={handleSelectZoneJump}
      />
    </div>
  );
};
