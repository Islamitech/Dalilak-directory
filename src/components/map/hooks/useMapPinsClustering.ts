import { useState, useEffect, useRef, useMemo } from 'react';
import { Business } from '../../../types';
import { useMapInstance } from './useMapInstance';
import { useMapState } from './useMapState';
import { MapViewportSnapshot } from '../state/mapViewport';
import {
  initializeMapPanesAndLayers,
  type MapLayerGroups,
  buildDistrictsLayer,
  type DistrictPolygonItem,
  type ActiveRouteData,
  type TargetBuildingData,
  sortBusinessesForMap,
  executePinPipeline,
  syncAuxiliaryLayers,
  type UseMapPinsClusteringProps,
} from '../../../features/map';
import { filterBusinessesForMap } from '../../../utils/hadayekZoneHelper';
import { useMapSelectionCamera } from './useMapSelectionCamera';
import { useMapSelectionDismissal } from './useMapSelectionDismissal';

export type { UseMapPinsClusteringProps };

export const useMapPinsClustering = ({
  mapInstance, state, mode = 'view', businesses, showHadayekGates = true,
  selectedZone: selectedZoneProp, categoryFilter: categoryFilterProp, searchQuery,
  targetBuilding, buildingSearchActive = false, onSelectBusiness, onSelectZone,
  onSelectBuilding, onClearFocusedBusiness, onStartBusinessNavigation, activeRoute, viewportSnapshot = null,
}: UseMapPinsClusteringProps) => {
  const [isRendering, setIsRendering] = useState(false);
  const layersRef = useRef<MapLayerGroups | null>(null);
  const districtPolygonsRef = useRef<DistrictPolygonItem[]>([]);
  const maskPolygonRef = useRef<any>(null);
  const markersRegistryRef = useRef(new Map<string, { marker: any; biz: Business; iconKey: string }>());
  const clusterRegistry = useRef(new Map<string, any>());
  const selectedMarkerRef = useRef<any>(null);
  const seenMarkers = useRef(new Set<string>());
  const startBusinessNavigationRef = useRef(onStartBusinessNavigation); startBusinessNavigationRef.current = onStartBusinessNavigation;

  const effectiveZone = selectedZoneProp !== undefined ? (selectedZoneProp === 'all' ? '' : selectedZoneProp) : (state.selectedZone === 'all' ? '' : state.selectedZone);
  const effectiveCategory = categoryFilterProp !== undefined ? categoryFilterProp : state.mapCategoryFilter;

  useEffect(() => {
    if (!mapInstance.leafletMapRef.current || !mapInstance.isMapReady) return;
    layersRef.current = initializeMapPanesAndLayers(mapInstance.leafletMapRef.current);
    if (!layersRef.current) return;
    const { polygons, mask } = buildDistrictsLayer(layersRef.current.districtsLayerGroup, (letter) => {
      state.setSelectedZone(letter);
      onSelectZone?.(letter);
    });
    districtPolygonsRef.current = polygons;
    maskPolygonRef.current = mask;
  }, [mapInstance.isMapReady]);

  useEffect(() => {
    syncAuxiliaryLayers({
      layers: layersRef.current,
      districts: districtPolygonsRef.current,
      mask: maskPolygonRef.current,
      effectiveZone,
      effectiveCategory,
      buildingSearchActive,
      targetBuilding: targetBuilding ?? null,
      showHadayekGates,
      showGatesLayer: state.showGatesLayer,
      showTargetPin: state.showTargetPin,
      onSelectBuilding,
      cameraController: mapInstance.cameraController,
      zoomLevel: mapInstance.zoomLevel,
      activeRoute,
      selectedBiz: state.selectedBiz,
      selectedMarkerRef,
      onSelectBusiness: (biz) => onSelectBusiness?.(biz),
      onStartBusinessNavigation: (biz) => startBusinessNavigationRef.current?.(biz),
      onClearSelectedBiz: () => {
        state.setSelectedBiz(null);
        onClearFocusedBusiness?.();
      },
    });
  }, [
    effectiveZone, effectiveCategory, buildingSearchActive, targetBuilding,
    showHadayekGates, state.showGatesLayer, state.showTargetPin, mapInstance.isMapReady,
    activeRoute, state.selectedBiz,
  ]);

  useMapSelectionDismissal(mode, mapInstance, state.selectedBiz, state.setSelectedBiz, onClearFocusedBusiness);
  useMapSelectionCamera(state.selectedBiz, mapInstance, effectiveZone, mode);

  const sortedBusinesses = useMemo(() => {
    if (activeRoute) return []; // navigating: only the route matters, hide activity pins
    const mapZoom = viewportSnapshot?.zoom ?? mapInstance.zoomLevel;
    const filtered = filterBusinessesForMap(businesses, effectiveZone || 'all', effectiveCategory || 'all', state.onlyVerifiedFilter, mapZoom);
    return sortBusinessesForMap(filtered);
  }, [businesses, effectiveZone, effectiveCategory, state.onlyVerifiedFilter, viewportSnapshot?.zoom, mapInstance.zoomLevel, Boolean(activeRoute)]);

  useEffect(() => {
    if (mode !== 'view' || !layersRef.current || !mapInstance.leafletMapRef.current || !mapInstance.isMapReady) return;
    setIsRendering(true);
    return executePinPipeline({
      map: mapInstance.leafletMapRef.current,
      cardsLayer: layersRef.current.cardsLayerGroup,
      clusterLayer: layersRef.current.clusterLayerGroup,
      clusterRegistry: clusterRegistry.current,
      markersRegistry: markersRegistryRef.current,
      seenMarkers: seenMarkers.current,
      sortedBusinesses,
      selectedBiz: state.selectedBiz,
      effectiveCategoryFilter: effectiveCategory,
      effectiveSelectedZone: effectiveZone,
      searchQuery,
      viewportSnapshot,
      cameraController: mapInstance.cameraController,
      onSelectBusiness: (b) => state.setSelectedBiz(b),
      onComplete: () => setIsRendering(false),
    });
  }, [mode, mapInstance.isMapReady, sortedBusinesses, effectiveZone, effectiveCategory, state.selectedBiz?.id, viewportSnapshot]);

  return { isRenderingActivities: isRendering };
};
