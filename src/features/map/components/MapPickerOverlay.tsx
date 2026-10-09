import React from 'react';
import { Business } from '../../../types';
import { MapHeaderBar } from './MapHeaderBar';
import { MapSearchBox } from './MapSearchBox';

export interface MapPickerOverlayProps {
  mode: 'picker' | 'view';
  filteredBusinessesCount: number;
  tileLayer: any;
  switchTileLayer: (type: any) => void;
  state: any;
  businesses: Business[];
  isLocating: boolean;
  handleGetLocation?: () => void;
  showHadayekGates: boolean;
  onToggleBusinessesVisibility?: (visible: boolean) => void;
  onSelectZone?: (zoneLetter: string) => void;
  onCategoryChange?: (cat: string) => void;
  mapInstance: any;
  onExploreDirectory?: () => void;
  search: {
    searchQuery: string;
    isSearching: boolean;
    searchResults: any[];
    showSearchResults: boolean;
    setShowSearchResults: (show: boolean) => void;
    handleSearchChange: (e: any) => void;
    handleSelectSearchResult: (res: any) => void;
    handleClearSearch: () => void;
  };
}

export const MapPickerOverlay: React.FC<MapPickerOverlayProps> = ({
  mode,
  filteredBusinessesCount,
  tileLayer,
  switchTileLayer,
  state,
  businesses,
  isLocating,
  handleGetLocation,
  showHadayekGates,
  onToggleBusinessesVisibility,
  onSelectZone,
  onCategoryChange,
  mapInstance,
  onExploreDirectory,
  search,
}) => {
  if (mode !== 'picker') return null;

  return (
    <>
      <MapHeaderBar
        mode={mode}
        filteredBusinessesCount={filteredBusinessesCount}
        tileLayer={tileLayer}
        switchTileLayer={switchTileLayer}
        state={state}
        businesses={businesses}
        onGovChange={(gov) => state.handleGovChange(gov, mapInstance.updateSelectedPosition)}
        isLocating={isLocating}
        handleGetLocation={handleGetLocation}
        showHadayekGates={showHadayekGates}
        onToggleBusinessesVisibility={onToggleBusinessesVisibility}
        onSelectZone={onSelectZone}
        onCategorySelect={onCategoryChange}
        mapInstance={mapInstance}
        onExploreDirectory={onExploreDirectory}
      />
      <MapSearchBox
        searchQuery={search.searchQuery}
        isSearching={search.isSearching}
        searchResults={search.searchResults}
        showSearchResults={search.showSearchResults}
        setShowSearchResults={search.setShowSearchResults}
        handleSearchChange={search.handleSearchChange}
        handleSelectSearchResult={search.handleSelectSearchResult}
        handleClearSearch={search.handleClearSearch}
      />
    </>
  );
};
