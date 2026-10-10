import type { Business } from '../../../types';
import type { DirectoryScope } from '../../../utils/directoryScope';
import { hasMapCoordinates, isEgyptMapPoint } from '../../../utils/directoryScope';
import { HADAYEK_BOUNDS, HADAYEK_TILE_BOUNDS, HADAYEK_VIEW_BOUNDS } from './mapBounds';

let coverageTicket = 0;

/** Street tiles follow the open view. Hadayek mode puts the fence back after the camera arrives. */
function syncBasemapCoverage(map: any, scope: DirectoryScope): void {
  if (!map || !window.L) return;
  const bounds = scope === 'hadayek' ? window.L.latLngBounds(HADAYEK_TILE_BOUNDS) : null;
  try {
    map.eachLayer((layer: any) => {
      if (!layer?._url || typeof layer.redraw !== 'function') return;
      layer.options.bounds = bounds;
      layer.redraw();
    });
  } catch {
    /* map already removed */
  }
}

export function applyMapPlaceFrame(map: any, camera: any, scope: DirectoryScope, animate: boolean): void {
  if (!map) return;
  const ticket = ++coverageTicket;
  const mobile = typeof window !== 'undefined' && window.innerWidth < 640;
  if (scope === 'hadayek') {
    syncBasemapCoverage(map, 'all');
    map.setMaxBounds(HADAYEK_BOUNDS);
    map.setMinZoom(mobile ? 12.8 : 13.2);
    camera?.request(
      { kind: 'fitBounds', bounds: HADAYEK_VIEW_BOUNDS, options: { padding: [12, 12], maxZoom: 14.5, animate } },
      'user'
    );
    window.setTimeout(() => {
      if (ticket === coverageTicket) syncBasemapCoverage(map, 'hadayek');
    }, animate ? 2600 : 0);
    return;
  }
  syncBasemapCoverage(map, 'all');
  map.setMaxBounds(null);
  map.setMinZoom(6);
}

export function fitVisiblePins(map: any, camera: any, businesses: Business[], animate: boolean): void {
  if (!map || !camera || !window.L) return;
  const points = businesses
    .filter((biz) => hasMapCoordinates(biz) && isEgyptMapPoint(biz.lat as number, biz.lng as number))
    .map((biz) => [biz.lat as number, biz.lng as number]);
  const bounds = points.length > 0 ? window.L.latLngBounds(points) : HADAYEK_VIEW_BOUNDS;
  camera.request(
    { kind: 'fitBounds', bounds, options: { padding: [28, 28], maxZoom: 11, animate } },
    'user'
  );
}
