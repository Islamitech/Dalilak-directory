import { useEffect, useRef } from 'react';
import { Business } from '../../../types';
import { flyCameraToSelectedBusiness } from '../utils/cameraPlanner';

interface MapInstanceLike {
  leafletMapRef: { current: any };
  isMapReady: boolean;
  cameraController: any;
}

/** Flies the camera to a newly selected business so its expanded card renders fully on-screen. */
export function useMapSelectionCamera(
  selectedBiz: Business | null,
  mapInstance: MapInstanceLike,
) {
  const lastSelectedBizIdRef = useRef<string | null>(null);

  useEffect(() => {
    const map = mapInstance.leafletMapRef.current;
    if (!selectedBiz || !map || !mapInstance.isMapReady) return;
    if (lastSelectedBizIdRef.current === selectedBiz.id) return;
    lastSelectedBizIdRef.current = selectedBiz.id;
    flyCameraToSelectedBusiness(map, mapInstance.cameraController, selectedBiz);
  }, [selectedBiz, mapInstance.isMapReady, mapInstance.cameraController]);
}
