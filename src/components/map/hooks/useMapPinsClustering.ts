import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Business } from '../../../types';
import { HADAYEK_OFFICIAL_DISTRICTS, HADAYEK_OFFICIAL_GATES } from '../../../data/hadayekDistrictsGeoData';
import {
  createLightweightBadgeHtml,
  createExpandedActivityCardHtml,
  createCompactSelectedActivityCardHtml,
  createCompactOverviewBadgeHtml,
  createCompactActivityPinHtml,
  createLightweightClusterHtml,
  createBuildingBadgeHtml,
  createNavigationPinHtml,
  attachCardDomListeners,
} from '../badgeMarkers';
import { isBusinessInHadayekZone, filterBusinessesForMap } from '../../../utils/hadayekZoneHelper';
import { isSearchSelectedBusiness } from '../../../utils/mapSearch';
import { matchesCategoryFilter } from '../../../utils/categoryMatcher';
import { scheduleProgressiveWork } from '../utils/progressiveWork';
import { activityCardScale, groupNearbyActivities } from '../utils/spatialActivityGroups';
import { computeMarkerIconKey } from '../utils/markerReconciliation';
import {
  planCameraTransitionOnZoneChange,
  planCameraTransitionOnBusinessSelect,
  getVisualViewportPadding,
} from '../utils/cameraPlanner';
import { preloadDistrictTiles } from '../../../utils/hadayekTilePreloader';
import { useMapInstance } from './useMapInstance';
import { useMapState } from './useMapState';
import { isLocalPinPresentationZoom } from '../../../utils/mapZoomPolicy';
import { createMapViewportSnapshot, MapViewportSnapshot } from '../state/mapViewport';

export interface UseMapPinsClusteringProps {
  mapInstance: ReturnType<typeof useMapInstance>;
  state: ReturnType<typeof useMapState>;
  mode?: 'picker' | 'view';
  businesses: Business[];
  showHadayekGates?: boolean;
  selectedZone?: string;
  categoryFilter?: string;
  searchQuery?: string;
  buildingSearchActive?: boolean;
  targetBuilding?: {
    zoneLetter?: string;
    buildingNumber?: string;
    lat?: number;
    lng?: number;
  } | null;
  onSelectBusiness?: (biz: Business) => void;
  onSelectZone?: (zoneLetter: string) => void;
  onSelectBuilding?: (building: { buildingNumber: string; zoneLetter: string; lat: number; lng: number }) => void;
  activeRoute?: {
    origin: { lat: number; lng: number; label: string };
    destination: { lat: number; lng: number; label: string };
    points?: [number, number][];
    distanceMeters?: number;
    durationSeconds?: number;
  } | null;
  viewportSnapshot?: MapViewportSnapshot | null;
  onViewportSnapshotChange?: (snapshot: MapViewportSnapshot) => void;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const useMapPinsClustering = ({
  mapInstance,
  state,
  mode = 'view',
  businesses,
  showHadayekGates = true,
  selectedZone: selectedZoneProp,
  categoryFilter: categoryFilterProp,
  searchQuery,
  targetBuilding,
  buildingSearchActive = false,
  onSelectBusiness,
  onSelectZone,
  onSelectBuilding,
  activeRoute,
  viewportSnapshot = null,
  onViewportSnapshotChange,
}: UseMapPinsClusteringProps) => {
  const viewportRevisionRef = useRef(0);
  const isRenderingActivitiesRef = useRef(false);
  const clusterRegistry = useRef(new Map<string, any>());
  const seenMarkers = useRef(new Set<string>());
  const groupingCache = useRef<{ items: Business[]; zoom: number; groups: Business[][] } | null>(null);
  const filterIdentity = `${selectedZoneProp ?? ''}|${categoryFilterProp ?? ''}`;
  useEffect(() => { seenMarkers.current.clear(); }, [filterIdentity]);
  const animateNewMarker = (marker: any, id: string, staggerIndex = 0) => {
    if (seenMarkers.current.has(id)) return;
    seenMarkers.current.add(id);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const delay = Math.min(staggerIndex * 36, 680);
    const triggerPop = () => {
      const el = marker.getElement?.() || (marker as any)._icon;
      if (!el) return;
      const target = (el.querySelector?.('.activity-card-pin, .activity-pin-wrapper, .district-cluster-pin') || el.firstElementChild || el) as HTMLElement;
      if (!target) return;
      if (typeof target.animate === 'function') {
        target.animate(
          [
            { opacity: 0, transform: 'scale(0.25) translateY(14px)' },
            { opacity: 1, transform: 'scale(1.06) translateY(-2px)', offset: 0.65 },
            { opacity: 1, transform: 'scale(1) translateY(0)' },
          ],
          {
            duration: 380,
            delay,
            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            fill: 'backwards',
          }
        );
      } else {
        target.classList.add('animate-marker-spring');
      }
    };
    const immediateEl = marker.getElement?.() || (marker as any)._icon;
    if (immediateEl) {
      triggerPop();
    } else {
      requestAnimationFrame(triggerPop);
    }
  };
  const {
    leafletMapRef,
    isMapReady,
    markersGroupRef,
    pickerMarkerRef,
    accuracyCircleRef,
    currentLat,
    currentLng,
    zoomLevel,
    gpsAccuracy,
    updateSelectedPosition,
  } = mapInstance;

  const {
    showBusinesses,
    selectedGovFilter,
    selectedZone: stateZone,
    mapCategoryFilter: stateCategory,
    onlyVerifiedFilter,
    selectedBiz,
    setSelectedBiz,
    isSelectedBizExpandedOnMap,
    setIsSelectedBizExpandedOnMap,
    setSelectedZone,
    setShowBusinesses,
    showDistrictsOverlay,
    showGatesLayer,
    showTargetPin,
    isInHadayekScope,
  } = state;

  // Single Source of Truth for zone and category
  const effectiveSelectedZone =
    selectedZoneProp !== undefined
      ? selectedZoneProp === 'all'
        ? ''
        : selectedZoneProp
      : stateZone === 'all'
      ? ''
      : stateZone;

  const effectiveCategoryFilter =
    categoryFilterProp !== undefined ? categoryFilterProp : stateCategory;

  const districtPolygonsRef = useRef<Array<{ letterAr: string; polygon: any; color: string }>>([]);
  const maskPolygonRef = useRef<any>(null);

  // Dedicated LayerGroups for strict rendering isolation
  const districtsLayerGroupRef = useRef<any>(null);
  const cardsLayerGroupRef = useRef<any>(null);
  const clusterLayerGroupRef = useRef<any>(null);
  const selectedLayerGroupRef = useRef<any>(null);
  const gatesLayerGroupRef = useRef<any>(null);
  const targetLayerGroupRef = useRef<any>(null);
  const routeLayerGroupRef = useRef<any>(null);

  // Stable persistent Marker Registry for reconciliation (businessId -> marker data)
  const markersRegistryRef = useRef<Map<string, { marker: any; biz: Business; iconKey: string }>>(new Map());
  const selectedMarkerRef = useRef<any>(null);
  const clusterMarkerRef = useRef<any>(null);

  // Single Camera Movement Coordinator state
  const cameraTransitionTokenRef = useRef<number>(0);
  const previousSelectedZoneRef = useRef<string>(effectiveSelectedZone);
  const lastFlownTargetRef = useRef<string | null>(null);
  const lastSelectedBizIdRef = useRef<string | null>(null);
  const preSelectedStateRef = useRef<{ center: [number, number]; zoom: number } | null>(null);
  const isCameraFlyingRef = useRef<boolean>(false);
  const flightSettlingTimerRef = useRef<number | null>(null);

  const onSelectBusinessRef = useRef(onSelectBusiness);
  onSelectBusinessRef.current = onSelectBusiness;

  const onSelectBuildingRef = useRef(onSelectBuilding);
  onSelectBuildingRef.current = onSelectBuilding;

  const onSelectZoneRef = useRef(onSelectZone);
  onSelectZoneRef.current = onSelectZone;

  const selectedBizRef = useRef(selectedBiz);
  selectedBizRef.current = selectedBiz;

  const setSelectedBizRef = useRef(setSelectedBiz);
  setSelectedBizRef.current = setSelectedBiz;

  const activeWorkCleanupRef = useRef<(() => void) | null>(null);
  const lastRenderedFilterRef = useRef<{ category?: string; zone?: string }>({
    category: effectiveCategoryFilter,
    zone: effectiveSelectedZone,
  });
  const updateViewportSnapshot = useCallback((map: any) => {
    if (!map) return;
    const snapshot = createMapViewportSnapshot(map, ++viewportRevisionRef.current);
    onViewportSnapshotChange?.(snapshot);
  }, [onViewportSnapshotChange]);

  const markCameraFlight = useCallback((map: any) => {
    try {
      const container = map?.getContainer?.();
      if (!container) return;
      isCameraFlyingRef.current = true;
      if (flightSettlingTimerRef.current !== null) {
        window.clearTimeout(flightSettlingTimerRef.current);
        flightSettlingTimerRef.current = null;
      }
      container.classList.remove('is-camera-settling');
      container.classList.add('is-camera-flying');

      const onFlightEnd = () => {
        container.classList.remove('is-camera-flying');
        container.classList.add('is-camera-settling');
        flightSettlingTimerRef.current = window.setTimeout(() => {
          isCameraFlyingRef.current = false;
          container.classList.remove('is-camera-settling');
          flightSettlingTimerRef.current = null;
          updateViewportSnapshot(map);
        }, 160);
      };
      map.once('moveend', onFlightEnd);
    } catch {}
  }, [updateViewportSnapshot]);

  // Handler to select district
  const handleSelectDistrict = useCallback((letter: string) => {
    setSelectedZone(letter);
    if (onSelectZoneRef.current) onSelectZoneRef.current(letter);
  }, [setSelectedZone]);

  // Global handler for popup action button
  useEffect(() => {
    (window as any).__selectHadayekDistrict = (letter: string) => {
      handleSelectDistrict(letter);
      setShowBusinesses(true);
    };
    return () => {
      delete (window as any).__selectHadayekDistrict;
    };
  }, [handleSelectDistrict, setShowBusinesses]);

  // Cleanup selected business if it no longer matches the current zone or category filters
  useEffect(() => {
    if (!selectedBiz) return;
    const isExplicitSearchSelection = isSearchSelectedBusiness(selectedBiz, searchQuery || '');
    if (isExplicitSearchSelection) return;
    const hasCategoryFilter = Boolean(effectiveCategoryFilter && effectiveCategoryFilter !== 'all' && effectiveCategoryFilter.trim() !== '');
    if (hasCategoryFilter) {
      if (!matchesCategoryFilter(selectedBiz, effectiveCategoryFilter)) {
        setSelectedBizRef.current(null);
        return;
      }
    }
    const hasActiveZone = Boolean(effectiveSelectedZone && effectiveSelectedZone.trim() !== '');
    if (hasActiveZone && !isBusinessInHadayekZone(selectedBiz, effectiveSelectedZone)) {
      setSelectedBizRef.current(null);
    }
  }, [effectiveSelectedZone, effectiveCategoryFilter, selectedBiz, searchQuery]);

  // 1. 🛡️ Initialize Dedicated Leaflet Panes and LayerGroups ONCE on map ready
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady || !window.L) return;

