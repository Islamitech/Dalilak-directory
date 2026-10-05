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
  onLocationSelect, businesses = [], onSelectBusiness,
  targetBuilding = null, onSelectBuilding: externalOnSelectBuilding,
  showHadayekGates = true, selectedZone, onSelectZone, categoryFilter, onCategoryChange,
  initialShowBusinesses = false, onToggleBusinessesVisibility, defaultExpanded = false,
  onExploreDirectory, activeRoute: externalActiveRoute, onUpdateRoute,
  onStartNavigation: externalOnStartNavigation, onClearBuilding,
  focusedBusiness, onClearFocusedBusiness,
}) => {
  const directoryLoad = useDirectoryLoad();
  const searchPending = useDirectorySearchPending();
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
    buildingSearchActive: Boolean(effectiveTargetBuilding),
    handleClusteringSelectBusiness,
    onSelectZone,
    handleClusteringSelectBuilding,
    onClearFocusedBusiness,
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
        <div ref={containerRef} className="relative w-full h-full cursor-crosshair leaflet-map-canvas touch-none isolate" />

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
          setSelectedBuildingState={setSelectedBuildingState}
          onClearBuilding={onClearBuilding}
          effectiveTargetBuilding={effectiveTargetBuilding}
          activeZone={activeZone}
          state={state}
          businesses={businesses}
          externalOnSelectBuilding={externalOnSelectBuilding}
          selectedBuildingState={selectedBuildingState}
          onViewList={onExploreDirectory}
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
          businessesCount={matchingBusinessesCount}
        />

        <MapDrawersCoordinator
          mode={mode}
          businesses={businesses}
          onSelectBusiness={onSelectBusiness}
          selectedBuildingState={selectedBuildingState}
          onClearBuilding={onClearBuilding}
          onSelectBuildingBusiness={(biz) => {
            state.setSelectedBiz(biz);
            setSelectedBuildingState(null);
          }}
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
          setSelectedBuildingState={setSelectedBuildingState}
        />
      </div>
    </div>
  );
};
