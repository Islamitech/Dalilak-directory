import React, { useRef } from 'react';
import {
  InteractiveMapProps,
  MapTileLayerType,
  MAP_QUICK_CATEGORIES,
  useMapInstance,
  useMapPinsClustering,
  useMapGeolocation,
  useMapSearch,
  useMapState,
  MapHeaderBar,
  MapModernTopBar,
  MapSearchBox,
  MapFloatingControls,
  MapSelectedBusinessDrawer,
  MapFooterBar,
} from './map';

export type { InteractiveMapProps, MapTileLayerType };
export { MAP_QUICK_CATEGORIES };

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  mode = 'view',
  lat = 29.9683,
  lng = 31.1002,
  onLocationSelect,
  businesses = [],
  onSelectBusiness,
  onEditBusiness,
  heightClass = 'h-[380px]',
  targetBuilding = null,
  showHadayekGates = true,
  selectedZone,
  onSelectZone,
  categoryFilter,
  onCategoryChange,
  initialShowBusinesses = false,
  onToggleBusinessesVisibility,
  defaultExpanded = false,
  onExploreDirectory,
  onOpenGatesGuide,
  quickCategories,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const state = useMapState({ initialShowBusinesses, defaultExpanded, initialSelectedZone: selectedZone });

  // Sync state if selectedZone prop changes from parent
  React.useEffect(() => {
    if (selectedZone !== undefined) {
      state.setSelectedZone(selectedZone);
    }
  }, [selectedZone]);

  // Sync state if categoryFilter prop changes from parent
  React.useEffect(() => {
    if (categoryFilter !== undefined) {
      state.setMapCategoryFilter(categoryFilter);
    }
  }, [categoryFilter]);

  const mapInstance = useMapInstance({
    containerRef,
    mode,
    lat,
    lng,
    zoomLevel: 14,
    isExpanded: state.isExpanded,
    onLocationSelect,
  });

  useMapPinsClustering({
    mapInstance,
    state,
    mode,
    businesses,
    showHadayekGates,
    targetBuilding,
    onSelectBusiness,
    onSelectZone,
  });

  const geolocation = useMapGeolocation({
    updateSelectedPosition: mapInstance.updateSelectedPosition,
    setGpsAccuracy: mapInstance.setGpsAccuracy,
  });

  const search = useMapSearch({
    updateSelectedPosition: async (lat, lng, flyTo, zoom) => {
      await mapInstance.updateSelectedPosition(lat, lng, flyTo, zoom);
    },
  });

  React.useEffect(() => {
    if (mapInstance.isMapReady && mapInstance.leafletMapRef.current) {
      const timer = setTimeout(() => {
        mapInstance.leafletMapRef.current?.invalidateSize();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mapInstance.isMapReady]);

  const filteredBusinessesCount = businesses.filter(
    (b) => state.selectedGovFilter === 'all' || b.governorate.includes(state.selectedGovFilter)
  ).length;

  const canvasWrapperClasses = 'relative w-full flex-1 h-full min-h-0 overflow-hidden z-0';

  const mapInnerContent = (
    <>
      {mode === 'picker' && (
        <>
          <MapHeaderBar
            mode={mode}
            filteredBusinessesCount={filteredBusinessesCount}
            tileLayer={mapInstance.tileLayer}
            switchTileLayer={mapInstance.switchTileLayer}
            state={state}
            businesses={businesses}
            onGovChange={(gov) => state.handleGovChange(gov, mapInstance.updateSelectedPosition)}
            isLocating={geolocation.isLocating}
            handleGetLocation={geolocation.handleGetLocation}
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
      )}

      <div className={canvasWrapperClasses}>
        <div ref={containerRef} className="w-full h-full cursor-crosshair leaflet-map-canvas touch-none" />

        {/* 🧭 Clean District & Activity Filter Bar (Shows only within Hadayek Al-Ahram area) */}
        {mode === 'view' && (Math.abs(lat - 29.9683) < 0.06 && Math.abs(lng - 31.1002) < 0.06) && (
          <MapModernTopBar
            selectedZone={selectedZone !== undefined ? selectedZone : state.selectedZone}
            onSelectZone={(z) => {
              state.setSelectedZone(z);
              if (onSelectZone) onSelectZone(z);
            }}
            categoryFilter={categoryFilter !== undefined ? categoryFilter : state.mapCategoryFilter}
            onCategoryChange={(cat) => {
              state.setMapCategoryFilter(cat);
              if (onCategoryChange) onCategoryChange(cat);
            }}
            quickCategories={quickCategories}
            filteredBusinessesCount={filteredBusinessesCount}
          />
        )}

        <MapFloatingControls
          mode={mode}
          centerReticleActive={state.centerReticleActive}
          setCenterReticleActive={state.setCenterReticleActive}
          handleZoomIn={mapInstance.handleZoomIn}
          handleZoomOut={mapInstance.handleZoomOut}
          handlePinCenterOfMap={mapInstance.handlePinCenterOfMap}
          handleResetPosition={mapInstance.handleResetPosition}
          handlePan={mapInstance.handlePan}
          tileLayer={mapInstance.tileLayer}
          switchTileLayer={mapInstance.switchTileLayer}
        />

        {mode === 'view' && (
          <MapSelectedBusinessDrawer
            selectedBiz={state.selectedBiz}
            setSelectedBiz={state.setSelectedBiz}
            onSelectBusiness={onSelectBusiness}
          />
        )}
      </div>
    </>
  );

  return (
    <div className="relative w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-100">
      {mapInnerContent}
    </div>
  );
};