    // Ensure custom panes exist with clear z-index order
    if (!map.getPane('maskPane')) {
      const maskPane = map.createPane('maskPane');
      maskPane.style.zIndex = '350';
      maskPane.style.pointerEvents = 'none';
    }
    if (!map.getPane('districtsPane')) {
      const districtsPane = map.createPane('districtsPane');
      districtsPane.style.zIndex = '360';
    }
    if (!map.getPane('districtLabelsPane')) {
      const districtLabelsPane = map.createPane('districtLabelsPane');
      districtLabelsPane.style.zIndex = '460';
    }
    if (!map.getPane('pinsPane')) {
      const pinsPane = map.createPane('pinsPane');
      pinsPane.style.zIndex = '600';
    }
    if (!map.getPane('selectedPinPane')) {
      const selectedPinPane = map.createPane('selectedPinPane');
      selectedPinPane.style.zIndex = '700';
    }

    if (!districtsLayerGroupRef.current || !map.hasLayer(districtsLayerGroupRef.current)) {
      if (districtsLayerGroupRef.current) {
        try { districtsLayerGroupRef.current.remove(); } catch {}
      }
      districtsLayerGroupRef.current = window.L.layerGroup([], { pane: 'districtsPane' }).addTo(map);
    }

    if (!cardsLayerGroupRef.current || !map.hasLayer(cardsLayerGroupRef.current)) {
      if (cardsLayerGroupRef.current) {
        try { cardsLayerGroupRef.current.remove(); } catch {}
      }
      cardsLayerGroupRef.current = window.L.layerGroup([], { pane: 'pinsPane' }).addTo(map);
    }

    if (!clusterLayerGroupRef.current || !map.hasLayer(clusterLayerGroupRef.current)) {
      if (clusterLayerGroupRef.current) {
        try { clusterLayerGroupRef.current.remove(); } catch {}
      }
      clusterLayerGroupRef.current = window.L.layerGroup([], { pane: 'pinsPane' }).addTo(map);
    }

