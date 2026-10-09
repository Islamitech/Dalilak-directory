/**
 * 🗺️ Hadayek Al-Ahram Map Tile Preloader
 *
 * Pre-warms destination district tiles ahead of camera flights so panning shows no gray squares.
 */

import { MapTileLayerType } from '../constants/mapConstants';

export const HADAYEK_BOUNDS_COORDS: {
  sw: [number, number];
  ne: [number, number];
} = {
  sw: [29.9380, 31.0720], // Southwest (South of Gate 4 & Ring Road)
  ne: [29.9960, 31.1260], // Northeast (North of Gate Khufu & Mina)
};

/**
 * Convert GPS Latitude / Longitude to Slippy Map Tile (x, y) coordinates
 */
export function latLngToTileCoords(lat: number, lng: number, zoom: number): { x: number; y: number; z: number } {
  const n = 2 ** zoom;
  const rad = (lat * Math.PI) / 180;
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n);
  return { x, y, z: zoom };
}

/**
 * Get all tile coordinate pairs (x, y) required to completely cover a bounding box at a given zoom level
 */
export function getTileCoordinatesInBounds(
  sw: [number, number],
  ne: [number, number],
  zoom: number
): Array<{ x: number; y: number; z: number }> {
  const pTopLeft = latLngToTileCoords(ne[0], sw[1], zoom);
  const pBottomRight = latLngToTileCoords(sw[0], ne[1], zoom);

  const minX = Math.min(pTopLeft.x, pBottomRight.x);
  const maxX = Math.max(pTopLeft.x, pBottomRight.x);
  const minY = Math.min(pTopLeft.y, pBottomRight.y);
  const maxY = Math.max(pTopLeft.y, pBottomRight.y);

  const tiles: Array<{ x: number; y: number; z: number }> = [];
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      tiles.push({ x, y, z: zoom });
    }
  }
  return tiles;
}

/**
 * Construct valid HTTP tile URL based on current layer configuration
 */
export function buildTileUrl(type: MapTileLayerType, x: number, y: number, z: number, subIndex: number = 0): string {
  switch (type) {
    case 'google-streets': {
      const subdomains = ['0', '1', '2', '3'];
      const sub = subdomains[subIndex % subdomains.length];
      return `https://mt${sub}.google.com/vt/lyrs=m&x=${x}&y=${y}&z=${z}`;
    }
    case 'google-hybrid': {
      const subdomains = ['0', '1', '2', '3'];
      const sub = subdomains[subIndex % subdomains.length];
      return `https://mt${sub}.google.com/vt/lyrs=y&x=${x}&y=${y}&z=${z}`;
    }
    case 'dalelak-clean': {
      const subdomains = ['a', 'b', 'c'];
      const sub = subdomains[subIndex % subdomains.length];
      return `https://${sub}.tile.openstreetmap.fr/hot/${z}/${x}/${y}.png`;
    }
    case 'esri-streets': {
      return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`;
    }
    case 'dalelak-white':
    default: {
      return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    }
  }
}

// In-memory set of already preloaded image URLs to prevent redundant network requests
const preloadedTileUrls = new Set<string>();

/**
 * Instantly pre-warms destination district tiles for high-speed camera flights (zero blank squares)
 */
export function preloadDistrictTiles(
  districtLetter: string,
  boundsCoords?: [number, number][],
  tileType: MapTileLayerType = 'dalelak-white'
): void {
  if (typeof window === 'undefined' || !districtLetter || districtLetter.trim() === '') return;
  if (!boundsCoords || boundsCoords.length === 0) return;

  try {
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    boundsCoords.forEach(([lat, lng]) => {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });

    const sw: [number, number] = [minLat, minLng];
    const ne: [number, number] = [maxLat, maxLng];

    // Pre-fetch tiles for target zoom levels (15 & 16)
    const targetTiles = [
      ...getTileCoordinatesInBounds(sw, ne, 15),
      ...getTileCoordinatesInBounds(sw, ne, 16),
    ];

    targetTiles.slice(0, 16).forEach((tile, index) => {
      const url = buildTileUrl(tileType, tile.x, tile.y, tile.z, index);
      if (!preloadedTileUrls.has(url)) {
        preloadedTileUrls.add(url);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
      }
    });
  } catch {}
}
