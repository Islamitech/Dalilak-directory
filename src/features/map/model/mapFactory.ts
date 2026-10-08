import { HADAYEK_BOUNDS, HADAYEK_VIEW_BOUNDS } from './mapBounds';
import { CameraController } from '../../../components/map/controllers/CameraController';

import { LocationAddressData } from '../../../utils/geocoding';

export interface UseMapInstanceProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  mode?: 'picker' | 'view';
  lat?: number;
  lng?: number;
  zoomLevel?: number;
  isExpanded?: boolean;
  onLocationSelect?: (lat: number, lng: number, addressDetails?: LocationAddressData) => void;
}

export interface MapInstanceInitOptions {
  container: HTMLDivElement;
  center: { lat: number; lng: number; zoom?: number };
  zoomLevel: number;
  mode: 'picker' | 'view';
}

export function createLeafletMapInstance(options: MapInstanceInitOptions): {
  map: any;
  cameraController: CameraController;
} {
  const { container, center, zoomLevel, mode } = options;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  try {
    if ((container as any)._leaflet_id) {
      (container as any)._leaflet_id = null;
    }
  } catch {}

  const map = window.L.map(container, {
    center: [center.lat, center.lng],
    zoom: center.zoom || zoomLevel,
    zoomControl: false,
    attributionControl: false,
    zoomSnap: 0.5,
    zoomDelta: 0.5,
    wheelPxPerZoomLevel: 80,
    zoomAnimation: true,
    fadeAnimation: true,
    markerZoomAnimation: true,
    inertia: true,
    inertiaDeceleration: 3500,
    inertiaMaxSpeed: 1600,
    easeLinearity: 0.25,
    bounceAtZoomLimits: false,
    maxBoundsViscosity: 0.75,
  });

  const cameraController = new CameraController(map);

  if (mode === 'view') {
    map.setMaxBounds(HADAYEK_BOUNDS);
    map.options.minZoom = isMobile ? 12.8 : 13.2;
    map.options.maxZoom = 19.5;
    try {
      cameraController.request(
        { kind: 'fitBounds', bounds: HADAYEK_VIEW_BOUNDS, options: { padding: [12, 12], maxZoom: 14.5, animate: false } },
        'initial'
      );
    } catch {}
  } else {
    map.options.minZoom = 6;
    map.options.maxZoom = 19.5;
  }

  return { map, cameraController };
}

export function calculatePanOffset(direction: 'up' | 'down' | 'left' | 'right'): [number, number] {
  const offset = 140;
  const panMap: Record<string, [number, number]> = {
    up: [0, -offset],
    down: [0, offset],
    left: [-offset, 0],
    right: [offset, 0],
  };
  return panMap[direction] || [0, 0];
}
