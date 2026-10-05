import { useEffect, useRef } from 'react';
import { TargetBuildingData } from '../../../features/map';

interface MapInstanceLike {
  leafletMapRef: { current: any };
  isMapReady: boolean;
  cameraController: { request: (command: unknown, priority: string) => boolean } | null | undefined;
}

interface SavedCamera {
  center: [number, number];
  zoom: number;
}

/** Flies the camera to a searched building once per selection (kept clear of the bottom drawer),
 *  then restores the pre-search camera state when building mode is exited. */
export function useTargetBuildingCamera(
  targetBuilding: TargetBuildingData | null | undefined,
  mapInstance: MapInstanceLike,
) {
  const lastFlownKeyRef = useRef<string | null>(null);
  const preSearchCameraRef = useRef<SavedCamera | null>(null);
  const inBuildingModeRef = useRef(false);

  useEffect(() => {
    const map = mapInstance.leafletMapRef.current;

    if (!targetBuilding || typeof targetBuilding.lat !== 'number' || typeof targetBuilding.lng !== 'number') {
      lastFlownKeyRef.current = null;
      if (inBuildingModeRef.current) {
        inBuildingModeRef.current = false;
        const saved = preSearchCameraRef.current;
        preSearchCameraRef.current = null;
        if (saved && map && mapInstance.isMapReady && mapInstance.cameraController) {
          try {
            const cur = map.getCenter();
            console.log('[TBC] restore-from ' + JSON.stringify({ cur: [+cur.lat.toFixed(6), +cur.lng.toFixed(6)], curZoom: map.getZoom(), saved }));
            const ok = mapInstance.cameraController.request(
              { kind: 'flyTo', center: saved.center, zoom: saved.zoom, options: { duration: 0.65 } },
              'zone',
            );
            console.log('[TBC] restore request ' + ok);
            setTimeout(() => {
              try {
                const after = map.getCenter();
                console.log('[TBC] after-restore ' + JSON.stringify({ center: [+after.lat.toFixed(6), +after.lng.toFixed(6)], zoom: map.getZoom() }));
              } catch {}
            }, 1300);
          } catch (e) { console.log('[TBC] restore threw ' + e); }
        }
      }
      return;
    }

    if (!map || !mapInstance.isMapReady || !mapInstance.cameraController) return;
    const key = `${targetBuilding.zoneLetter ?? ''}_${targetBuilding.buildingNumber ?? ''}_${targetBuilding.lat}_${targetBuilding.lng}`;
    const firstEntry = !inBuildingModeRef.current;
    if (!firstEntry && lastFlownKeyRef.current === key) return;
    inBuildingModeRef.current = true;
    lastFlownKeyRef.current = key;
    try {
      if (firstEntry) {
        // Snapshot the camera exactly as it was before the search began
        const center = map.getCenter();
        preSearchCameraRef.current = { center: [center.lat, center.lng], zoom: map.getZoom() };
        console.log('[TBC] captured ' + JSON.stringify({ center: [+center.lat.toFixed(6), +center.lng.toFixed(6)], zoom: map.getZoom() }));
      }
      // Shift the center north so the pin stays clear of the bottom detail drawer
      const viewport = map.getSize();
      const centerWorld = map.project([targetBuilding.lat, targetBuilding.lng], 17).subtract([0, Math.round(viewport.y * 0.18)]);
      const center = map.unproject(centerWorld, 17);
      mapInstance.cameraController.request(
        { kind: 'flyTo', center: [center.lat, center.lng], zoom: 17, options: { duration: 0.7 } },
        'building',
      );
    } catch {}
  }, [targetBuilding, mapInstance.isMapReady, mapInstance.cameraController]);
}
