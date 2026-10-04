import React from 'react';
import { Business } from '../../types';
import { MapModernTopBar } from './MapModernTopBar';
import { ZoneScopedSearchBar } from './ZoneScopedSearchBar';

export interface MapViewTopBarContainerProps {
  mode: 'picker' | 'view';
  lat: number;
  lng: number;
  activeSearchQuery: string;
  handleSearchChange: (query: string) => void;
  mapSearchMode: 'browse' | 'building';
  setMapSearchMode: (mode: 'browse' | 'building') => void;
  setSelectedBuildingState: (bldg: any) => void;
  onClearBuilding?: () => void;
  effectiveTargetBuilding?: any;
  activeZone: string;
  state: any;
  setNavigationTargetState: (target: any) => void;
  setLocalRoute: (route: any) => void;
  onSelectZone?: (z: string) => void;
  activeCategory: string;
  onCategoryChange?: (cat: string) => void;
  quickCategories?: any[];
  filteredBusinessesCount: number;
  businesses: Business[];
  searchableBusinesses?: Business[];
  externalOnSelectBuilding?: (bldg: any) => void;
  selectedBuildingState: any;
}

export const MapViewTopBarContainer: React.FC<MapViewTopBarContainerProps> = ({
  mode,
  lat,
  lng,
  activeSearchQuery,
  handleSearchChange,
  mapSearchMode,
  setMapSearchMode,
  setSelectedBuildingState,
  onClearBuilding,
  effectiveTargetBuilding,
  activeZone,
  state,
  setNavigationTargetState,
  setLocalRoute,
  onSelectZone,
  activeCategory,
  onCategoryChange,
  quickCategories,
  filteredBusinessesCount,
  businesses,
  searchableBusinesses,
  externalOnSelectBuilding,
  selectedBuildingState,
}) => {
  if (mode !== 'view' || Math.abs(lat - 29.9683) >= 0.06 || Math.abs(lng - 31.1002) >= 0.06) {
    return null;
  }

  return (
    <MapModernTopBar
      searchQuery={activeSearchQuery}
      onSearchQueryChange={handleSearchChange}
      searchMode={mapSearchMode}
      onSearchModeChange={(next) => {
        setMapSearchMode(next);
        setSelectedBuildingState(null);
        onClearBuilding?.();
      }}
      buildingNumber={effectiveTargetBuilding?.buildingNumber}
      selectedZone={activeZone}
      onSelectZone={(z) => {
        state.setSelectedZone(z);
        setSelectedBuildingState(null);
        setNavigationTargetState(null);
        setLocalRoute(null);
        if (onClearBuilding) onClearBuilding();
        if (onSelectZone) onSelectZone(z);
      }}
      categoryFilter={activeCategory}
      onCategoryChange={(cat) => {
        state.setSelectedBiz(null);
        state.setMapCategoryFilter(cat);
        if (onCategoryChange) onCategoryChange(cat);
      }}
      quickCategories={quickCategories}
      filteredBusinessesCount={filteredBusinessesCount}
      businesses={businesses}
      searchableBusinesses={searchableBusinesses}
      onSelectBuilding={(bldg) => {
        setSelectedBuildingState(bldg);
        state.setSelectedBiz(null);
        if (externalOnSelectBuilding) externalOnSelectBuilding(bldg);
      }}
      onSelectBusiness={(biz) => {
        state.setSelectedBiz(biz);
        setSelectedBuildingState(null);
      }}
    >
      <ZoneScopedSearchBar
        key={activeZone}
        selectedZone={activeZone}
        businesses={businesses}
        selectedBuilding={selectedBuildingState}
        onSelectBuilding={(bldg) => {
          setSelectedBuildingState(bldg);
          state.setSelectedBiz(null);
          if (externalOnSelectBuilding) externalOnSelectBuilding(bldg);
        }}
        onSelectBusiness={(biz) => {
          state.setSelectedBiz(biz);
          setSelectedBuildingState(null);
        }}
        onClearBuilding={() => {
          setSelectedBuildingState(null);
          if (onClearBuilding) onClearBuilding();
        }}
        onClearZone={() => {
          state.setSelectedZone('');
          setSelectedBuildingState(null);
          if (onClearBuilding) onClearBuilding();
          if (onSelectZone) onSelectZone('');
        }}
      />
    </MapModernTopBar>
  );
};
