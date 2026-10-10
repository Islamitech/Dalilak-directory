import { useEffect, useRef } from 'react';
import type { Business } from '../../../types';
import type { DirectoryScope } from '../../../utils/directoryScope';
import { applyMapPlaceFrame, fitVisiblePins } from '../model/mapPlaceFrame';

/** Hadayek keeps the locked frame. Full scope frees the camera and fits the pins once. */
export function useMapPlaceFrame(
  mapInstance: any,
  scope: DirectoryScope,
  businesses: Business[],
  mode: string
): void {
  const scopeRef = useRef(scope);
  const bizRef = useRef(businesses);
  const seen = useRef<DirectoryScope | null>(null);
  const fittedAll = useRef(false);
  scopeRef.current = scope;
  bizRef.current = businesses;

  if (mode === 'view') {
    mapInstance.handleResetPosition = () => {
      const map = mapInstance.leafletMapRef.current;
      const camera = mapInstance.cameraController;
      if (!map) return;
      if (scopeRef.current === 'hadayek') {
        applyMapPlaceFrame(map, camera, 'hadayek', true);
        return;
      }
      applyMapPlaceFrame(map, camera, 'all', true);
      fitVisiblePins(map, camera, bizRef.current, true);
    };
  }

  useEffect(() => {
    if (mode !== 'view' || !mapInstance.isMapReady) return;
    const map = mapInstance.leafletMapRef.current;
    const camera = mapInstance.cameraController;
    if (!map) return;
    const first = seen.current === null;
    const changed = seen.current !== scope;
    seen.current = scope;
    if (changed && !(first && scope === 'hadayek')) {
      applyMapPlaceFrame(map, camera, scope, !first);
      fittedAll.current = false;
    }
    if (scope === 'all' && !fittedAll.current && businesses.length > 0) {
      fitVisiblePins(map, camera, businesses, !first);
      fittedAll.current = true;
    }
  }, [scope, mapInstance.isMapReady, mode, businesses.length]);
}
