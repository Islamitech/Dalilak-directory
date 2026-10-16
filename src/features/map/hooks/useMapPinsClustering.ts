import { useState, useEffect, useRef, useMemo } from 'react';
import { Business } from '../../../types';
import { initializeMapPanesAndLayers, type MapLayerGroups } from '../model/mapPanes';
import { buildDistrictsLayer, type DistrictPolygonItem } from '../model/mapDistrictsLayer';
import { sortBusinessesForMap } from '../model/mapBusinessFilter';
import { executePinPipeline } from '../model/mapPinPipeline';
import { syncAuxiliaryLayers, type UseMapPinsClusteringProps } from '../model/mapAuxiliaryLayers';
import { filterBusinessesForMap } from '../../../utils/hadayekZoneHelper';
import { useMapSelectionCamera } from './useMapSelectionCamera';
import { useMapSelectionDismissal } from './useMapSelectionDismissal';

export type { UseMapPinsClusteringProps };

export const useMapPinsClustering = ({
  mapInstance, state, mode = 'view', businesses, showHadayekGates = true,
  selectedZone: selectedZoneProp, categoryFilter: categoryFilterProp, searchQuery,
  targetBuilding, buildingSearchActive = false, onSelectBusiness, onSelectZone,
  onSelectBuilding, onClearFocusedBusiness, onStartBusinessNavigation, activeRoute, viewportSnapshot = null,
  resultsReady = false,
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
  const onSelectZoneRef = useRef(onSelectZone); onSelectZoneRef.current = onSelectZone;
  const onSelectBusinessRef = useRef(onSelectBusiness); onSelectBusinessRef.current = onSelectBusiness;

  const effectiveZone = selectedZoneProp !== undefined ? (selectedZoneProp === 'all' ? '' : selectedZoneProp) : (state.selectedZone === 'all' ? '' : state.selectedZone);
  const effectiveZoneRef = useRef(effectiveZone); effectiveZoneRef.current = effectiveZone;
  const effectiveCategory = categoryFilterProp !== undefined ? categoryFilterProp : state.mapCategoryFilter;

  useEffect(() => {
    if (!mapInstance.leafletMapRef.current || !mapInstance.isMapReady) return;
    layersRef.current = initializeMapPanesAndLayers(mapInstance.leafletMapRef.current);
    if (!layersRef.current) return;
    const { polygons, mask } = buildDistrictsLayer(layersRef.current.districtsLayerGroup, (letter) => {
      const next = effectiveZoneRef.current === letter ? '' : letter;
      state.setSelectedBiz(null);
      state.setSelectedZone(next);
      onSelectZoneRef.current?.(next || 'all');
    });
    districtPolygonsRef.current = polygons;
    maskPolygonRef.current = mask;
    return () => { (layersRef.current?.spiderfyLayerGroup as any)?.__dlSpiderfyManager?.destroy?.(); };
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
      onSelectBusiness: (biz) => (onSelectBusinessRef.current ?? onSelectBusiness)?.(biz),
      onStartBusinessNavigation: (biz) => startBusinessNavigationRef.current?.(biz),
      onClearSelectedBiz: () => { state.setSelectedBiz(null); onClearFocusedBusiness?.(); },
      onSelectZone: (zone) => { state.setSelectedZone(zone); onSelectZoneRef.current?.(zone); },
    });
  }, [effectiveZone, effectiveCategory, buildingSearchActive, targetBuilding, showHadayekGates, state.showGatesLayer, state.showTargetPin, mapInstance.isMapReady, activeRoute, state.selectedBiz, mapInstance.zoomLevel]);

  useMapSelectionDismissal(mode, mapInstance, state.selectedBiz, state.setSelectedBiz, onClearFocusedBusiness);
  useMapSelectionCamera(state.selectedBiz, mapInstance, effectiveZone, mode);
  const sortedBusinesses = useMemo(() => {
    if (activeRoute) return [];
    const mapZoom = viewportSnapshot?.zoom ?? mapInstance.zoomLevel;
    const source = resultsReady
      ? businesses
      : filterBusinessesForMap(businesses, effectiveZone || 'all', effectiveCategory || 'all', state.onlyVerifiedFilter, mapZoom);
    return sortBusinessesForMap(source);
  }, [businesses, effectiveZone, effectiveCategory, state.onlyVerifiedFilter, viewportSnapshot?.zoom, mapInstance.zoomLevel, Boolean(activeRoute), resultsReady]);

  useEffect(() => {
    if (mode !== 'view' || !layersRef.current || !mapInstance.leafletMapRef.current || !mapInstance.isMapReady) {
      (layersRef.current?.spiderfyLayerGroup as any)?.__dlSpiderfyManager?.collapse?.();
      return;
    }
    setIsRendering(true);
    return executePinPipeline({
      map: mapInstance.leafletMapRef.current,
      cardsLayer: layersRef.current.cardsLayerGroup,
      clusterLayer: layersRef.current.clusterLayerGroup,
      spiderfyLayer: layersRef.current.spiderfyLayerGroup,
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
      onSelectBusiness: (b) => {
        state.setSelectedBiz(b);
        if (onSelectBusinessRef.current) onSelectBusinessRef.current(b); else onSelectBusiness?.(b);
      },
      onComplete: () => setIsRendering(false),
    });
  }, [mode, mapInstance.isMapReady, sortedBusinesses, effectiveCategory, effectiveZone, state.selectedBiz?.id, viewportSnapshot]);

  return { isRenderingActivities: isRendering };
};
