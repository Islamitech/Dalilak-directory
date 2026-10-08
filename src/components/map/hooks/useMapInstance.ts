import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchLocationAddress } from '../../../utils/geocoding';
import { MapTileLayerType } from '../constants/mapConstants';
import { loadLeafletScript } from '../utils/leafletLoader';
import { CameraController } from '../controllers/CameraController';
import {
  HADAYEK_BOUNDS,
  HADAYEK_VIEW_BOUNDS,
  HADAYEK_TILE_BOUNDS,
  applyTileLayer,
  createLeafletMapInstance,
  calculatePanOffset,
  type UseMapInstanceProps,
} from '../../../features/map';

export { HADAYEK_BOUNDS, HADAYEK_VIEW_BOUNDS, HADAYEK_TILE_BOUNDS };
export type { UseMapInstanceProps };

export const useMapInstance = ({
  containerRef,
  mode = 'view',
  lat = 29.9683,
  lng = 31.1002,
  zoomLevel: initialZoom = 14,
  isExpanded = false,
  onLocationSelect,
}: UseMapInstanceProps) => {
  const [currentLat, setCurrentLat] = useState(lat);
  const [currentLng, setCurrentLng] = useState(lng);
  const [zoomLevel, setZoomLevel] = useState(initialZoom);
  const [tileLayer, setTileLayer] = useState<MapTileLayerType>('dalelak-white');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapScriptError, setMapScriptError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const leafletMapRef = useRef<any>(null);
  const cameraControllerRef = useRef<CameraController | null>(null);
  const tileLayerRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const pickerMarkerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);
  const liveCenterRef = useRef({ lat, lng, zoom: zoomLevel });

  const retryLoadMap = useCallback(() => { setMapScriptError(null); setReloadKey((k) => k + 1); }, []);
  const switchTileLayer = useCallback((newType: MapTileLayerType) => {
    setTileLayer(newType);
    applyTileLayer(leafletMapRef.current, tileLayerRef, newType);
  }, []);

  const updateSelectedPosition = useCallback(async (newLat: number, newLng: number, fly = true, customZoom?: number) => {
    setCurrentLat(newLat); setCurrentLng(newLng);
    liveCenterRef.current.lat = newLat; liveCenterRef.current.lng = newLng;
    if (fly) cameraControllerRef.current?.request({ kind: 'flyTo', center: [newLat, newLng], zoom: customZoom || 17, options: { duration: 1.0 } }, 'locate');
    if (pickerMarkerRef.current) pickerMarkerRef.current.setLatLng([newLat, newLng]);
    if (onLocationSelect) {
      const addr = await fetchLocationAddress(newLat, newLng);
      onLocationSelect(newLat, newLng, addr);
    }
  }, [onLocationSelect]);

  useEffect(() => {
    if (!containerRef.current) return;
    let isSubscribed = true;
    const cleanupLoader = loadLeafletScript({
      onSuccess: () => {
        if (!isSubscribed || !containerRef.current || !window.L || leafletMapRef.current) return;
        setMapScriptError(null);
        const { map, cameraController } = createLeafletMapInstance({ container: containerRef.current, center: liveCenterRef.current, zoomLevel, mode });
        cameraControllerRef.current = cameraController;
        applyTileLayer(map, tileLayerRef, tileLayer);
        markersGroupRef.current = window.L.layerGroup().addTo(map);
        leafletMapRef.current = map;
        (containerRef.current as any)._leaflet_map = map;
        setIsMapReady(true);
        map.on('zoomend moveend', () => {
          if (!isSubscribed) return;
          try {
            const c = map.getCenter(); const z = map.getZoom();
            if (c && typeof c.lat === 'number') liveCenterRef.current = { lat: c.lat, lng: c.lng, zoom: z };
            setZoomLevel(z);
          } catch {}
        });
        map.on('click', (e: any) => { if (mode === 'picker') updateSelectedPosition(e.latlng.lat, e.latlng.lng, false); });
      },
      onError: () => { if (isSubscribed) setMapScriptError('تعذر تحميل محرك الخريطة من المصدر. يرجى التحقق من الاتصال بالإنترنت.'); },
    });
    return () => {
      isSubscribed = false; cleanupLoader(); setIsMapReady(false);
      cameraControllerRef.current?.destroy(); cameraControllerRef.current = null;
      leafletMapRef.current?.remove(); leafletMapRef.current = null;
    };
  }, [mode, reloadKey]);

  useEffect(() => {
    if (leafletMapRef.current && isMapReady) {
      const timer = setTimeout(() => leafletMapRef.current?.invalidateSize({ animate: false, pan: false }), 150);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, isMapReady]);

  return {
    leafletMapRef, cameraController: cameraControllerRef.current, isMapReady, mapScriptError,
    retryLoadMap, markersGroupRef, pickerMarkerRef, accuracyCircleRef, liveCenterRef,
    currentLat, currentLng, zoomLevel, tileLayer, gpsAccuracy, setGpsAccuracy,
    switchTileLayer, updateSelectedPosition,
    handlePan: (dir: 'up' | 'down' | 'left' | 'right') => cameraControllerRef.current?.request({ kind: 'panBy', offset: calculatePanOffset(dir), options: { animate: true, duration: 0.25 } }, 'user'),
    handleZoomIn: () => cameraControllerRef.current?.request({ kind: 'zoom', delta: 1 }, 'user'),
    handleZoomOut: () => cameraControllerRef.current?.request({ kind: 'zoom', delta: -1 }, 'user'),
    handleResetPosition: () => cameraControllerRef.current?.request({ kind: 'flyTo', center: [lat, lng], zoom: 16, options: { duration: 0.8 } }, 'user'),
    handlePinCenterOfMap: () => { if (leafletMapRef.current) { const c = leafletMapRef.current.getCenter(); updateSelectedPosition(c.lat, c.lng, false); } },
  };
};
