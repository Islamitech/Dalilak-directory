import { useEffect, useRef } from 'react';
import { Business } from '../../../types';
import {
  flyCameraToSelectedBusiness,
  planCameraTransitionOnZoneChange,
  getVisualViewportPadding,
} from '../utils/cameraPlanner';
import { preloadDistrictTiles } from '../../../utils/hadayekTilePreloader';
import { HADAYEK_OFFICIAL_DISTRICTS } from '../../../data/hadayekDistrictsGeoData';
import {
  createCameraShieldState,
  disposeCameraShield,
  markCameraFlight,
  type CameraShieldState,
} from '../utils/cameraFlightShield';

interface MapInstanceLike {
  leafletMapRef: { current: any };
  isMapReady: boolean;
  cameraController: any;
}

/**
 * Camera flight coordinator (all flights go through CameraController):
 * 1. Selection flight — centers a newly selected business card on-screen.
 * 2. Cinematic zone flight (restored from archive b63ebc5) — parabolic-arc / direct-glide
 *    on zone change, glide back to the general overview when the zone is cleared.
 */
export function useMapSelectionCamera(
  selectedBiz: Business | null,
  mapInstance: MapInstanceLike,
  effectiveZone = '',
  mode = 'view',
) {
  const lastSelectedBizIdRef = useRef<string | null>(null);
  const previousZoneRef = useRef<string>(effectiveZone);
  const shieldRef = useRef<CameraShieldState>(createCameraShieldState());

  useEffect(() => {
    const map = mapInstance.leafletMapRef.current;
    if (!selectedBiz || !map || !mapInstance.isMapReady) return;
    if (lastSelectedBizIdRef.current === selectedBiz.id) return;
    lastSelectedBizIdRef.current = selectedBiz.id;
    flyCameraToSelectedBusiness(map, mapInstance.cameraController, selectedBiz);
  }, [selectedBiz, mapInstance.isMapReady, mapInstance.cameraController]);

  useEffect(() => {
    if (mode !== 'view' || !mapInstance.isMapReady) return;
    const map = mapInstance.leafletMapRef.current;
    if (!map) return;

    const decision = planCameraTransitionOnZoneChange(
      previousZoneRef.current,
      effectiveZone,
      HADAYEK_OFFICIAL_DISTRICTS,
      map.getZoom(),
    );
    previousZoneRef.current = effectiveZone;
    if (!decision.shouldMove) return;

    const viewportPadding = getVisualViewportPadding(map.getSize().x < 640, false);

    try {
      if (decision.type === 'zone' && decision.targetBounds) {
        // Warm the destination tiles before takeoff so the flight lands on ready tiles
        preloadDistrictTiles(effectiveZone, decision.targetBounds);
        map.stop();
        markCameraFlight(map, shieldRef.current);
        mapInstance.cameraController?.request(
          {
            kind: 'flyToBounds',
            bounds: window.L.latLngBounds(decision.targetBounds),
            options: {
              paddingTopLeft: viewportPadding.paddingTopLeft,
              paddingBottomRight: viewportPadding.paddingBottomRight,
              maxZoom: 16.5,
              duration: decision.totalDuration ?? 1.2,
              easeLinearity: 0.25,
            },
          },
          'zone',
        );
      } else if (decision.type === 'overview' && decision.targetCenter) {
        map.stop();
        markCameraFlight(map, shieldRef.current);
        mapInstance.cameraController?.request(
          {
            kind: 'flyTo',
            center: decision.targetCenter,
            zoom: decision.targetZoom ?? 14,
            options: { duration: decision.totalDuration ?? 1.1, easeLinearity: 0.25 },
          },
          'zone',
        );
      }
    } catch {}
  }, [effectiveZone, mode, mapInstance.isMapReady, mapInstance.cameraController]);

  useEffect(() => () => {
    disposeCameraShield(mapInstance.leafletMapRef.current, shieldRef.current);
  }, []);
}
