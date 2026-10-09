import { MapTileLayerType } from '../constants/mapConstants';
import { HADAYEK_TILE_BOUNDS } from './mapBounds';

export interface TileLayerConfig {
  url: string;
  maxZoom: number;
  maxNativeZoom: number;
  subdomains: string[];
  attribution: string;
  keepBuffer: number;
  updateWhenIdle: boolean;
  updateWhenZooming: boolean;
  bounds: [[number, number], [number, number]];
  crossOrigin: boolean;
  className?: string;
}

export function getTileLayerConfig(type: MapTileLayerType): TileLayerConfig {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const commonOptions = {
    keepBuffer: isMobile ? 8 : 12,
    updateWhenIdle: false,
    updateWhenZooming: true,
    bounds: HADAYEK_TILE_BOUNDS,
    crossOrigin: true,
  };

  switch (type) {
    case 'google-streets':
      return {
        url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        maxZoom: 20,
        maxNativeZoom: 20,
        subdomains: ['0', '1', '2', '3'],
        attribution: 'Map data © Google',
        ...commonOptions,
      };
    case 'google-hybrid':
      return {
        url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        maxZoom: 20,
        maxNativeZoom: 20,
        subdomains: ['0', '1', '2', '3'],
        attribution: 'Map data © Google',
        ...commonOptions,
      };
    case 'dalelak-clean':
      return {
        url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        maxZoom: 20,
        maxNativeZoom: 19,
        subdomains: ['a', 'b', 'c'],
        attribution: '© OpenStreetMap contributors / Humanitarian OSM',
        ...commonOptions,
      };
    case 'dalelak-white':
    default:
      return {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        maxZoom: 20,
        maxNativeZoom: 19,
        subdomains: [],
        attribution: '© OpenStreetMap contributors',
        className: 'dl-tiles-white',
        ...commonOptions,
      };
    case 'esri-streets':
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 20,
        maxNativeZoom: 19,
        subdomains: [],
        attribution: 'Tiles © Esri — Source: Esri, HERE, Garmin, OpenStreetMap contributors',
        ...commonOptions,
      };
  }
}

export function applyTileLayer(map: any, currentLayerRef: { current: any }, newType: MapTileLayerType): any {
  if (!map || !window.L) return null;
  const previousLayer = currentLayerRef.current;
  const cfg = getTileLayerConfig(newType);
  const newLayer = window.L.tileLayer(cfg.url, {
    maxZoom: cfg.maxZoom,
    maxNativeZoom: cfg.maxNativeZoom,
    subdomains: cfg.subdomains,
    attribution: cfg.attribution,
    keepBuffer: cfg.keepBuffer,
    updateWhenIdle: cfg.updateWhenIdle,
    updateWhenZooming: cfg.updateWhenZooming,
    bounds: cfg.bounds,
    crossOrigin: cfg.crossOrigin,
    className: cfg.className,
  });

  newLayer.addTo(map);
  currentLayerRef.current = newLayer;

  if (previousLayer && previousLayer !== newLayer) {
    let finalized = false;
    const removePrevious = () => {
      if (finalized) return;
      finalized = true;
      try {
        if (map.hasLayer(previousLayer)) map.removeLayer(previousLayer);
      } catch {}
    };
    newLayer.once('load', removePrevious);
    setTimeout(removePrevious, 1200);
  }

  return newLayer;
}
