import { createNavigationPinHtml } from '../../../components/map/badgeMarkers';

export interface ActiveRouteData {
  origin: { lat: number; lng: number; label: string };
  destination: { lat: number; lng: number; label: string };
  points?: [number, number][];
  distanceMeters?: number;
  durationSeconds?: number;
}

export function renderRouteLayer(
  routeLayer: any,
  activeRoute: ActiveRouteData | null,
  cameraController: any
): void {
  if (!routeLayer || !window.L) return;
  routeLayer.clearLayers();
  if (!activeRoute || !activeRoute.origin || !activeRoute.destination) return;

  const { origin, destination } = activeRoute;
  const routePoints: [number, number][] =
    activeRoute.points && activeRoute.points.length > 1
      ? activeRoute.points
      : [
          [origin.lat, origin.lng],
          [destination.lat, destination.lng],
        ];

  // White casing + soft amber glow + solid amber line + a flowing dash that shows the direction of travel.
  const casing = window.L.polyline(routePoints, {
    color: '#ffffff',
    weight: 11,
    opacity: 0.95,
    lineCap: 'round',
    lineJoin: 'round',
    interactive: false,
  });
  routeLayer.addLayer(casing);

  const routeLine = window.L.polyline(routePoints, {
    color: '#f59e0b',
    weight: 6,
    opacity: 1,
    lineCap: 'round',
    lineJoin: 'round',
    interactive: false,
  });
  routeLayer.addLayer(routeLine);

  const flowLine = window.L.polyline(routePoints, {
    color: '#ffffff',
    weight: 2.5,
    opacity: 0.95,
    dashArray: '2 14',
    lineCap: 'round',
    lineJoin: 'round',
    className: 'nav-route-flow',
    interactive: false,
  });
  routeLayer.addLayer(flowLine);
  const originPinData = createNavigationPinHtml('origin', origin.label);
  const originIcon = window.L.divIcon({
    className: 'route-origin-pin',
    html: originPinData.html,
    iconSize: originPinData.iconSize,
    iconAnchor: originPinData.iconAnchor,
  });
  const originMarker = window.L.marker([origin.lat, origin.lng], {
    icon: originIcon,
    pane: 'pinsPane',
    zIndexOffset: 1500,
  });
  routeLayer.addLayer(originMarker);

  const destPinData = createNavigationPinHtml('destination', destination.label);
  const destIcon = window.L.divIcon({
    className: 'route-dest-pin',
    html: destPinData.html,
    iconSize: destPinData.iconSize,
    iconAnchor: destPinData.iconAnchor,
  });
  const destMarker = window.L.marker([destination.lat, destination.lng], {
    icon: destIcon,
    pane: 'pinsPane',
    zIndexOffset: 1510,
  });
  routeLayer.addLayer(destMarker);

  try {
    const bounds = window.L.latLngBounds(routePoints);
    cameraController?.request({ kind: 'flyToBounds', bounds, options: { paddingTopLeft: [48, 100], paddingBottomRight: [48, 100], maxZoom: 16.5, duration: 0.8 } }, 'route');
  } catch {}
}
