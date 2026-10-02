import React, { useRef, useState, useEffect, useMemo, useCallback, useReducer } from 'react';
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
  BuildingDetailDrawer,
  ZoneScopedSearchBar,
  InAppNavigationDrawer,
  MapFooterBar,
} from './map';
import { useDirectoryLoad, useDirectorySearchPending } from '../contexts/DirectoryLoadContext';
import { Loader2 } from 'lucide-react';
import { filterBusinessesForMap } from '../utils/hadayekZoneHelper';
import { createInitialMapState, mapStateReducer } from './map/state/mapState';

export type { InteractiveMapProps, MapTileLayerType };
export { MAP_QUICK_CATEGORIES };

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  searchQuery,
  onSearchChange,
  mode = 'view',
  lat = 29.9683,
  lng = 31.1002,
  onLocationSelect,
  businesses = [],
  searchableBusinesses,
  onSelectBusiness,
  onEditBusiness,
  heightClass = 'h-[380px]',
  targetBuilding = null,
  onSelectBuilding: externalOnSelectBuilding,
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
  activeRoute: externalActiveRoute,
  onUpdateRoute,
  onStartNavigation: externalOnStartNavigation,
  onClearBuilding,
  onOpenRadar,
  focusedBusiness,
  onClearFocusedBusiness,
}) => {
  const directoryLoad = useDirectoryLoad();
  const searchPending = useDirectorySearchPending();
  const [mapSearchMode, setMapSearchMode] = useState<'browse' | 'building'>(targetBuilding ? 'building' : 'browse');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const legacyState = useMapState({ initialShowBusinesses, defaultExpanded, initialSelectedZone: selectedZone });
  const [interactionState, dispatchMapState] = useReducer(
    mapStateReducer,
    createInitialMapState({ searchQuery: searchQuery || '', selectedZone: selectedZone || '', categoryFilter: categoryFilter || 'all' })
  );
  const setMapZone = useCallback((zone: string) => dispatchMapState({ type: 'zone/set', zone }), []);
  const setMapCategory = useCallback((category: string) => dispatchMapState({ type: 'category/set', category }), []);
  const setSelectedBusiness = useCallback((business: any) => dispatchMapState({ type: 'selection/set', business }), []);
  const setSelectedBusinessExpanded = useCallback((expanded: boolean) => dispatchMapState({ type: 'selection/expand', expanded }), []);
  const handleSearchChange = useCallback((query: string) => {
    dispatchMapState({ type: 'search/set', query });
    onSearchChange?.(query);
  }, [onSearchChange]);
  const state = useMemo(() => ({
    ...legacyState,
    selectedZone: selectedZone !== undefined ? selectedZone : interactionState.selectedZone,
    setSelectedZone: setMapZone,
    mapCategoryFilter: categoryFilter !== undefined ? categoryFilter : interactionState.categoryFilter,
    setMapCategoryFilter: setMapCategory,
    selectedBiz: interactionState.selectedBusiness,
    setSelectedBiz: setSelectedBusiness,
    isSelectedBizExpandedOnMap: interactionState.selectedBusinessExpanded,
    setIsSelectedBizExpandedOnMap: setSelectedBusinessExpanded,
  }), [legacyState, selectedZone, categoryFilter, interactionState, setMapZone, setMapCategory, setSelectedBusiness, setSelectedBusinessExpanded]);

  const activeZone = state.selectedZone;
  const activeCategory = state.mapCategoryFilter;
  const activeSearchQuery = searchQuery ?? interactionState.searchQuery;

  const matchingBusinessesCount = useMemo(() => {
    return filterBusinessesForMap(
      businesses,
      activeZone || 'all',
      activeCategory || 'all',
      state.onlyVerifiedFilter
    ).length;
  }, [businesses, activeZone, activeCategory, state.onlyVerifiedFilter]);

  // Local state for interactive building inspection
  const [selectedBuildingState, setSelectedBuildingState] = useState<{
    buildingNumber: string;
    zoneLetter: string;
    lat: number;
    lng: number;
  } | null>(null);

  // Sync selectedBuildingState with targetBuilding from props
  useEffect(() => {
    if (targetBuilding && targetBuilding.buildingNumber && targetBuilding.zoneLetter) {
      setSelectedBuildingState({
        buildingNumber: targetBuilding.buildingNumber,
        zoneLetter: targetBuilding.zoneLetter,
        lat: targetBuilding.lat || 0,
        lng: targetBuilding.lng || 0,
      });
    } else if (!targetBuilding) {
      setSelectedBuildingState(null);
    }
  }, [targetBuilding]);

  // Local state for in-app navigation target
  const [navigationTargetState, setNavigationTargetState] = useState<{
    title: string;
    lat: number;
    lng: number;
    type: 'building' | 'business';
    details?: string;
  } | null>(null);

  // Local route state
  const [localRoute, setLocalRoute] = useState<{
    origin: { lat: number; lng: number; label: string };
    destination: { lat: number; lng: number; label: string };
  } | null>(null);

  const activeRoute = externalActiveRoute !== undefined ? externalActiveRoute : localRoute;
  const onViewportSnapshotChange = useCallback((viewport: any) => {
    dispatchMapState({ type: 'viewport/set', viewport });
  }, []);

  // Sync state if selectedZone prop changes from parent
  useEffect(() => {
    if (selectedZone !== undefined) {
      setMapZone(selectedZone);
    }
  }, [selectedZone, setMapZone]);

  // Sync state if categoryFilter prop changes from parent
  useEffect(() => {
    if (categoryFilter !== undefined) {
      setMapCategory(categoryFilter);
    }
  }, [categoryFilter, setMapCategory]);

  useEffect(() => {
    if (searchQuery !== undefined) dispatchMapState({ type: 'search/set', query: searchQuery });
  }, [searchQuery]);

  // Sync state if focusedBusiness prop changes from parent
  useEffect(() => {
    if (focusedBusiness) {
      setSelectedBusiness(focusedBusiness);
      legacyState.setShowBusinesses(true);
      setSelectedBuildingState(null);
      setNavigationTargetState(null);
    }
  }, [focusedBusiness, setSelectedBusiness, legacyState.setShowBusinesses]);

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
  }, [setSelectedBusiness, onSelectBusiness]);

  const handleClusteringSelectBuilding = useCallback((bldg: any) => {
    setSelectedBuildingState(bldg);
    setSelectedBusiness(null);
    if (externalOnSelectBuilding) externalOnSelectBuilding(bldg);
  }, [setSelectedBusiness, externalOnSelectBuilding]);

  useMapPinsClustering({
    mapInstance,
    state,
    mode,
    businesses,
    showHadayekGates,
    selectedZone: activeZone,
    categoryFilter: activeCategory,
    searchQuery: activeSearchQuery,
    targetBuilding: effectiveTargetBuilding,
    buildingSearchActive: mapSearchMode === 'building',
    onSelectBusiness: handleClusteringSelectBusiness,
    onSelectZone,
    onSelectBuilding: handleClusteringSelectBuilding,
    activeRoute,
    viewportSnapshot: interactionState.viewport,
    onViewportSnapshotChange,
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

  useEffect(() => {
    if (mapInstance.isMapReady && mapInstance.leafletMapRef.current) {
      const timer = setTimeout(() => {
        mapInstance.leafletMapRef.current?.invalidateSize();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mapInstance.isMapReady]);

  // Precision busy coordinator: active only on user search or first boot with 0 data
  const isInitialLoading = businesses.length === 0 && directoryLoad.pending;
  const busy = searchPending || isInitialLoading;
  const [showBusy, setShowBusy] = useState(false);
  useEffect(() => {
    if (!busy) { setShowBusy(false); return; }
    const timer = window.setTimeout(() => setShowBusy(true), 120);
    return () => window.clearTimeout(timer);
  }, [busy]);

  const filteredBusinessesCount = matchingBusinessesCount;

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

        {/* ⚠️ Leaflet Dynamic Script Load Failure Fallback (U14) */}
        {mapInstance.mapScriptError && (
          <div className="absolute inset-0 z-[1100] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 text-center" dir="rtl" role="alert">
            <div className="max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-red-200 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl font-bold select-none">
                ⚠️
              </div>
              <h3 className="font-bold text-slate-900 text-base">تعذر تحميل محرك الخريطة</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{mapInstance.mapScriptError}</p>
              <button
                type="button"
                onClick={mapInstance.retryLoadMap}
                className="mt-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md active:scale-95 cursor-pointer"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        )}

        {/* 📍 GPS Timeout / Precision Error Feedback (U15) */}
        {geolocation.geoError && (
          <div className="absolute top-20 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[1050] flex justify-center pointer-events-auto" role="alert" dir="rtl">
            <div className="bg-slate-900/95 text-red-300 border border-red-500/40 rounded-2xl px-4 py-2.5 text-xs shadow-2xl flex items-center gap-3 max-w-md backdrop-blur-md">
              <span className="text-base select-none">📍</span>
              <span className="flex-1 leading-snug">{geolocation.geoError}</span>
              <button
                type="button"
                onClick={geolocation.clearGeoError}
                className="px-2.5 py-1 bg-red-950 hover:bg-red-900 border border-red-700/60 rounded-lg text-white font-bold text-[11px] transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}

        {/* 🧭 Clean District & Activity Filter Bar (Shows only within Hadayek Al-Ahram area) */}
        {mode === 'view' && (Math.abs(lat - 29.9683) < 0.06 && Math.abs(lng - 31.1002) < 0.06) && (
          <MapModernTopBar
            searchQuery={activeSearchQuery}
            onSearchQueryChange={handleSearchChange}
            searchMode={mapSearchMode}
            onSearchModeChange={(next) => { setMapSearchMode(next); setSelectedBuildingState(null); onClearBuilding?.(); }}
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
        )}

        {mode === 'view' && ((busy && showBusy) || (!busy && directoryLoad.error)) && (
          <div className="absolute bottom-5 inset-x-3 z-[850] flex justify-center pointer-events-none" role="status" aria-live="polite" aria-atomic="true">
            <div className="flex items-center gap-2 rounded-full bg-white/95 border border-slate-200 px-3 py-2 text-xs text-slate-700 shadow-sm" dir="rtl">
              {busy ? (
                <>
                  <Loader2 size={15} className="animate-spin motion-reduce:animate-none text-amber-600"/>
                  <span>{searchPending ? 'جارٍ تصفية الأنشطة…' : 'جارٍ تجهيز الأنشطة المعتمدة…'}</span>
                </>
              ) : (
                <>
                  <span>{directoryLoad.error}</span>
                  <button type="button" className="pointer-events-auto min-h-11 px-2 text-amber-700 font-bold" onClick={() => window.dispatchEvent(new Event('directory:retry'))}>إعادة المحاولة</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ⚠️ Network / Connection Error Toast Banner (QW-05 / UX-09) */}
        {directoryLoad.error && (
          <div className="absolute top-20 left-4 right-4 sm:left-auto sm:right-4 z-[950] pointer-events-auto transition-all animate-bounce-in">
            <div className="bg-red-950/90 backdrop-blur-md text-red-200 border border-red-500/50 rounded-xl px-4 py-2.5 text-xs font-bold shadow-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-red-400 text-sm">⚠️</span>
                <span>{directoryLoad.error}</span>
              </div>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('directory:retry'))}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/40 rounded-lg px-2.5 py-1 text-[11px] font-black cursor-pointer transition-colors"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        )}

        {/* ⚠️ Empty Category Notice Banner (Non-intrusive lightweight pill) */}
        {mode === 'view' && activeCategory && activeCategory !== 'all' && !directoryLoad.pending && !searchPending && !directoryLoad.error && matchingBusinessesCount === 0 && (
          <div className="absolute bottom-5 left-3 right-16 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[850] pointer-events-none transition-all duration-300">
            <div className="bg-slate-900/90 backdrop-blur-md text-amber-300 border border-amber-500/40 rounded-full px-4 py-1.5 text-xs font-bold shadow-xl flex items-center gap-2 select-none">
              <span className="text-sm">🔍</span>
              <span>لا توجد أنشطة مسجلة في تصنيف &quot;{activeCategory}&quot; {activeZone && activeZone !== 'all' ? `بمنطقة ${activeZone}` : 'حالياً'}</span>
            </div>
          </div>
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
          onLocate={mode === 'view' ? geolocation.handleGetLocation : undefined}
          isLocating={geolocation.isLocating}
        />

        {/* 🏢 Selected Business Bottom Drawer (Visible ONLY in State 1: when biz is selected but pin card is NOT yet expanded) */}
        {mode === 'view' && !navigationTargetState && !selectedBuildingState && state.selectedBiz && !state.isSelectedBizExpandedOnMap && (
          <MapSelectedBusinessDrawer
            selectedBiz={state.selectedBiz}
            setSelectedBiz={(biz) => {
              state.setSelectedBiz(biz);
              if (!biz && onClearFocusedBusiness) {
                onClearFocusedBusiness();
              }
            }}
            onSelectBusiness={onSelectBusiness}
            onStartNavigation={(biz) => {
              const target = {
                title: biz.nameAr,
                lat: biz.lat,
                lng: biz.lng,
                type: 'business' as const,
                details: biz.category,
              };
              setNavigationTargetState(target);
              if (externalOnStartNavigation) externalOnStartNavigation(target);
            }}
          />
        )}

        {/* 🏢 Selected Building Detail Drawer */}
        {mode === 'view' && !navigationTargetState && selectedBuildingState && (
          <BuildingDetailDrawer
            building={selectedBuildingState}
            businesses={businesses}
            onClose={() => {
              setSelectedBuildingState(null);
              if (onClearBuilding) onClearBuilding();
            }}
            onSelectBusiness={(biz) => {
              state.setSelectedBiz(biz);
              setSelectedBuildingState(null);
            }}
            onStartNavigation={(target) => {
              setNavigationTargetState(target);
              if (externalOnStartNavigation) externalOnStartNavigation(target);
            }}
            onOpenRadar={onOpenRadar}
          />
        )}

        {/* 🧭 Interactive In-App Navigation Drawer */}
        {mode === 'view' && navigationTargetState && (
          <InAppNavigationDrawer
            target={navigationTargetState}
            onClose={() => {
              setNavigationTargetState(null);
              setLocalRoute(null);
              if (onUpdateRoute) onUpdateRoute(null);
            }}
            onUpdateRoute={(route) => {
              setLocalRoute(route);
              if (onUpdateRoute) onUpdateRoute(route);
            }}
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