    if (!selectedLayerGroupRef.current || !map.hasLayer(selectedLayerGroupRef.current)) {
      if (selectedLayerGroupRef.current) {
        try { selectedLayerGroupRef.current.remove(); } catch {}
      }
      selectedLayerGroupRef.current = window.L.layerGroup([], { pane: 'selectedPinPane' }).addTo(map);
    }

    if (!gatesLayerGroupRef.current || !map.hasLayer(gatesLayerGroupRef.current)) {
      if (gatesLayerGroupRef.current) {
        try { gatesLayerGroupRef.current.remove(); } catch {}
      }
      gatesLayerGroupRef.current = window.L.layerGroup([], { pane: 'districtsPane' }).addTo(map);
    }

    if (!targetLayerGroupRef.current || !map.hasLayer(targetLayerGroupRef.current)) {
      if (targetLayerGroupRef.current) {
        try { targetLayerGroupRef.current.remove(); } catch {}
      }
      targetLayerGroupRef.current = window.L.layerGroup([], { pane: 'selectedPinPane' }).addTo(map);
    }

    if (!routeLayerGroupRef.current || !map.hasLayer(routeLayerGroupRef.current)) {
      if (routeLayerGroupRef.current) {
        try { routeLayerGroupRef.current.remove(); } catch {}
      }
      routeLayerGroupRef.current = window.L.layerGroup([], { pane: 'districtsPane' }).addTo(map);
    }
  }, [isMapReady]);

  // 2. 🗺️ Create Hadayek Districts Layout, Polygons & Markers ONCE on map ready
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady || !window.L || !districtsLayerGroupRef.current) return;

    const districtsLayer = districtsLayerGroupRef.current;
    districtsLayer.clearLayers();
    districtPolygonsRef.current = [];

    // World envelope for inverted spotlight focus mask
    const worldRing: [number, number][] = [
      [35.0, 25.0],
      [35.0, 37.0],
      [25.0, 37.0],
      [25.0, 25.0],
    ];

    // Create persistent inverted mask polygon on maskPane (interactive: false)
    const mask = window.L.polygon([worldRing], {
      pane: 'maskPane',
      stroke: false,
      fillColor: '#090d16',
      fillOpacity: 0.0,
      fillRule: 'evenodd',
      interactive: false,
      className: 'hadayek-spotlight-focus-mask',
    });
    districtsLayer.addLayer(mask);
    maskPolygonRef.current = mask;

    // Create polygons and markers for all districts once
    HADAYEK_OFFICIAL_DISTRICTS.forEach((district) => {
      // Cadastral boundary polygons
      district.polygons.forEach((polyCoords) => {
        const polygon = window.L.polygon(polyCoords, {
          pane: 'districtsPane',
          color: district.color,
          weight: 0.8,
          opacity: 0.3,
          fillColor: district.color,
          fillOpacity: 0,
          className: 'hadayek-district-polygon',
        });

        polygon.on('click', () => {
          handleSelectDistrict(district.letterAr);
        });

        districtsLayer.addLayer(polygon);
        districtPolygonsRef.current.push({ letterAr: district.letterAr, polygon, color: district.color });
      });

    });

    return () => {
      districtsLayer.clearLayers();
      districtPolygonsRef.current = [];
      maskPolygonRef.current = null;
    };
  }, [isMapReady, handleSelectDistrict]);

  // 2b. 🎨 Update District Styles & Spotlight Mask without recreating nodes + Single Camera Transition Owner
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady || !window.L) return;

    const updateDistrictHighlightStyles = (zoneLetter: string) => {
      const isTargetActive = Boolean(zoneLetter && zoneLetter.trim() !== '');
      const shouldHighlight = isTargetActive && !buildingSearchActive && !targetBuilding && (!effectiveCategoryFilter || effectiveCategoryFilter === 'all');

      // 1. Update Inverted Spotlight Mask
      if (maskPolygonRef.current) {
        if (shouldHighlight) {
          const activeDistrict = HADAYEK_OFFICIAL_DISTRICTS.find((d) => d.letterAr === zoneLetter);
          if (activeDistrict && activeDistrict.polygons && activeDistrict.polygons.length > 0) {
            const worldRing: [number, number][] = [
              [35.0, 25.0],
              [35.0, 37.0],
              [25.0, 37.0],
              [25.0, 25.0],
            ];
            maskPolygonRef.current.setLatLngs([worldRing, ...activeDistrict.polygons]);
            maskPolygonRef.current.setStyle({ fillOpacity: 0.04 });
          } else {
            maskPolygonRef.current.setStyle({ fillOpacity: 0.0 });
          }
        } else {
          maskPolygonRef.current.setStyle({ fillOpacity: 0.0 });
        }
      }

      // 2. Update styles for each district polygon
      districtPolygonsRef.current.forEach(({ letterAr, polygon, color }) => {
        const isSelected = isTargetActive && letterAr === zoneLetter;
        const path = (polygon as any)._path as SVGElement | undefined;
        if (isSelected) {
          polygon.setStyle({
            color: '#d97706',
            weight: 2.5,
            opacity: 1.0,
            fillColor: '#f59e0b',
            fillOpacity: 0.0,
          });
          if (path) {
            path.classList.add('selected-district-polygon-focus');
          }
        } else {
          polygon.setStyle({
            color,
            weight: 0.8,
            opacity: shouldHighlight ? 0.0 : 0.25,
            fillColor: color,
            fillOpacity: 0,
          });
          if (path) {
            path.classList.remove('selected-district-polygon-focus');
          }
        }
      });
    };

    // 4. 🚀 Single Owner Camera Transition for District Selection/Clearing
    const currentZoom = map.getZoom();
    const decision = planCameraTransitionOnZoneChange(
      previousSelectedZoneRef.current,
      effectiveSelectedZone,
      HADAYEK_OFFICIAL_DISTRICTS,
      currentZoom
    );

    if (decision.shouldMove) {
      previousSelectedZoneRef.current = effectiveSelectedZone;
      ++cameraTransitionTokenRef.current;

      const isMobile = map.getSize().x < 640;
      const viewportPadding = getVisualViewportPadding(isMobile, false);

      if (decision.type === 'zone' && decision.targetBounds) {
        try {
          preloadDistrictTiles(effectiveSelectedZone, decision.targetBounds);
          const bounds = window.L.latLngBounds(decision.targetBounds);

          // Update highlight continuously to destination zone (NO 450ms blink-out!)
          updateDistrictHighlightStyles(effectiveSelectedZone);

          const duration = decision.flightMode === 'parabolic-arc'
            ? (decision.totalDuration || 1.25)
            : (decision.totalDuration || 1.15);

          markCameraFlight(map);
          if (typeof map.flyToBounds === 'function') {
            mapInstance.cameraController?.request({ kind: 'flyToBounds', bounds, options: {
              paddingTopLeft: viewportPadding.paddingTopLeft,
              paddingBottomRight: viewportPadding.paddingBottomRight,
              maxZoom: 16.5,
              duration,
              easeLinearity: 0.25,
            } }, 'zone');
          } else {
            mapInstance.cameraController?.request({ kind: 'fitBounds', bounds, options: {
              paddingTopLeft: viewportPadding.paddingTopLeft,
              paddingBottomRight: viewportPadding.paddingBottomRight,
              maxZoom: 16.5,
              animate: true,
            } }, 'zone');
          }
        } catch {}
      } else if (decision.type === 'overview' && decision.targetCenter) {
        try {
          updateDistrictHighlightStyles('');
          markCameraFlight(map);
          mapInstance.cameraController?.request({ kind: 'flyTo', center: decision.targetCenter, zoom: decision.targetZoom || 14, options: {
            duration: decision.totalDuration || 1.1,
            easeLinearity: 0.25,
          } }, 'zone');
        } catch {}
      }
    } else {
      updateDistrictHighlightStyles(effectiveSelectedZone);
    }
  }, [effectiveSelectedZone, effectiveCategoryFilter, buildingSearchActive, targetBuilding, isMapReady]);

  // 2c. 🖱️ Map Background Click Deselects Active Activity & Restores Top 3 Cards
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady) return;

    const handleMapClick = () => {
      if (mode !== 'view') return;
      if (selectedBizRef.current) {
        setSelectedBizRef.current(null);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isMapReady, mode]);

  // 2d. 📍 Selected Activity Camera Centering & Pre-State Restoration
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady) return;

    if (!selectedBiz) {
      lastSelectedBizIdRef.current = null;
      // Camera Autonomy on Deselect (BEH-02 / SAFETY-06):
      // Keep camera stable at current position where user panned; do not snap backward.
      preSelectedStateRef.current = null;
      return;
    }

    if (lastSelectedBizIdRef.current === selectedBiz.id && !isSelectedBizExpandedOnMap) return;
    lastSelectedBizIdRef.current = selectedBiz.id;

    // Save map center and zoom BEFORE centering on the selected business
    if (!preSelectedStateRef.current) {
      preSelectedStateRef.current = {
        center: [map.getCenter().lat, map.getCenter().lng],
        zoom: map.getZoom(),
      };
    }

    const currentZoom = map.getZoom();
    const isMobile = map.getSize().x < 640;

    const decision = planCameraTransitionOnBusinessSelect(
      null, // force evaluation for active selectedBiz
      selectedBiz.id,
      { lat: selectedBiz.lat, lng: selectedBiz.lng },
      currentZoom,
      isSelectedBizExpandedOnMap
    );

    if (decision.shouldMove && decision.targetCenter) {
      try {
        cameraTransitionTokenRef.current++;
        if (decision.flightMode === 'pan-center') {
          // In State 1 at City Overview: keep overview zoom, pan smoothly with vertical offset
          const targetLat = isMobile ? selectedBiz.lat - 0.0035 : selectedBiz.lat;
          mapInstance.cameraController?.request({ kind: 'panTo', center: [targetLat, selectedBiz.lng], options: {
            animate: true,
            duration: decision.totalDuration || 0.6,
          } }, 'selection');
        } else {
          // Local zoom / State 2
          const targetLat = isMobile && !isSelectedBizExpandedOnMap ? selectedBiz.lat - 0.0015 : selectedBiz.lat;
          markCameraFlight(map);
          mapInstance.cameraController?.request({ kind: 'flyTo', center: [targetLat, selectedBiz.lng], zoom: decision.targetZoom || 17, options: {
            duration: decision.totalDuration || 0.65,
            easeLinearity: 0.25,
          } }, 'selection');
        }
      } catch {}
    }
  }, [selectedBiz, isSelectedBizExpandedOnMap, isMapReady]);

  // 3. 🏢 Precision Target Building Pin
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady || !window.L || !targetLayerGroupRef.current) return;

    const targetLayer = targetLayerGroupRef.current;
    targetLayer.clearLayers();

    if (!targetBuilding || !showTargetPin || typeof targetBuilding.lat !== 'number' || typeof targetBuilding.lng !== 'number') {
      lastFlownTargetRef.current = null;
      return;
    }

    const bldgNum = targetBuilding.buildingNumber || '1';
    const zoneLet = targetBuilding.zoneLetter || '';
    const bldgLabel = bldgNum ? `عمارة ${bldgNum}` : 'المبنى المحدد';

    const bldgHtml = `
      <div style="position: relative; width: 140px; height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; cursor: pointer; user-select: none; font-family: 'Cairo', sans-serif; pointer-events: auto;">
        <div style="background: rgba(15, 23, 42, 0.95); border: 2px solid #ef4444; border-radius: 9999px; padding: 3px 9px; display: flex; align-items: center; gap: 5px; box-shadow: 0 4px 14px rgba(0,0,0,0.5), 0 0 10px rgba(239,68,68,0.4); white-space: nowrap; margin-bottom: 2px;">
          <span style="font-size: 11px;">🏢</span>
          <span style="color: #ffffff; font-weight: 800; font-size: 11px;">${escapeHtml(bldgLabel)}</span>
          ${zoneLet ? `<span style="color: #cbd5e1; font-weight: 700; font-size: 9px; border-right: 1px solid #475569; padding-right: 4px; margin-right: 2px;">منطقة ${escapeHtml(zoneLet)}</span>` : ''}
        </div>
        <div style="width: 2px; height: 8px; background: #ef4444; box-shadow: 0 0 4px #ef4444;"></div>
        <div style="width: 10px; height: 10px; border-radius: 50%; background: #ef4444; border: 2px solid #ffffff; box-shadow: 0 0 8px #ef4444, 0 0 0 2px rgba(239, 68, 68, 0.35); flex-shrink: 0;"></div>
      </div>
    `;

    const bldgIcon = window.L.divIcon({
      className: 'custom-precision-building-pin',
      html: bldgHtml,
      iconSize: [140, 50],
      iconAnchor: [70, 50],
    });

    const marker = window.L.marker([targetBuilding.lat, targetBuilding.lng], {
      icon: bldgIcon,
      pane: 'pinsPane',
      zIndexOffset: 2000,
    });

    marker.on('click', () => {
      if (onSelectBuildingRef.current) {
        onSelectBuildingRef.current({
          buildingNumber: bldgNum,
          zoneLetter: zoneLet,
          lat: targetBuilding.lat!,
          lng: targetBuilding.lng!,
        });
      }
    });

    targetLayer.addLayer(marker);

    const targetKey = `${zoneLet}_${bldgNum}_${targetBuilding.lat}_${targetBuilding.lng}`;
    if (lastFlownTargetRef.current !== targetKey) {
      lastFlownTargetRef.current = targetKey;
      try {
        mapInstance.cameraController?.request({ kind: 'flyTo', center: [targetBuilding.lat, targetBuilding.lng], zoom: Math.max(map.getZoom(), 17), options: { duration: 0.7 } }, 'building');
      } catch {}
    }
  }, [isMapReady, targetBuilding, showTargetPin]);

  // 4. 🧭 In-App Route Polyline & Pins Effect
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady || !window.L || !routeLayerGroupRef.current) return;

    const routeLayer = routeLayerGroupRef.current;
    routeLayer.clearLayers();

    if (!activeRoute || !activeRoute.origin || !activeRoute.destination) return;

    const { origin, destination } = activeRoute;

    const routePoints: [number, number][] =
      activeRoute.points && activeRoute.points.length > 1
        ? activeRoute.points
        : [
            [origin.lat, origin.lng],
            [destination.lat, destination.lng],
          ];

    const glowLine = window.L.polyline(routePoints, {
      color: '#f59e0b',
      weight: 8,
      opacity: 0.45,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false,
    });
    routeLayer.addLayer(glowLine);

    const routeLine = window.L.polyline(routePoints, {
      color: '#d97706',
      weight: 4.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false,
    });
    routeLayer.addLayer(routeLine);

    const originPinData = createNavigationPinHtml('origin', origin.label);
    const originIcon = window.L.divIcon({
      className: 'route-origin-pin',
      html: originPinData.html,
      iconSize: originPinData.iconSize,
      iconAnchor: originPinData.iconAnchor,
    });
    const originMarker = window.L.marker([origin.lat, origin.lng], {
      icon: originIcon,
      pane: 'pinsPane',
      zIndexOffset: 1500,
    });
    routeLayer.addLayer(originMarker);

    const destPinData = createNavigationPinHtml('destination', destination.label);
    const destIcon = window.L.divIcon({
      className: 'route-dest-pin',
      html: destPinData.html,
      iconSize: destPinData.iconSize,
      iconAnchor: destPinData.iconAnchor,
    });
    const destMarker = window.L.marker([destination.lat, destination.lng], {
      icon: destIcon,
      pane: 'pinsPane',
      zIndexOffset: 1510,
    });
    routeLayer.addLayer(destMarker);

    try {
      const bounds = window.L.latLngBounds(routePoints);
      mapInstance.cameraController?.request({ kind: 'flyToBounds', bounds, options: { padding: [80, 80], maxZoom: 16.5, duration: 0.8 } }, 'route');
    } catch {}
  }, [isMapReady, activeRoute]);

  // 4b. 🚪 Hadayek Official Gates
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady || !window.L || !gatesLayerGroupRef.current) return;

    const gatesLayer = gatesLayerGroupRef.current;
    gatesLayer.clearLayers();

    if (!showHadayekGates || !showGatesLayer) return;

    HADAYEK_OFFICIAL_GATES.forEach((gate) => {
      const gateHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; cursor: pointer; user-select: none;">
          <div style="background: #4f46e5; color: #ffffff; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; box-shadow: 0 1.5px 4px rgba(0,0,0,0.4); font-family: 'Arial', sans-serif;">${gate.number || '🚪'}</div>
          <div style="color: #312e81; font-family: 'Cairo', system-ui, sans-serif; font-weight: 800; font-size: 12px; text-shadow: -1.5px -1.5px 0 #ffffff, 1.5px -1.5px 0 #ffffff, -1.5px 1.5px 0 #ffffff, 1.5px 1.5px 0 #ffffff, 0 2px 4px rgba(0,0,0,0.3); white-space: nowrap; letter-spacing: -0.2px;">${escapeHtml(gate.popularNameAr || gate.shortNameAr)}</div>
        </div>
      `;

      const gateIcon = window.L.divIcon({
        className: 'custom-gate-pin-native',
        html: gateHtml,
        iconSize: [100, 40],
        iconAnchor: [50, 10],
      });

      const gateMarker = window.L.marker([gate.lat, gate.lng], {
        icon: gateIcon,
        pane: 'pinsPane',
        zIndexOffset: 400,
      });
      gateMarker.bindPopup(`
        <div dir="rtl" style="font-family: 'Cairo', system-ui, sans-serif; text-align: right; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            <span style="background: #4f46e5; color: #fff; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900;">${gate.number || '🚪'}</span>
            <b style="color: #1e1b4b; font-size: 13px;">${escapeHtml(gate.nameAr)}</b>
          </div>
          <p style="margin: 4px 0; font-size: 11px; color: #475569; line-height: 1.4;"><b>🛣️ الطريق:</b> ${escapeHtml(gate.accessRoadAr)}</p>
          <p style="margin: 4px 0; font-size: 11px; color: #047857; line-height: 1.4;"><b>🎯 تخدم مناطق:</b> ${escapeHtml(gate.servedZones.join('، '))}</p>
          <div style="margin-top: 8px;">
            <a href="https://www.google.com/maps/dir/?api=1&destination=${gate.lat},${gate.lng}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 4px; background: #4f46e5; color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; text-decoration: none;">
              <span>📍 الاتجاهات عبر Google Maps</span>
            </a>
          </div>
        </div>
      `);
      gatesLayer.addLayer(gateMarker);
    });
  }, [showHadayekGates, showGatesLayer, isMapReady]);

  // 5. 📍 Picker Mode Pin
  useEffect(() => {
    if (mode !== 'picker') return;
    const map = leafletMapRef.current;
    const markersGroup = markersGroupRef.current;

    if (!map || !markersGroup || !isMapReady || !window.L) return;

    markersGroup.clearLayers();

    const pickerIcon = window.L.divIcon({
      className: 'custom-picker-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab; user-select: none;">
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #020617; font-weight: 900; font-size: 11px; padding: 3px 10px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(0,0,0,0.6); white-space: nowrap; border: 1.5px solid #fef08a; margin-bottom: 2px; display: inline-flex; align-items: center; gap: 4px; font-family: Cairo, sans-serif;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#020617" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
            <span>موقع المنشأة المحدد</span>
          </div>
          <div style="position: relative; width: 36px; height: 46px; display: flex; justify-content: center;">
            <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">
              <path d="M18 0C8.05887 0 0 8.05887 0 18C0 30.5 18 46 18 46C18 46 36 30.5 36 18C36 8.05887 27.9411 0 18 0Z" fill="#F59E0B"/>
              <path d="M18 2C9.16344 2 2 9.16344 2 18C2 29.2 18 43.5 18 43.5C18 43.5 34 29.2 34 18C34 9.16344 26.8366 2 18 2Z" stroke="#FEF08A" stroke-width="1.5"/>
              <circle cx="18" cy="18" r="8" fill="#0F172A"/>
              <circle cx="18" cy="18" r="4" fill="#F59E0B"/>
              <circle cx="18" cy="18" r="1.5" fill="#FFFFFF"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [36, 68],
      iconAnchor: [18, 68],
    });

    const marker = window.L.marker([currentLat, currentLng], {
      icon: pickerIcon,
      pane: 'pinsPane',
      draggable: true,
      autoPan: true,
    });

    marker.on('dragend', (e: any) => {
      const ll = e.target.getLatLng();
      updateSelectedPosition(ll.lat, ll.lng, false);
    });

    markersGroup.addLayer(marker);
    pickerMarkerRef.current = marker;

    if (gpsAccuracy && gpsAccuracy < 500) {
      if (accuracyCircleRef.current) {
        markersGroup.removeLayer(accuracyCircleRef.current);
      }
      const circle = window.L.circle([currentLat, currentLng], {
        radius: gpsAccuracy,
        color: '#38bdf8',
        fillColor: '#38bdf8',
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: '4, 4',
      });
      markersGroup.addLayer(circle);
      accuracyCircleRef.current = circle;
    }
  }, [mode, isMapReady, currentLat, currentLng, gpsAccuracy, updateSelectedPosition]);

  // 6. 📍 View Mode: Render Businesses with Smart Reconciliation & Screen-Space Dispersal
  const visibleBusinesses = useMemo(() => {
    if (mode !== 'view') return [];
    const hasCategory = Boolean(effectiveCategoryFilter && effectiveCategoryFilter !== 'all' && effectiveCategoryFilter.trim() !== '');
    const hasSearch = Boolean(searchQuery && searchQuery.trim() !== '');
    if (!hasCategory && !hasSearch) return [];

    const map = leafletMapRef.current;
    const viewportZoom = viewportSnapshot?.zoom ?? mapInstance.zoomLevel;
    return filterBusinessesForMap(
      businesses,
      effectiveSelectedZone || 'all',
      hasCategory ? effectiveCategoryFilter : 'all',
      onlyVerifiedFilter,
      typeof viewportZoom === 'number' ? viewportZoom : undefined
    );
  }, [mode, businesses, effectiveSelectedZone, effectiveCategoryFilter, onlyVerifiedFilter, searchQuery, isMapReady, viewportSnapshot, mapInstance.zoomLevel]);

  const sortedBusinesses = useMemo(() => {
    return [...visibleBusinesses].sort((a, b) => {
      const scoreA =
        (a.verificationStatus === 'verified' ? 100 : 0) +
        ((a.googleRating || a.rating || 0) * 10) +
        (a.isFeatured ? 50 : 0) +
        (a.videoUrl ? 15 : 0) +
        ((a.photos?.length || 0) * 2);
      const scoreB =
        (b.verificationStatus === 'verified' ? 100 : 0) +
        ((b.googleRating || b.rating || 0) * 10) +
        (b.isFeatured ? 50 : 0) +
        (b.videoUrl ? 15 : 0) +
        ((b.photos?.length || 0) * 2);
      if (scoreB !== scoreA) return scoreB - scoreA;

      const reviewsA = a.googleReviewsCount || 0;
      const reviewsB = b.googleReviewsCount || 0;
      if (reviewsB !== reviewsA) return reviewsB - reviewsA;

      const dateA = a.createdDate || '';
      const dateB = b.createdDate || '';
      if (dateB !== dateA) return dateB.localeCompare(dateA);

      // 🛡️ Deterministic tie-breaker: guarantees 100% stable ranking across renders
      return a.id.localeCompare(b.id);
    });
  }, [visibleBusinesses]);

  // 5b. 🏢 Dedicated Selected Activity Marker Effect (Strictly isolated on selectedPinPane)
  useEffect(() => {
    if (mode !== 'view') return;
    const map = leafletMapRef.current;
    if (!map || !isMapReady || !window.L) return;

    const selectedLayer = selectedLayerGroupRef.current;
    if (!selectedLayer) return;

    if (!selectedBiz) {
      if (selectedMarkerRef.current) {
        selectedLayer.clearLayers();
        selectedMarkerRef.current = null;
      }
      return;
    }

    const isExpanded = isSelectedBizExpandedOnMap;
    const cardData = isExpanded
      ? createExpandedActivityCardHtml(selectedBiz)
      : createCompactSelectedActivityCardHtml(selectedBiz);

    const bizIcon = window.L.divIcon({
      className: `custom-biz-pin ${isExpanded ? 'selected-expanded-card' : 'selected-compact-card'} animate-scale-in`,
      html: cardData.html,
      iconSize: cardData.iconSize,
      iconAnchor: cardData.iconAnchor,
    });

    const handleCardClick = () => {
      if (!isExpanded) {
        // State 1 -> State 2: Smooth camera zoom and transform into expanded card
        try {
          cameraTransitionTokenRef.current++;
          mapInstance.cameraController?.request({ kind: 'flyTo', center: [selectedBiz.lat, selectedBiz.lng], zoom: 17.5, options: { duration: 0.65, easeLinearity: 0.25 } }, 'selection');
        } catch {}
        setIsSelectedBizExpandedOnMap(true);
      } else {
        // In State 2, clicking card body opens the comprehensive details modal
        if (onSelectBusinessRef.current) {
          onSelectBusinessRef.current(selectedBiz);
        }
      }
    };

    if (selectedMarkerRef.current && selectedLayer.hasLayer(selectedMarkerRef.current)) {
      selectedMarkerRef.current.setLatLng([selectedBiz.lat, selectedBiz.lng]);
      selectedMarkerRef.current.setIcon(bizIcon);
      selectedMarkerRef.current.off('click');
      selectedMarkerRef.current.on('click', handleCardClick);
      attachCardDomListeners(selectedMarkerRef.current, cardData.fallbackCover, () => setSelectedBizRef.current(null));
    } else {
      selectedLayer.clearLayers();
      const marker = window.L.marker([selectedBiz.lat, selectedBiz.lng], {
        icon: bizIcon,
        pane: 'selectedPinPane',
        zIndexOffset: 1200,
      });
      marker.on('click', handleCardClick);
      selectedLayer.addLayer(marker);
      attachCardDomListeners(marker, cardData.fallbackCover, () => setSelectedBizRef.current(null));
      selectedMarkerRef.current = marker;
    }
  }, [mode, isMapReady, selectedBiz, isSelectedBizExpandedOnMap]);

  // 6. 📍 Main Activity Pins Clustering & Progressive Dropping Effect
  useEffect(() => {
    isRenderingActivitiesRef.current = false;
    if (mode !== 'view') return;
    const map = leafletMapRef.current;
    if (!map || !isMapReady || !window.L) return;

    const cardsLayer = cardsLayerGroupRef.current;
    const clusterLayer = clusterLayerGroupRef.current;
    if (!cardsLayer || !clusterLayer) return;

    // Rule 1: Activities appear if category filter is active OR explicit search query returned results!
    const hasCategoryFilter = Boolean(effectiveCategoryFilter && effectiveCategoryFilter !== 'all' && effectiveCategoryFilter.trim() !== '');
    const hasSearchOverride = Boolean(searchQuery && searchQuery.trim() !== '' && visibleBusinesses.length > 0);
    if (!hasCategoryFilter && !hasSearchOverride) {
      cardsLayer.clearLayers();
      clusterLayer.clearLayers();
      clusterRegistry.current.clear();
      markersRegistryRef.current.clear();
      clusterMarkerRef.current = null;
      return;
    }

    const zoom = viewportSnapshot?.zoom ?? map.getZoom();
    const scale = activityCardScale(zoom);
    const snapshotBounds = viewportSnapshot?.bounds;
    const bounds = snapshotBounds
      ? window.L.latLngBounds([[snapshotBounds.south, snapshotBounds.west], [snapshotBounds.north, snapshotBounds.east]]).pad(0.2)
      : map.getBounds().pad(0.2);

    // 🎯 Adaptive Level of Detail (LOD):
    // 1. District View: when an individual zone filter is active OR zoomed in to local scale (>= 15.5) -> Rich Vertical Cards
    // 2. City Overview: when observing the entire city (< 15.5, no specific zone selected) -> Sleek Horizontal Compact Cards (Image 3 DNA)
    const isDistrictView = Boolean(
      (effectiveSelectedZone && effectiveSelectedZone !== 'all' && effectiveSelectedZone.trim() !== '') ||
      isLocalPinPresentationZoom(zoom)
    );

    // 🛡️ Selected Entity Isolation (BEH-05 / SAFETY-03):
    // Exclude selectedBiz from background pins and cluster groups so it never doubles or alters counts.
    const businessesForClustering = selectedBiz
      ? sortedBusinesses.filter(biz => biz.id !== selectedBiz.id)
      : sortedBusinesses;

    // 🚀 Performance Optimization: Pre-filter by visible viewport bounds before running spatial clustering
    const inViewBusinesses = businessesForClustering.filter(biz => bounds.contains([biz.lat, biz.lng]));
    if (groupingCache.current?.items !== inViewBusinesses || groupingCache.current.zoom !== zoom) {
      groupingCache.current = { items: inViewBusinesses, zoom, groups: groupNearbyActivities(inViewBusinesses, biz => map.project([biz.lat, biz.lng], zoom), 58) };
    }
    const visibleGroups = groupingCache.current.groups;

    interface OccupiedSpatialSlot {
      x: number;
      y: number;
      width: number;
      height: number;
      isCluster: boolean;
    }
    const occupied: OccupiedSpatialSlot[] = [];
    // Remove stale results before yielding, so a new filter never shows old pins.
    const nextIds = new Set(visibleGroups.filter(g => g.length === 1).map(g => g[0].id));
    const clusterKey = (g: Business[]) => g.map(b => `${b.id}:${b.lat}:${b.lng}:${b.nameAr}`).join('|');
    const nextClusters = new Set(visibleGroups.filter(g => g.length > 1).map(clusterKey));

    const filterChanged =
      lastRenderedFilterRef.current.category !== effectiveCategoryFilter ||
      lastRenderedFilterRef.current.zone !== effectiveSelectedZone;
    lastRenderedFilterRef.current = { category: effectiveCategoryFilter, zone: effectiveSelectedZone };

    if (filterChanged) {
      // ⚡ Atomic Fast Path: Full category/zone change clears all previous layers in 0.1ms without synchronous loop reflows
      try {
        if (typeof map.closePopup === 'function') {
          map.closePopup();
        }
      } catch {}
      cardsLayer.clearLayers();
      clusterLayer.clearLayers();
      markersRegistryRef.current.clear();
      clusterRegistry.current.clear();
    } else {
      // 🛡️ Incremental Viewport Path: Panning/zooming within same filter prunes only out-of-bounds pins
      markersRegistryRef.current.forEach((entry, id) => {
        if (!nextIds.has(id)) {
          cardsLayer.removeLayer(entry.marker);
          markersRegistryRef.current.delete(id);
        }
      });
      clusterRegistry.current.forEach((marker, id) => {
        if (!nextClusters.has(id)) {
          clusterLayer.removeLayer(marker);
          clusterRegistry.current.delete(id);
        }
      });
    }
    isRenderingActivitiesRef.current = visibleGroups.length > 0;

    let staggerIndex = 0;
    let overviewCardsCount = 0;

    // 🌟 Deterministic Prominence Stability (BEH-07 / SAFETY-05):
    // Pre-calculate top 3 scored businesses in view so cards are assigned deterministically across pans
    const topProminentIdsInView = new Set(
      businessesForClustering
        .filter(b => bounds.contains([b.lat, b.lng]))
        .slice(0, 3)
        .map(b => b.id)
    );

    const cancelWork = scheduleProgressiveWork(visibleGroups, group => {
      const lat = group.reduce((sum, biz) => sum + biz.lat, 0) / group.length;
      const lng = group.reduce((sum, biz) => sum + biz.lng, 0) / group.length;
      if (!bounds.contains([lat, lng])) return;

      if (group.length > 1) {
        const clusterPoint = map.latLngToContainerPoint([lat, lng]);
        // 🛡️ Cluster Shield: Register cluster's physical footprint into occupied grid to protect from cards overlapping!
        occupied.push({
          x: clusterPoint.x,
          y: clusterPoint.y,
          width: 48,
          height: 48,
          isCluster: true,
        });

        const key = clusterKey(group);
        if (clusterRegistry.current.has(key)) return;
        const data = createLightweightClusterHtml(group.length);
        const marker = window.L.marker([lat, lng], {
          icon: window.L.divIcon({ className: 'custom-district-cluster-pin', ...data }),
          pane: 'pinsPane',
          zIndexOffset: 600,
          title: `${group.length} أنشطة متقاربة`,
        });
        marker.on('click', () => {
          const points = group.map(biz => [biz.lat, biz.lng]);
          if (map.getZoom() < 19 && group.some(biz => map.distance([lat, lng], [biz.lat, biz.lng]) > 3)) {
            mapInstance.cameraController?.request({ kind: 'flyToBounds', bounds: window.L.latLngBounds(points), options: { padding: [70, 70], maxZoom: Math.min(19, map.getZoom() + 2), duration: 0.5 } }, 'cluster');
          } else {
            const list = document.createElement('div');
            list.dir = 'rtl';
            list.style.cssText = 'max-height:240px;overflow:auto;min-width:190px';
            const heading = document.createElement('strong');
            heading.textContent = `${group.length} أنشطة في هذا المكان`;
            list.append(heading);
            group.forEach(biz => {
              const button = document.createElement('button');
              button.type = 'button';
              button.textContent = biz.nameAr || biz.name || 'عرض النشاط';
              button.style.cssText = 'display:block;width:100%;padding:12px;text-align:right;border-bottom:1px solid #eee;cursor:pointer;background:white;color:#0f172a';
              button.onclick = () => { map.closePopup(); setSelectedBizRef.current(biz); };
              list.append(button);
            });
            marker.bindPopup(list).openPopup();
          }
        });
        clusterLayer.addLayer(marker);
        clusterRegistry.current.set(key, marker);
        animateNewMarker(marker, key, staggerIndex++);
        return;
      }

      const biz = group[0];
      const point = map.latLngToContainerPoint([biz.lat, biz.lng]);

      // Calculate candidate card dimensions
      const cardWidth = isDistrictView ? 184 : 224;
      const cardHeight = isDistrictView ? 134 : 60;
      const cardW = cardWidth * scale;
      const cardH = cardHeight * scale;

      // 🛡️ Collision Engine: Check overlap against both existing cards AND cluster badges
      const collides = occupied.some(occ => {
        if (occ.isCluster) {
          const cardCenterX = point.x;
          const cardCenterY = point.y - cardH / 2;
          return Math.abs(occ.x - cardCenterX) < (cardW / 2 + 28) &&
                 Math.abs(occ.y - cardCenterY) < (cardH / 2 + 28);
        }
        const cardCenterX = point.x;
        const cardCenterY = point.y - cardH / 2;
        const occCenterX = occ.x;
        const occCenterY = occ.y - occ.height / 2;
        return Math.abs(occCenterX - cardCenterX) < (occ.width + cardW) / 2 + 10 &&
               Math.abs(occCenterY - cardCenterY) < (occ.height + cardH) / 2 + 10;
      });

      // 🌟 Visual Hierarchy: In City Overview, reserve rich horizontal cards for the top 3 prominent activities in view;
      // render remaining unselected activities as clean compact pins to eliminate visual chaos.
      const allowFullCard = isDistrictView || topProminentIdsInView.has(biz.id);
      const usePinDot = collides || !allowFullCard;
      if (!usePinDot) {
        overviewCardsCount++;
        occupied.push({
          x: point.x,
          y: point.y,
          width: cardW,
          height: cardH,
          isCluster: false,
        });
      }

      const cardScale = usePinDot ? 1 : scale;
      const markerType = usePinDot ? 'pindot' : (isDistrictView ? 'district' : 'overview');
      const iconKey = computeMarkerIconKey(biz, 0, [0, 0], markerType) + `_${cardScale}`;
      const existing = markersRegistryRef.current.get(biz.id);
      if (existing && existing.iconKey === iconKey) {
        existing.biz = biz;
        existing.marker.setLatLng([biz.lat, biz.lng]);
        return;
      }

      const data = usePinDot
        ? createCompactActivityPinHtml(biz, false, false)
        : isDistrictView
        ? createLightweightBadgeHtml(biz, false, false)
        : createCompactOverviewBadgeHtml(biz, false);

      const icon = window.L.divIcon({
        className: 'custom-biz-pin',
        html: `<div style="transform:scale(${cardScale});transform-origin:top left">${data.html}</div>`,
        iconSize: data.iconSize.map((n: number) => n * cardScale),
        iconAnchor: data.iconAnchor.map((n: number) => n * cardScale),
      });

      if (existing) {
        existing.biz = biz;
        existing.marker.setLatLng([biz.lat, biz.lng]);
        if (existing.iconKey !== iconKey) {
          existing.marker.setIcon(icon);
          existing.iconKey = iconKey;
          if ('fallbackCover' in data && typeof data.fallbackCover === 'string') {
            attachCardDomListeners(existing.marker, data.fallbackCover);
          }
        }
      } else {
        const marker = window.L.marker([biz.lat, biz.lng], {
          icon,
          pane: 'pinsPane',
          title: biz.nameAr || '',
          zIndexOffset: usePinDot ? 100 : 300,
        });
        marker.on('click', () => {
          const current = markersRegistryRef.current.get(biz.id)?.biz || biz;
          setSelectedBizRef.current(current);
        });
        cardsLayer.addLayer(marker);
        animateNewMarker(marker, biz.id, staggerIndex++);
        if ('fallbackCover' in data && typeof data.fallbackCover === 'string') {
          attachCardDomListeners(marker, data.fallbackCover);
        }
        markersRegistryRef.current.set(biz.id, { marker, biz, iconKey });
      }
    }, () => {
      isRenderingActivitiesRef.current = false;
      activeWorkCleanupRef.current = null;
    });

    activeWorkCleanupRef.current = cancelWork;
    return () => {
      if (activeWorkCleanupRef.current) {
        activeWorkCleanupRef.current();
        activeWorkCleanupRef.current = null;
      }
    };
  }, [mode, isMapReady, sortedBusinesses, effectiveSelectedZone, effectiveCategoryFilter, viewportSnapshot]);

  // Refresh only after the viewport settles; never move the stored coordinates.
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady || mode !== 'view') return;
    updateViewportSnapshot(map);
    let frame: number | null = null;
    let timer: number | null = null;

    const onGestureStart = () => {
      // 🛑 Gesture Supremacy: Freeze active progressive pin drops immediately when user touches/drags/zooms
      if (activeWorkCleanupRef.current) {
        activeWorkCleanupRef.current();
        activeWorkCleanupRef.current = null;
      }
    };

    const refresh = () => {
      if (isCameraFlyingRef.current) {
        // While camera is in flight, skip intermediate revisions;
        // onFlightEnd will trigger a clean, single update once camera lands.
        return;
      }
      if (frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
      frame = requestAnimationFrame(() => {
        frame = null;
        updateViewportSnapshot(map);
      });
    };

    map.on('movestart zoomstart dragstart', onGestureStart);
    map.on('moveend zoomend resize', refresh);
    return () => {
      map.off('movestart zoomstart dragstart', onGestureStart);
      map.off('moveend zoomend resize', refresh);
      if (frame !== null) cancelAnimationFrame(frame);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [isMapReady, mode, updateViewportSnapshot]);
  return { isRenderingActivities: isRenderingActivitiesRef.current };
};
