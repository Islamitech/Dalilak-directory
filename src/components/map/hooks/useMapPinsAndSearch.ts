import { useEffect } from 'react';
import { useMapPinsClustering } from './useMapPinsClustering';
import { useMapGeolocation } from './useMapGeolocation';
import { useMapSearch } from './useMapSearch';
import { useTargetBuildingCamera } from './useTargetBuildingCamera';
import { Business } from '../../../types';

export interface UseMapPinsAndSearchParams {
  mapInstance: any;
  state: any;
  mode: 'picker' | 'view';
  businesses: Business[];
  showHadayekGates: boolean;
  activeZone: string;
  activeCategory: string;
  activeSearchQuery: string;
  effectiveTargetBuilding: any;
  buildingSearchActive: boolean;
  handleClusteringSelectBusiness: (b: any) => void;
  onSelectZone?: (z: string) => void;
  handleClusteringSelectBuilding: (bldg: any) => void;
  onClearFocusedBusiness?: () => void;
  onStartBusinessNavigation?: (biz: Business) => void;
  activeRoute: any;
  viewportSnapshot: any;
  onViewportSnapshotChange: (v: any) => void;
}

export function useMapPinsAndSearch(p: UseMapPinsAndSearchParams) {
  useTargetBuildingCamera(p.effectiveTargetBuilding, p.mapInstance);

  useMapPinsClustering({
    mapInstance: p.mapInstance,
    state: p.state,
    mode: p.mode,
    businesses: p.businesses,
    showHadayekGates: p.showHadayekGates,
    selectedZone: p.activeZone,
    categoryFilter: p.activeCategory,
    searchQuery: p.activeSearchQuery,
    targetBuilding: p.effectiveTargetBuilding,
    buildingSearchActive: p.buildingSearchActive,
    onSelectBusiness: p.handleClusteringSelectBusiness,
    onSelectZone: p.onSelectZone,
    onSelectBuilding: p.handleClusteringSelectBuilding,
    onClearFocusedBusiness: p.onClearFocusedBusiness,
    onStartBusinessNavigation: p.onStartBusinessNavigation,
    activeRoute: p.activeRoute,
    viewportSnapshot: p.viewportSnapshot,
    onViewportSnapshotChange: p.onViewportSnapshotChange,
  });

  const geolocation = useMapGeolocation({
    updateSelectedPosition: p.mapInstance.updateSelectedPosition,
    setGpsAccuracy: p.mapInstance.setGpsAccuracy,
  });

  const search = useMapSearch({
    updateSelectedPosition: async (flat, flng, flyTo, zoom) => {
      await p.mapInstance.updateSelectedPosition(flat, flng, flyTo, zoom);
    },
  });

  useEffect(() => {
    if (p.mapInstance.isMapReady && p.mapInstance.leafletMapRef.current) {
      const timer = setTimeout(() => {
        p.mapInstance.leafletMapRef.current?.invalidateSize();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [p.mapInstance.isMapReady]);

  return { geolocation, search };
}
