import { MutableRefObject } from 'react';
import { Business } from '../../../types';
import { MapLayerGroups } from './mapPanes';
import { DistrictPolygonItem, updateDistrictHighlightStyles } from './mapDistrictsLayer';
import { renderGatesMarkers } from './mapGatesLayer';
import { renderRouteLayer, ActiveRouteData } from './mapRouteLayer';
import { renderTargetBuildingMarker, TargetBuildingData } from './mapTargetBuildingLayer';
import { renderSelectedBusinessMarker } from './mapSelectedMarker';
import type { MapViewportSnapshot } from '../state/mapViewport';

export interface UseMapPinsClusteringProps {
  mapInstance: any;
  state: any;
  mode?: 'picker' | 'view';
  businesses: Business[];
  showHadayekGates?: boolean;
  selectedZone?: string;
  categoryFilter?: string;
  searchQuery?: string;
  buildingSearchActive?: boolean;
  targetBuilding?: TargetBuildingData | null;
  onSelectBusiness?: (biz: Business) => void;
  onSelectZone?: (zoneLetter: string) => void;
  onSelectBuilding?: (building: { buildingNumber: string; zoneLetter: string; lat: number; lng: number }) => void;
  onClearFocusedBusiness?: () => void;
  onStartBusinessNavigation?: (biz: Business) => void;
  activeRoute?: ActiveRouteData | null;
  viewportSnapshot?: MapViewportSnapshot | null;
  onViewportSnapshotChange?: (snapshot: MapViewportSnapshot) => void;
  resultsReady?: boolean;
}

export interface SyncAuxiliaryLayersParams {
  layers: MapLayerGroups | null;
  districts: DistrictPolygonItem[];
  mask: any;
  effectiveZone: string;
  effectiveCategory: string;
  buildingSearchActive: boolean;
  targetBuilding: TargetBuildingData | null;
  showHadayekGates: boolean;
  showGatesLayer: boolean;
  showTargetPin: boolean;
  onSelectBuilding?: (b: { buildingNumber: string; zoneLetter: string; lat: number; lng: number }) => void;
  cameraController: any;
  zoomLevel: number;
  activeRoute?: ActiveRouteData | null;
  selectedBiz: Business | null;
  selectedMarkerRef: MutableRefObject<any>;
  onSelectBusiness?: (biz: Business) => void;
  onClearSelectedBiz: () => void;
  onStartBusinessNavigation?: (biz: Business) => void;
}

export function syncAuxiliaryLayers(p: SyncAuxiliaryLayersParams): void {
  if (!p.layers) return;

  const shouldHighlight = Boolean(p.effectiveZone) && !p.buildingSearchActive && !p.targetBuilding;
  updateDistrictHighlightStyles(p.districts, p.mask, p.effectiveZone, shouldHighlight);

  if (p.showHadayekGates) {
    renderGatesMarkers(p.layers.gatesLayerGroup, p.effectiveZone);
  }

  // While a route is active the destination pin of the route replaces the target-building pin.
  renderTargetBuildingMarker(p.layers.targetLayerGroup, p.targetBuilding, p.showTargetPin && !p.activeRoute, p.onSelectBuilding);
  renderRouteLayer(p.layers.routeLayerGroup, p.activeRoute ?? null, p.cameraController);

  renderSelectedBusinessMarker(
    p.layers.selectedLayerGroup,
    p.selectedMarkerRef,
    p.selectedBiz,
    p.onSelectBusiness,
    p.onClearSelectedBiz,
    p.onStartBusinessNavigation
  );
}
