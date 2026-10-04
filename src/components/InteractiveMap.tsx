import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  InteractiveMapProps,
  MapTileLayerType,
  MAP_QUICK_CATEGORIES,
  useMapInstance,
  MapFloatingControls,
} from './map';
import { MapPickerOverlay } from './map/MapPickerOverlay';
import { MapViewTopBarContainer } from './map/MapViewTopBarContainer';
import { MapStatusOverlay } from './map/MapStatusOverlay';
import { MapDrawersCoordinator } from './map/MapDrawersCoordinator';
import { useInteractiveMapController } from './map/hooks/useInteractiveMapController';
import { useMapPinsAndSearch } from './map/hooks/useMapPinsAndSearch';
import { useDirectoryLoad, useDirectorySearchPending } from '../contexts/DirectoryLoadContext';
import { filterBusinessesForMap } from '../utils/hadayekZoneHelper';

export type { InteractiveMapProps, MapTileLayerType };
export { MAP_QUICK_CATEGORIES };

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  searchQuery, onSearchChange, mode = 'view', lat = 29.9683, lng = 31.1002,
  onLocationSelect, businesses = [], searchableBusinesses, onSelectBusiness,
  targetBuilding = null, onSelectBuilding: externalOnSelectBuilding,
  showHadayekGates = true, selectedZone, onSelectZone, categoryFilter, onCategoryChange,
  initialShowBusinesses = false, onToggleBusinessesVisibility, defaultExpanded = false,
  onExploreDirectory, quickCategories, activeRoute: externalActiveRoute, onUpdateRoute,
  onStartNavigation: externalOnStartNavigation, onClearBuilding, onOpenRadar,
  focusedBusiness, onClearFocusedBusiness,
}) => {
  const directoryLoad = useDirectoryLoad();
  const searchPending = useDirectorySearchPending();
  const [mapSearchMode, setMapSearchMode] = useState<'browse' | 'building'>(targetBuilding ? 'building' : 'browse');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    state,
    interactionState,
    selectedBuildingState,
    setSelectedBuildingState,
    navigationTargetState,
    setNavigationTargetState,
    localRoute,
    setLocalRoute,
    handleSearchChange,
    onViewportSnapshotChange,
    setSelectedBusiness,
  } = useInteractiveMapController({
    initialShowBusinesses,
    defaultExpanded,
    selectedZone,
    categoryFilter,
    searchQuery,
    onSearchChange,
    targetBuilding,
    focusedBusiness,
  });

  const activeZone = state.selectedZone;
  const activeCategory = state.mapCategoryFilter;
  const activeSearchQuery = searchQuery ?? interactionState.searchQuery;
  const activeRoute = externalActiveRoute !== undefined ? externalActiveRoute : localRoute;

  const matchingBusinessesCount = useMemo(() => {
    return filterBusinessesForMap(businesses, activeZone || 'all', activeCategory || 'all', state.onlyVerifiedFilter).length;
  }, [businesses, activeZone, activeCategory, state.onlyVerifiedFilter]);

  const mapInstance = useMapInstance({
    containerRef,
    mode,
    lat,
    lng,
    zoomLevel: 14,
    isExpanded: state.isExpanded,
    onLocationSelect,
  });

  const effectiveTargetBuilding =
    targetBuilding ||
    (selectedBuildingState
      ? {
          zoneLetter: selectedBuildingState.zoneLetter,
          buildingNumber: selectedBuildingState.buildingNumber,
          lat: selectedBuildingState.lat,
          lng: selectedBuildingState.lng,
        }
      : null);

  const handleClusteringSelectBusiness = useCallback((biz: any) => {
    setSelectedBuildingState(null);
    setSelectedBusiness(biz);
    if (onSelectBusiness) onSelectBusiness(biz);
  }, [setSelectedBusiness, onSelectBusiness, setSelectedBuildingState]);

  const handleClusteringSelectBuilding = useCallback((bldg: any) => {
    setSelectedBuildingState(bldg);
    setSelectedBusiness(null);
    if (externalOnSelectBuilding) externalOnSelectBuilding(bldg);
  }, [setSelectedBusiness, externalOnSelectBuilding, setSelectedBuildingState]);

  const { geolocation, search } = useMapPinsAndSearch({
    mapInstance,
    state,
    mode,
    businesses,
    showHadayekGates,
    activeZone,
    activeCategory,
    activeSearchQuery,
    effectiveTargetBuilding,
    buildingSearchActive: mapSearchMode === 'building',
    handleClusteringSelectBusiness,
    onSelectZone,
    handleClusteringSelectBuilding,
    activeRoute,
    viewportSnapshot: interactionState.viewport,
    onViewportSnapshotChange,
  });

  const isInitialLoading = businesses.length === 0 && directoryLoad.pending;
  const busy = searchPending || isInitialLoading;
  const [showBusy, setShowBusy] = useState(false);
  useEffect(() => {
    if (!busy) { setShowBusy(false); return; }
    const timer = window.setTimeout(() => setShowBusy(true), 120);
    return () => window.clearTimeout(timer);
  }, [busy]);

  const canvasWrapperClasses = 'relative w-full flex-1 h-full min-h-0 overflow-hidden z-0';

  return (
    <div className="relative w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-100">
      <MapPickerOverlay
        mode={mode}
        filteredBusinessesCount={matchingBusinessesCount}
        tileLayer={mapInstance.tileLayer}
        switchTileLayer={mapInstance.switchTileLayer}
        state={state}
        businesses={businesses}
        isLocating={geolocation.isLocating}
        handleGetLocation={geolocation.handleGetLocation}
        showHadayekGates={showHadayekGates}
        onToggleBusinessesVisibility={onToggleBusinessesVisibility}
        onSelectZone={onSelectZone}
        onCategoryChange={onCategoryChange}
        mapInstance={mapInstance}
        onExploreDirectory={onExploreDirectory}
        search={search}
      />

      <div className={canvasWrapperClasses}>
        <div ref={containerRef} className="w-full h-full cursor-crosshair leaflet-map-canvas touch-none" />

        <MapStatusOverlay
          mapScriptError={mapInstance.mapScriptError}
          onRetryMapScript={mapInstance.retryLoadMap}
          geoError={geolocation.geoError}
          onClearGeoError={geolocation.clearGeoError}
          mode={mode}
          busy={busy}
          showBusy={showBusy}
          searchPending={searchPending}
          directoryLoad={directoryLoad}
          activeCategory={activeCategory}
          activeZone={activeZone}
          matchingBusinessesCount={matchingBusinessesCount}
        />

        <MapViewTopBarContainer
          mode={mode}
          lat={lat}
          lng={lng}
          activeSearchQuery={activeSearchQuery}
          handleSearchChange={handleSearchChange}
          mapSearchMode={mapSearchMode}
          setMapSearchMode={setMapSearchMode}
          setSelectedBuildingState={setSelectedBuildingState}
          onClearBuilding={onClearBuilding}
          effectiveTargetBuilding={effectiveTargetBuilding}
          activeZone={activeZone}
          state={state}
          setNavigationTargetState={setNavigationTargetState}
          setLocalRoute={setLocalRoute}
          onSelectZone={onSelectZone}
          activeCategory={activeCategory}
          onCategoryChange={onCategoryChange}
          quickCategories={quickCategories}
          filteredBusinessesCount={matchingBusinessesCount}
          businesses={businesses}
          searchableBusinesses={searchableBusinesses}
          externalOnSelectBuilding={externalOnSelectBuilding}
          selectedBuildingState={selectedBuildingState}
        />

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
          onLocate={mode === 'view' ? geolocation.handleGetLocation : undefined}
          isLocating={geolocation.isLocating}
        />

        <MapDrawersCoordinator
          mode={mode}
          businesses={businesses}
          selectedBiz={state.selectedBiz}
          isSelectedBizExpandedOnMap={state.isSelectedBizExpandedOnMap}
          onClearFocusedBusiness={onClearFocusedBusiness}
          onSelectBusiness={onSelectBusiness}
          selectedBuildingState={selectedBuildingState}
          onClearBuilding={onClearBuilding}
          onSelectBuildingBusiness={(biz) => {
            state.setSelectedBiz(biz);
            setSelectedBuildingState(null);
          }}
          onOpenRadar={onOpenRadar}
          navigationTargetState={navigationTargetState}
          onSetNavigationTarget={(target) => {
            setNavigationTargetState(target);
            if (externalOnStartNavigation) externalOnStartNavigation(target);
          }}
          onCloseNavigation={() => {
            setNavigationTargetState(null);
            setLocalRoute(null);
            if (onUpdateRoute) onUpdateRoute(null);
          }}
          onUpdateRoute={(route) => {
            setLocalRoute(route);
            if (onUpdateRoute) onUpdateRoute(route);
          }}
          setSelectedBiz={(biz) => state.setSelectedBiz(biz)}
          setSelectedBuildingState={setSelectedBuildingState}
        />
      </div>
    </div>
  );
};
