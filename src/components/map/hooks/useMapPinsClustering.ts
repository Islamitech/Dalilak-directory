import { useState, useEffect, useRef } from 'react';
import { Business } from '../../../types';
import { HADAYEK_OFFICIAL_DISTRICTS, HADAYEK_OFFICIAL_GATES } from '../../../data/hadayekDistrictsGeoData';
import { createLightweightBadgeHtml, createLightweightClusterHtml, createDistrictClusterHtml, createOriginHubHtml } from '../badgeMarkers';
import { disperseCoincidentPins } from '../utils/pinDispersal';
import { isBusinessInHadayekZone } from '../../../utils/hadayekZoneHelper';
import { matchesCategoryFilter } from '../../../utils/categoryMatcher';
import { useMapInstance } from './useMapInstance';
import { useMapState } from './useMapState';

export interface UseMapPinsClusteringProps {
  mapInstance: ReturnType<typeof useMapInstance>;
  state: ReturnType<typeof useMapState>;
  mode?: 'picker' | 'view';
  businesses: Business[];
  showHadayekGates?: boolean;
  targetBuilding?: {
    zoneLetter?: string;
    buildingNumber?: string;
    lat?: number;
    lng?: number;
  } | null;
  onSelectBusiness?: (biz: Business) => void;
  onSelectZone?: (zoneLetter: string) => void;
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
  targetBuilding,
  onSelectBusiness,
  onSelectZone,
}: UseMapPinsClusteringProps) => {
  const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>({});
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
    selectedZone,
    mapCategoryFilter,
    onlyVerifiedFilter,
    selectedBiz,
    setSelectedBiz,
    showDistrictsOverlay,
    showGatesLayer,
    showTargetPin,
    isInHadayekScope,
  } = state;

  const districtPolygonsRef = useRef<Array<{ letterAr: string; polygon: any; color: string }>>([]);
  const districtMarkersRef = useRef<{ [letterAr: string]: any }>({});
  const districtsLayerGroupRef = useRef<any>(null);
  const gatesLayerGroupRef = useRef<any>(null);
  const targetLayerGroupRef = useRef<any>(null);
  const lastFlownTargetRef = useRef<string | null>(null);
  const previousSelectedZoneRef = useRef<string>(selectedZone);
  const selectedZoneRef = useRef<string>(selectedZone);
  selectedZoneRef.current = selectedZone;
  const selectedBizRef = useRef<Business | null>(selectedBiz);
  selectedBizRef.current = selectedBiz;

  // Global handler to deselect / close selected card
  useEffect(() => {
    (window as any).__closeSelectedCard = () => {
      setSelectedBiz(null);
    };
    return () => {
      delete (window as any).__closeSelectedCard;
    };
  }, [setSelectedBiz]);

  // Click on open map background deselects card and restores 3 fanned cards
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady) return;

    const handleMapBackgroundClick = () => {
      if (selectedBizRef.current) {
        setSelectedBiz(null);
      }
    };

    map.on('click', handleMapBackgroundClick);
    return () => {
      map.off('click', handleMapBackgroundClick);
    };
  }, [isMapReady, setSelectedBiz]);

  // Reset expanded clusters whenever selectedZone or mapCategoryFilter changes
  useEffect(() => {
    setExpandedZones({});
  }, [selectedZone, mapCategoryFilter]);

  // Single smooth handler to select district, style polygons, and frame view
  const handleSelectDistrict = (letter: string) => {
    state.setSelectedZone(letter);
    if (onSelectZone) onSelectZone(letter);
  };

  // Global handler for popup action button
  useEffect(() => {
    (window as any).__selectHadayekDistrict = (letter: string) => {
      handleSelectDistrict(letter);
      state.setShowBusinesses(true);
    };
    return () => {
      delete (window as any).__selectHadayekDistrict;
    };
  }, [onSelectZone]);

  // 1. Initialize dedicated persistent sub-layers on map to isolate DOM repaints
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady || !window.L) return;

    if (!districtsLayerGroupRef.current || !map.hasLayer(districtsLayerGroupRef.current)) {
      if (districtsLayerGroupRef.current) {
        try { districtsLayerGroupRef.current.remove(); } catch {}
      }
      districtsLayerGroupRef.current = window.L.layerGroup().addTo(map);
    }
    if (!gatesLayerGroupRef.current || !map.hasLayer(gatesLayerGroupRef.current)) {
      if (gatesLayerGroupRef.current) {
        try { gatesLayerGroupRef.current.remove(); } catch {}
      }
      gatesLayerGroupRef.current = window.L.layerGroup().addTo(map);
    }
    if (!targetLayerGroupRef.current || !map.hasLayer(targetLayerGroupRef.current)) {
      if (targetLayerGroupRef.current) {
        try { targetLayerGroupRef.current.remove(); } catch {}
      }
      targetLayerGroupRef.current = window.L.layerGroup().addTo(map);
    }
  }, [isMapReady]);

  // 2. 🗺️ Hadayek Districts Layout & Boundaries (تخطيط ورسم حدود حدائق الأهرام)
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady || !window.L) return;

    if (!districtsLayerGroupRef.current || !map.hasLayer(districtsLayerGroupRef.current)) {
      if (districtsLayerGroupRef.current) {
        try { districtsLayerGroupRef.current.remove(); } catch {}
      }
      districtsLayerGroupRef.current = window.L.layerGroup().addTo(map);
    }
    const districtsLayer = districtsLayerGroupRef.current;

    // Check if map center is within Hadayek Al-Ahram area
    const isWithinHadayek = Math.abs(currentLat - 29.9683) < 0.10 && Math.abs(currentLng - 31.1002) < 0.10;
    if (!isWithinHadayek) {
      districtsLayer.clearLayers();
      districtPolygonsRef.current = [];
      districtMarkersRef.current = {};
      return;
    }

    districtsLayer.clearLayers();
    districtPolygonsRef.current = [];
    districtMarkersRef.current = {};

    const hasActiveZone = Boolean(selectedZone && selectedZone !== 'all' && selectedZone.trim() !== '');

    HADAYEK_OFFICIAL_DISTRICTS.forEach((district) => {
      const isSelected = hasActiveZone && district.letterAr === selectedZone;

      // Draw cadastral boundary polygon for this district
      district.polygons.forEach((polyCoords) => {
        const polygon = window.L.polygon(polyCoords, {
          color: district.color,
          weight: isSelected ? 3.5 : hasActiveZone ? 1.5 : 2,
          opacity: isSelected ? 1.0 : hasActiveZone ? 0.45 : 0.85,
          fillColor: district.color,
          fillOpacity: isSelected ? 0.18 : hasActiveZone ? 0.025 : 0.07,
          dashArray: isSelected ? '6, 6' : undefined,
          className: isSelected ? 'selected-district-polygon' : 'hadayek-district-polygon',
        });

        // Click on polygon selects zone
        polygon.on('click', () => {
          state.setSelectedZone(district.letterAr);
          if (onSelectZone) onSelectZone(district.letterAr);
        });

        // Subtle hover effect
        polygon.on('mouseover', () => {
          if (selectedZone !== district.letterAr) {
            polygon.setStyle({
              fillOpacity: 0.16,
              weight: 2.5,
              opacity: 0.95,
            });
          }
        });

        polygon.on('mouseout', () => {
          if (selectedZone !== district.letterAr) {
            polygon.setStyle({
              fillOpacity: hasActiveZone ? 0.025 : 0.07,
              weight: hasActiveZone ? 1.5 : 2,
              opacity: hasActiveZone ? 0.45 : 0.85,
            });
          }
        });

        districtsLayer.addLayer(polygon);
        districtPolygonsRef.current.push({ letterAr: district.letterAr, polygon, color: district.color });
      });

      // Compact circular letter badge in the centroid of each zone (حرف المنطقة فقط)
      const badgeHtml = `
        <div class="hadayek-zone-letter-badge" style="
          width: ${isSelected ? '28px' : '24px'};
          height: ${isSelected ? '28px' : '24px'};
          border-radius: 50%;
          background: ${isSelected ? district.color : '#ffffff'};
          border: 2px solid ${isSelected ? '#fef08a' : district.color};
          color: ${isSelected ? '#ffffff' : '#0f172a'};
          font-family: 'Cairo', system-ui, sans-serif;
          font-weight: 900;
          font-size: ${isSelected ? '14px' : '12px'};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: ${isSelected ? '0 0 14px rgba(0, 0, 0, 0.45), 0 3px 8px rgba(0, 0, 0, 0.3)' : '0 2px 5px rgba(0, 0, 0, 0.25)'};
          opacity: ${hasActiveZone && !isSelected ? 0.65 : 1.0};
          cursor: pointer;
          user-select: none;
          line-height: 1;
        ">${district.letterAr}</div>
      `;

      const badgeSize = isSelected ? [28, 28] : [24, 24];
      const badgeAnchor = isSelected ? [14, 14] : [12, 12];

      const badgeIcon = window.L.divIcon({
        className: 'hadayek-zone-letter-marker',
        html: badgeHtml,
        iconSize: badgeSize,
        iconAnchor: badgeAnchor,
      });

      const marker = window.L.marker([district.centerLat, district.centerLng], {
        icon: badgeIcon,
        zIndexOffset: isSelected ? 400 : 200,
      });

      marker.on('click', () => {
        state.setSelectedZone(district.letterAr);
        if (onSelectZone) onSelectZone(district.letterAr);
      });

      districtsLayer.addLayer(marker);
      districtMarkersRef.current[district.letterAr] = marker;
    });

    // Smooth camera flight when a district is selected or cleared
    if (hasActiveZone) {
      if (previousSelectedZoneRef.current !== selectedZone) {
        previousSelectedZoneRef.current = selectedZone;
        const targetDistrict = HADAYEK_OFFICIAL_DISTRICTS.find((d) => d.letterAr === selectedZone);
        if (targetDistrict && targetDistrict.polygons && targetDistrict.polygons[0]) {
          try {
            const bounds = window.L.latLngBounds(targetDistrict.polygons[0]);
            map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 16.5, duration: 0.6 });
          } catch {}
        }
      }
    } else {
      if (previousSelectedZoneRef.current && previousSelectedZoneRef.current !== 'all') {
        previousSelectedZoneRef.current = '';
        map.flyTo([29.9683, 31.1002], 14, { duration: 0.6 });
      }
    }
  }, [selectedZone, isMapReady, currentLat, currentLng]);

  // 4. 🚪 Render Hadayek Official Gates into dedicated layer
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady || !window.L) return;

    if (!gatesLayerGroupRef.current || !map.hasLayer(gatesLayerGroupRef.current)) {
      if (gatesLayerGroupRef.current) {
        try { gatesLayerGroupRef.current.remove(); } catch {}
      }
      gatesLayerGroupRef.current = window.L.layerGroup().addTo(map);
    }
    const gatesLayer = gatesLayerGroupRef.current;

    gatesLayer.clearLayers();

    if (!showHadayekGates || !showGatesLayer) return;

    HADAYEK_OFFICIAL_GATES.forEach((gate) => {
      const gateHtml = `
        <div style="
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          gap: 2px;
          cursor: pointer;
          user-select: none;
        ">
          <div style="
            background: #4f46e5;
            color: #ffffff;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 900;
            box-shadow: 0 1.5px 4px rgba(0,0,0,0.4);
            font-family: 'Arial', sans-serif;
          ">${gate.number || '🚪'}</div>
          <div style="
            color: #312e81;
            font-family: 'Cairo', system-ui, sans-serif;
            font-weight: 800;
            font-size: 12px;
            text-shadow: 
              -1.5px -1.5px 0 #ffffff, 
               1.5px -1.5px 0 #ffffff, 
              -1.5px  1.5px 0 #ffffff, 
               1.5px  1.5px 0 #ffffff, 
               0 2px 4px rgba(0,0,0,0.3);
            white-space: nowrap;
            letter-spacing: -0.2px;
          ">${escapeHtml(gate.popularNameAr || gate.shortNameAr)}</div>
        </div>
      `;

      const gateIcon = window.L.divIcon({
        className: 'custom-gate-pin-native',
        html: gateHtml,
        iconSize: [100, 40],
        iconAnchor: [50, 10],
      });

      const gateMarker = window.L.marker([gate.lat, gate.lng], { icon: gateIcon, zIndexOffset: 400 });
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

  // 5. 📍 Render Target Building in dedicated layer (without disrupting pan/zoom)
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady || !window.L) return;

    if (!targetLayerGroupRef.current || !map.hasLayer(targetLayerGroupRef.current)) {
      if (targetLayerGroupRef.current) {
        try { targetLayerGroupRef.current.remove(); } catch {}
      }
      targetLayerGroupRef.current = window.L.layerGroup().addTo(map);
    }
    const targetLayer = targetLayerGroupRef.current;
    targetLayer.clearLayers();

    if (!targetBuilding || !showTargetPin || typeof targetBuilding.lat !== 'number' || typeof targetBuilding.lng !== 'number') {
      lastFlownTargetRef.current = null;
      return;
    }

    const bldgLabel = targetBuilding.buildingNumber
      ? `عمارة ${targetBuilding.buildingNumber} منطقة ${targetBuilding.zoneLetter || ''}`
      : `منطقة ${targetBuilding.zoneLetter || 'الحدائق'}`;

    const bldgHtml = `
      <div style="position: relative; transform: translate(-50%, -100%); cursor: pointer; user-select: none; display: flex; flex-direction: column; align-items: center;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); border: 2.5px solid #ffffff; color: #020617; padding: 6px 14px; border-radius: 9999px; font-family: Cairo, sans-serif; font-weight: 900; font-size: 12px; box-shadow: 0 0 25px rgba(245, 158, 11, 0.9), 0 4px 16px rgba(0,0,0,0.4); display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;">
          <span style="font-size: 15px;">📍</span>
          <span>${escapeHtml(bldgLabel)}</span>
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #f59e0b; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5));"></div>
      </div>
    `;

    const bldgIcon = window.L.divIcon({
      className: 'custom-target-building-pin',
      html: bldgHtml,
      iconSize: [200, 42],
      iconAnchor: [100, 42],
    });

    const bldgMarker = window.L.marker([targetBuilding.lat, targetBuilding.lng], { icon: bldgIcon, zIndexOffset: 1000 });
    targetLayer.addLayer(bldgMarker);

    // Soft Golden Radius Circle (200m)
    const bldgCircle = window.L.circle([targetBuilding.lat, targetBuilding.lng], {
      radius: 200,
      color: '#f59e0b',
      weight: 2,
      opacity: 0.8,
      fillColor: '#f59e0b',
      fillOpacity: 0.12,
      dashArray: '5, 5',
    });
    targetLayer.addLayer(bldgCircle);

    // Fly smoothly to target ONLY ONCE per distinct building selection
    const targetKey = `${targetBuilding.zoneLetter || ''}_${targetBuilding.buildingNumber || ''}_${targetBuilding.lat}_${targetBuilding.lng}`;
    if (lastFlownTargetRef.current !== targetKey) {
      lastFlownTargetRef.current = targetKey;
      map.flyTo([targetBuilding.lat, targetBuilding.lng], 17, { duration: 1.0 });
    }
  }, [targetBuilding, showTargetPin, isMapReady]);

  // 6. 📍 Render Businesses with Smart Screen-Space Marker Clustering in isolated layer
  useEffect(() => {
    const map = leafletMapRef.current;
    const markersGroup = markersGroupRef.current;

    if (!map || !markersGroup || !isMapReady || !window.L) return;

    markersGroup.clearLayers();

    if (mode === 'picker') {
      // 🌟 Precision Needle Pin (Direct Anchor at the tip of the needle: [18, 68])
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
        draggable: true,
        autoPan: true,
      });

      marker.on('dragend', (e: any) => {
        const ll = e.target.getLatLng();
        updateSelectedPosition(ll.lat, ll.lng, false);
      });

      markersGroup.addLayer(marker);
      pickerMarkerRef.current = marker;

      // Draw live GPS Accuracy Circle if GPS was used
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
    } else {
      // 🌟 View Mode: Render Businesses with Activity Cards, Top-3 Prominence, and Cluster Burst
      // Rule 1: Activities MUST ONLY appear if an activity type/category is selected from filters!
      const hasCategoryFilter = Boolean(mapCategoryFilter && mapCategoryFilter !== 'all' && mapCategoryFilter.trim() !== '');
      if (!hasCategoryFilter) {
        markersGroup.clearLayers();
        return;
      }

      // Filter businesses matching category and verification
      const categoryBusinesses = businesses.filter((b) => {
        if (typeof b.lat !== 'number' || typeof b.lng !== 'number' || isNaN(b.lat) || isNaN(b.lng)) return false;
        if (onlyVerifiedFilter && b.verificationStatus !== 'verified') return false;

        const catLower = (b.category || '').toLowerCase();
        const filterLower = mapCategoryFilter.toLowerCase();
        return catLower.includes(filterLower) || matchesCategoryFilter(b, mapCategoryFilter);
      });

      // Prominence sorting helper (verified > rating > photos/video)
      const sortProminent = (list: Business[]) => {
        return [...list].sort((a, b) => {
          const scoreA =
            (a.verificationStatus === 'verified' ? 100 : 0) +
            ((a.googleRating || 0) * 10) +
            (a.videos && a.videos.length > 0 ? 15 : 0) +
            ((a.photos?.length || 0) * 2);
          const scoreB =
            (b.verificationStatus === 'verified' ? 100 : 0) +
            ((b.googleRating || 0) * 10) +
            (b.videos && b.videos.length > 0 ? 15 : 0) +
            ((b.photos?.length || 0) * 2);
          return scoreB - scoreA;
        });
      };

      const hasActiveZone = Boolean(selectedZone && selectedZone !== 'all' && selectedZone.trim() !== '');

      if (hasActiveZone) {
        // 🎯 Scenario A: A specific zone IS selected:
        // Filter strictly to this zone
        const zoneList = categoryBusinesses.filter((b) => isBusinessInHadayekZone(b, selectedZone));
        const sorted = sortProminent(zoneList);
        const isExpanded = Boolean(expandedZones[selectedZone]);

        if (isExpanded) {
          // If a card is selected, isolate it: only render that single card
          const listToRender = selectedBiz
            ? sorted.filter((b) => b.id === selectedBiz.id)
            : sorted;

          listToRender.forEach((biz, idx) => {
            const isSelected = selectedBiz?.id === biz.id;
            const isTop = idx < 3;
            const { html, iconSize, iconAnchor } = createLightweightBadgeHtml(
              biz,
              isSelected,
              isTop,
              isTop ? idx + 1 : undefined
            );
            const bizIcon = window.L.divIcon({
              className: `custom-biz-pin ${isSelected ? 'selected-isolated-card' : 'burst-card animate-scale-in'}`,
              html,
              iconSize,
              iconAnchor,
            });
            const marker = window.L.marker([biz.lat, biz.lng], {
              icon: bizIcon,
              zIndexOffset: isSelected ? 900 : 500 - idx * 2,
            });
            marker.on('click', (e: any) => {
              if (window.L && window.L.DomEvent) {
                window.L.DomEvent.stopPropagation(e);
              }
              setSelectedBiz(biz);
              map.flyTo([biz.lat, biz.lng], 18, { duration: 0.8 });
              if (onSelectBusiness) onSelectBusiness(biz);
            });
            markersGroup.addLayer(marker);
          });
        } else {
          // Show top 3 prominent activities as Activity Card pins (with coincident dispersal)
          const top3 = sorted.slice(0, 3);
          const remaining = sorted.slice(3);

          // If a prominent card is selected, isolate it completely and hide the other two cards!
          const isSelectedInTop3 = selectedBiz && top3.some((b) => b.id === selectedBiz.id);
          const itemsToProcess = isSelectedInTop3
            ? top3.filter((b) => b.id === selectedBiz.id)
            : (selectedBiz ? [] : top3);

          // Get centroid of selected zone to guide dispersal inwards into the district
          const currentDistrict = HADAYEK_OFFICIAL_DISTRICTS.find((d) => d.letterAr === selectedZone);
          const centroid: [number, number] | null = currentDistrict
            ? [currentDistrict.centerLat, currentDistrict.centerLng]
            : null;

          const dispersedResults = disperseCoincidentPins(itemsToProcess, centroid);
          const renderedHubs = new Set<string>();

          dispersedResults.forEach((item, idx) => {
            const { biz, originCoord, dispersedCoord, isDispersed } = item;
            const isSelected = selectedBiz?.id === biz.id;
            const origRank = top3.findIndex((b) => b.id === biz.id) + 1;
            const { html, iconSize, iconAnchor } = createLightweightBadgeHtml(
              biz,
              isSelected,
              true,
              origRank > 0 ? origRank : idx + 1
            );

            if (isDispersed && !isSelected) {
              // 1. Draw connecting leader line from original ground point to dispersed card pin
              const leaderLine = window.L.polyline([originCoord, dispersedCoord], {
                color: '#f59e0b',
                weight: 2.2,
                opacity: 0.85,
                dashArray: '5, 4',
                lineCap: 'round',
                lineJoin: 'round',
              });
              markersGroup.addLayer(leaderLine);

              // 2. Render origin hub marker once per shared ground coordinate
              const hubKey = `${originCoord[0].toFixed(5)}_${originCoord[1].toFixed(5)}`;
              if (!renderedHubs.has(hubKey)) {
                renderedHubs.add(hubKey);
                const hubData = createOriginHubHtml();
                const hubIcon = window.L.divIcon({
                  className: 'custom-origin-hub-pin',
                  html: hubData.html,
                  iconSize: hubData.iconSize,
                  iconAnchor: hubData.iconAnchor,
                });
                const hubMarker = window.L.marker(originCoord, { icon: hubIcon, zIndexOffset: 350 });
                markersGroup.addLayer(hubMarker);
              }
            }

            // 3. Render Activity Card Pin at its designated position
            // When selected, place directly on its physical GPS coordinate [biz.lat, biz.lng]
            const renderPosition = isSelected ? ([biz.lat, biz.lng] as [number, number]) : dispersedCoord;

            const bizIcon = window.L.divIcon({
              className: `custom-biz-pin ${isSelected ? 'selected-isolated-card' : 'top-prominent-card'}`,
              html,
              iconSize,
              iconAnchor,
            });
            const marker = window.L.marker(renderPosition, {
              icon: bizIcon,
              zIndexOffset: isSelected ? 900 : 600 - idx * 10,
            });
            marker.on('click', (e: any) => {
              if (window.L && window.L.DomEvent) {
                window.L.DomEvent.stopPropagation(e);
              }
              setSelectedBiz(biz);
              map.flyTo([biz.lat, biz.lng], 18, { duration: 0.8 });
              if (onSelectBusiness) onSelectBusiness(biz);
            });
            markersGroup.addLayer(marker);
          });

          // Group all remaining activities inside a cluster pin ("دبوس مجمع")
          // Hide cluster pin while a card is actively selected / isolated
          if (!selectedBiz && remaining.length > 0) {
            const centerLat = remaining.reduce((acc, b) => acc + b.lat, 0) / remaining.length;
            const centerLng = remaining.reduce((acc, b) => acc + b.lng, 0) / remaining.length;
            const { html, iconSize, iconAnchor } = createDistrictClusterHtml(remaining.length, mapCategoryFilter);

            const clusterIcon = window.L.divIcon({
              className: 'custom-district-cluster-pin animate-bounce-subtle',
              html,
              iconSize,
              iconAnchor,
            });
            const clusterMarker = window.L.marker([centerLat, centerLng], { icon: clusterIcon, zIndexOffset: 700 });

            // When clicked: zoom camera in closer and burst open remaining activity card pins!
            clusterMarker.on('click', () => {
              const validPts = remaining.map((b) => [b.lat, b.lng] as [number, number]);
              if (validPts.length > 0) {
                const bounds = window.L.latLngBounds(validPts);
                map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 18, duration: 0.8 });
              }
              setExpandedZones((prev) => ({ ...prev, [selectedZone]: true }));
            });
            markersGroup.addLayer(clusterMarker);
          }
        }
      } else {
        // 🧭 Scenario B: No specific zone selected (All zones): Group by Hadayek district
        const byDistrict: Record<string, Business[]> = {};
        categoryBusinesses.forEach((biz) => {
          const z = HADAYEK_OFFICIAL_DISTRICTS.find((d) => isBusinessInHadayekZone(biz, d.letterAr));
          const key = z ? z.letterAr : 'other';
          if (!byDistrict[key]) byDistrict[key] = [];
          byDistrict[key].push(biz);
        });

        Object.entries(byDistrict).forEach(([distKey, bList]) => {
          // If a business is selected, ONLY process the district containing selectedBiz!
          if (selectedBiz && !bList.some((b) => b.id === selectedBiz.id)) {
            return;
          }

          const sorted = sortProminent(bList);
          const isExpanded = Boolean(expandedZones[distKey]);

          if (isExpanded) {
            const listToRender = selectedBiz
              ? sorted.filter((b) => b.id === selectedBiz.id)
              : sorted;

            listToRender.forEach((biz, idx) => {
              const isSelected = selectedBiz?.id === biz.id;
              const { html, iconSize, iconAnchor } = createLightweightBadgeHtml(
                biz,
                isSelected,
                idx < 3,
                idx < 3 ? idx + 1 : undefined
              );
              const bizIcon = window.L.divIcon({
                className: `custom-biz-pin ${isSelected ? 'selected-isolated-card' : 'burst-card animate-scale-in'}`,
                html,
                iconSize,
                iconAnchor,
              });
              const marker = window.L.marker([biz.lat, biz.lng], {
                icon: bizIcon,
                zIndexOffset: isSelected ? 900 : 450 - idx * 2,
              });
              marker.on('click', (e: any) => {
                if (window.L && window.L.DomEvent) {
                  window.L.DomEvent.stopPropagation(e);
                }
                setSelectedBiz(biz);
                map.flyTo([biz.lat, biz.lng], 18, { duration: 0.8 });
                if (onSelectBusiness) onSelectBusiness(biz);
              });
              markersGroup.addLayer(marker);
            });
          } else {
            const top3 = sorted.slice(0, 3);
            const remaining = sorted.slice(3);

            const isSelectedInTop3 = selectedBiz && top3.some((b) => b.id === selectedBiz.id);
            const itemsToProcess = isSelectedInTop3
              ? top3.filter((b) => b.id === selectedBiz.id)
              : (selectedBiz ? [] : top3);

            const distDistrict = HADAYEK_OFFICIAL_DISTRICTS.find((d) => d.letterAr === distKey);
            const distCentroid: [number, number] | null = distDistrict
              ? [distDistrict.centerLat, distDistrict.centerLng]
              : null;

            const dispersedResults = disperseCoincidentPins(itemsToProcess, distCentroid);
            const renderedHubs = new Set<string>();

            dispersedResults.forEach((item, idx) => {
              const { biz, originCoord, dispersedCoord, isDispersed } = item;
              const isSelected = selectedBiz?.id === biz.id;
              const origRank = top3.findIndex((b) => b.id === biz.id) + 1;
              const { html, iconSize, iconAnchor } = createLightweightBadgeHtml(
                biz,
                isSelected,
                true,
                origRank > 0 ? origRank : idx + 1
              );

              if (isDispersed && !isSelected) {
                const leaderLine = window.L.polyline([originCoord, dispersedCoord], {
                  color: '#f59e0b',
                  weight: 2.2,
                  opacity: 0.85,
                  dashArray: '5, 4',
                  lineCap: 'round',
                  lineJoin: 'round',
                });
                markersGroup.addLayer(leaderLine);

                const hubKey = `${originCoord[0].toFixed(5)}_${originCoord[1].toFixed(5)}`;
                if (!renderedHubs.has(hubKey)) {
                  renderedHubs.add(hubKey);
                  const hubData = createOriginHubHtml();
                  const hubIcon = window.L.divIcon({
                    className: 'custom-origin-hub-pin',
                    html: hubData.html,
                    iconSize: hubData.iconSize,
                    iconAnchor: hubData.iconAnchor,
                  });
                  const hubMarker = window.L.marker(originCoord, { icon: hubIcon, zIndexOffset: 350 });
                  markersGroup.addLayer(hubMarker);
                }
              }

              const renderPosition = isSelected ? ([biz.lat, biz.lng] as [number, number]) : dispersedCoord;

              const bizIcon = window.L.divIcon({
                className: `custom-biz-pin ${isSelected ? 'selected-isolated-card' : 'top-prominent-card'}`,
                html,
                iconSize,
                iconAnchor,
              });
              const marker = window.L.marker(renderPosition, {
                icon: bizIcon,
                zIndexOffset: isSelected ? 900 : 550 - idx * 10,
              });
              marker.on('click', (e: any) => {
                if (window.L && window.L.DomEvent) {
                  window.L.DomEvent.stopPropagation(e);
                }
                setSelectedBiz(biz);
                map.flyTo([biz.lat, biz.lng], 18, { duration: 0.8 });
                if (onSelectBusiness) onSelectBusiness(biz);
              });
              markersGroup.addLayer(marker);
            });

            if (!selectedBiz && remaining.length > 0) {
              const centerLat = remaining.reduce((acc, b) => acc + b.lat, 0) / remaining.length;
              const centerLng = remaining.reduce((acc, b) => acc + b.lng, 0) / remaining.length;
              const { html, iconSize, iconAnchor } = createDistrictClusterHtml(remaining.length, mapCategoryFilter);

              const clusterIcon = window.L.divIcon({
                className: 'custom-district-cluster-pin animate-bounce-subtle',
                html,
                iconSize,
                iconAnchor,
              });
              const clusterMarker = window.L.marker([centerLat, centerLng], { icon: clusterIcon, zIndexOffset: 650 });
              clusterMarker.on('click', () => {
                const validPts = remaining.map((b) => [b.lat, b.lng] as [number, number]);
                if (validPts.length > 0) {
                  const bounds = window.L.latLngBounds(validPts);
                  map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 18, duration: 0.8 });
                }
                setExpandedZones((prev) => ({ ...prev, [distKey]: true }));
              });
              markersGroup.addLayer(clusterMarker);
            }
          }
        });
      }
    }
  }, [
    isMapReady,
    mode,
    businesses,
    showBusinesses,
    selectedZone,
    mapCategoryFilter,
    onlyVerifiedFilter,
    selectedBiz,
    expandedZones,
    currentLat,
    currentLng,
    gpsAccuracy,
    updateSelectedPosition,
    onSelectBusiness,
    setSelectedBiz,
  ]);
};
