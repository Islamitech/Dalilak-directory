import { useState, useEffect, useCallback } from 'react';
import { Business } from '../../../types';
import { useMapState } from './useMapState';
import { TargetBuildingData } from '../../../features/map';
import { MapViewportSnapshot } from '../state/mapViewport';
import { useMapSheetBridge } from './useMapSheetBridge';

export interface InteractiveMapControllerParams {
  initialShowBusinesses?: boolean;
  defaultExpanded?: boolean;
  selectedZone?: string;
  categoryFilter?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  targetBuilding?: TargetBuildingData | null;
  focusedBusiness?: Business | null;
}

export function useInteractiveMapController({
  initialShowBusinesses = false,
  defaultExpanded = false,
  selectedZone,
  categoryFilter,
  searchQuery,
  onSearchChange,
  targetBuilding = null,
  focusedBusiness,
}: InteractiveMapControllerParams) {
  useMapSheetBridge();
  const state = useMapState({ initialShowBusinesses, defaultExpanded, initialSelectedZone: selectedZone });

  const handleSearchChange = useCallback((query: string) => {
    onSearchChange?.(query);
  }, [onSearchChange]);

  const [selectedBuildingState, setSelectedBuildingState] = useState<{
    buildingNumber: string;
    zoneLetter: string;
    lat: number;
    lng: number;
  } | null>(null);

  const [navigationTargetState, setNavigationTargetState] = useState<{
    title: string;
    lat: number;
    lng: number;
    type: 'building' | 'business';
    details?: string;
  } | null>(null);

  const [localRoute, setLocalRoute] = useState<{
    origin: { lat: number; lng: number; label: string };
    destination: { lat: number; lng: number; label: string };
  } | null>(null);

  const [viewportSnapshot, setViewportSnapshot] = useState<MapViewportSnapshot | null>(null);
  const [buildingSheetRequest, setBuildingSheetRequest] = useState(0);
  const requestBuildingSheet = useCallback(() => {
    setBuildingSheetRequest((current) => current + 1);
  }, []);

  useEffect(() => {
    if (targetBuilding?.buildingNumber && targetBuilding?.zoneLetter) {
      setSelectedBuildingState({
        buildingNumber: targetBuilding.buildingNumber,
        zoneLetter: targetBuilding.zoneLetter,
        lat: targetBuilding.lat || 0,
        lng: targetBuilding.lng || 0,
      });
    } else if (!targetBuilding) {
      setSelectedBuildingState(null);
    }
  }, [targetBuilding]);

  useEffect(() => {
    if (selectedZone !== undefined) state.setSelectedZone(selectedZone);
  }, [selectedZone, state.setSelectedZone]);

  useEffect(() => {
    if (categoryFilter !== undefined) state.setMapCategoryFilter(categoryFilter);
  }, [categoryFilter, state.setMapCategoryFilter]);

  useEffect(() => {
    if (focusedBusiness) {
      state.setSelectedBiz(focusedBusiness);
      state.setShowBusinesses(true);
      setSelectedBuildingState(null);
      setNavigationTargetState(null);
    }
  }, [focusedBusiness, state.setSelectedBiz, state.setShowBusinesses]);

  return {
    state,
    interactionState: {
      searchQuery: searchQuery || '',
      selectedZone: state.selectedZone,
      categoryFilter: state.mapCategoryFilter,
      selectedBusiness: state.selectedBiz,
      viewport: viewportSnapshot,
    },
    selectedBuildingState,
    setSelectedBuildingState,
    buildingSheetRequest,
    requestBuildingSheet,
    navigationTargetState,
    setNavigationTargetState,
    localRoute,
    setLocalRoute,
    handleSearchChange,
    onViewportSnapshotChange: setViewportSnapshot,
    setSelectedBusiness: state.setSelectedBiz,
  };
}
