export interface MapViewportSnapshot {
  revision: number;
  center: { lat: number; lng: number };
  zoom: number;
  bounds: { south: number; west: number; north: number; east: number };
  size: { width: number; height: number };
}

/** Capture one internally consistent Leaflet viewport for filtering and rendering. */
export function createMapViewportSnapshot(map: any, revision: number): MapViewportSnapshot {
  const center = map.getCenter();
  const bounds = map.getBounds();
  const size = map.getSize();
  const southWest = bounds.getSouthWest();
  const northEast = bounds.getNorthEast();
  return {
    revision,
    center: { lat: center.lat, lng: center.lng },
    zoom: map.getZoom(),
    bounds: { south: southWest.lat, west: southWest.lng, north: northEast.lat, east: northEast.lng },
    size: { width: size.x, height: size.y },
  };
}
