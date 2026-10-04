import { useState, useEffect, useRef, useMemo } from 'react';
import { Business } from '../../../types';
import { useMapInstance } from './useMapInstance';
import { useMapState } from './useMapState';
import { MapViewportSnapshot } from '../state/mapViewport';
import { initializeMapPanesAndLayers, MapLayerGroups } from '../../../features/map/model/mapPanes';
import { buildDistrictsLayer, DistrictPolygonItem } from '../../../features/map/model/mapDistrictsLayer';
import { ActiveRouteData } from '../../../features/map/model/mapRouteLayer';
import { TargetBuildingData } from '../../../features/map/model/mapTargetBuildingLayer';
import { sortBusinessesForMap } from '../../../features/map/model/mapBusinessFilter';
import { executePinPipeline } from '../../../features/map/model/mapPinPipeline';
import { syncAuxiliaryLayers, UseMapPinsClusteringProps } from '../../../features/map/model/mapAuxiliaryLayers';
import { filterBusinessesForMap } from '../../../utils/hadayekZoneHelper';

export type { UseMapPinsClusteringProps };

export const useMapPinsClustering = ({
  mapInstance, state, mode = 'view', businesses, showHadayekGates = true,
  selectedZone: selectedZoneProp, categoryFilter: categoryFilterProp, searchQuery,
  targetBuilding, buildingSearchActive = false, onSelectBusiness, onSelectZone,
  onSelectBuilding, activeRoute, viewportSnapshot = null,
}: UseMapPinsClusteringProps) => {
  const [isRendering, setIsRendering] = useState(false);
  const layersRef = useRef<MapLayerGroups | null>(null);
  const districtPolygonsRef = useRef<DistrictPolygonItem[]>([]);
  const maskPolygonRef = useRef<any>(null);
  const markersRegistryRef = useRef(new Map<string, { marker: any; biz: Business; iconKey: string }>());
  const clusterRegistry = useRef(new Map<string, any>());
  const selectedMarkerRef = useRef<any>(null);
  const seenMarkers = useRef(new Set<string>());

  const effectiveZone = selectedZoneProp !== undefined ? (selectedZoneProp === 'all' ? '' : selectedZoneProp) : (state.selectedZone === 'all' ? '' : state.selectedZone);
  const effectiveCategory = categoryFilterProp !== undefined ? categoryFilterProp : state.mapCategoryFilter;

  // Initialize panes & district boundaries
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

  // Synchronize auxiliary visual layers (districts highlight, gates, target, route, selected)
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
      isSelectedBizExpandedOnMap: state.isSelectedBizExpandedOnMap,
      selectedMarkerRef,
      onExpandSelectedBiz: () => state.setIsSelectedBizExpandedOnMap(true),
      onSelectBusiness: (biz) => onSelectBusiness?.(biz),
      onClearSelectedBiz: () => state.setSelectedBiz(null),
    });
  }, [
    effectiveZone, effectiveCategory, buildingSearchActive, targetBuilding,
    showHadayekGates, state.showGatesLayer, state.showTargetPin, mapInstance.isMapReady,
    activeRoute, state.selectedBiz, state.isSelectedBizExpandedOnMap,
  ]);

  // Compute businesses filtered for map display
  const sortedBusinesses = useMemo(() => {
    const mapZoom = viewportSnapshot?.zoom ?? mapInstance.zoomLevel;
    const filtered = filterBusinessesForMap(businesses, effectiveZone || 'all', effectiveCategory || 'all', state.onlyVerifiedFilter, mapZoom);
    return sortBusinessesForMap(filtered);
  }, [businesses, effectiveZone, effectiveCategory, state.onlyVerifiedFilter, viewportSnapshot?.zoom, mapInstance.zoomLevel]);

  // Execute pin clustering render pipeline
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
