import { useState, useEffect, useMemo, useCallback, useReducer } from 'react';
import { useMapState } from './useMapState';
import { createInitialMapState, mapStateReducer } from '../state/mapState';
import { TargetBuildingData } from '../../../features/map';

export interface InteractiveMapControllerParams {
  initialShowBusinesses?: boolean;
  defaultExpanded?: boolean;
  selectedZone?: string;
  categoryFilter?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  targetBuilding?: TargetBuildingData | null;
  focusedBusiness?: any;
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
  const legacyState = useMapState({ initialShowBusinesses, defaultExpanded, initialSelectedZone: selectedZone });
  const [interactionState, dispatchMapState] = useReducer(
    mapStateReducer,
    createInitialMapState({ searchQuery: searchQuery || '', selectedZone: selectedZone || '', categoryFilter: categoryFilter || 'all' })
  );

  const setMapZone = useCallback((zone: string) => dispatchMapState({ type: 'zone/set', zone }), []);
  const setMapCategory = useCallback((category: string) => dispatchMapState({ type: 'category/set', category }), []);
  const setSelectedBusiness = useCallback((biz: any) => dispatchMapState({ type: 'selection/set', business: biz }), []);
  const setSelectedBusinessExpanded = useCallback((expanded: boolean) => dispatchMapState({ type: 'selection/expand', expanded }), []);

  const handleSearchChange = useCallback((query: string) => {
    dispatchMapState({ type: 'search/set', query });
    onSearchChange?.(query);
  }, [onSearchChange]);

  const state = useMemo(() => ({
    ...legacyState,
    selectedZone: selectedZone !== undefined ? selectedZone : interactionState.selectedZone,
    setSelectedZone: setMapZone,
    mapCategoryFilter: categoryFilter !== undefined ? categoryFilter : interactionState.categoryFilter,
    setMapCategoryFilter: setMapCategory,
    selectedBiz: interactionState.selectedBusiness,
    setSelectedBiz: setSelectedBusiness,
    isSelectedBizExpandedOnMap: interactionState.selectedBusinessExpanded,
    setIsSelectedBizExpandedOnMap: setSelectedBusinessExpanded,
  }), [legacyState, selectedZone, categoryFilter, interactionState, setMapZone, setMapCategory, setSelectedBusiness, setSelectedBusinessExpanded]);

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

  useEffect(() => { if (selectedZone !== undefined) setMapZone(selectedZone); }, [selectedZone, setMapZone]);
  useEffect(() => { if (categoryFilter !== undefined) setMapCategory(categoryFilter); }, [categoryFilter, setMapCategory]);
  useEffect(() => { if (searchQuery !== undefined) dispatchMapState({ type: 'search/set', query: searchQuery }); }, [searchQuery]);

  useEffect(() => {
    if (focusedBusiness) {
      setSelectedBusiness(focusedBusiness);
      legacyState.setShowBusinesses(true);
      setSelectedBuildingState(null);
      setNavigationTargetState(null);
    }
  }, [focusedBusiness, setSelectedBusiness, legacyState.setShowBusinesses]);

  const onViewportSnapshotChange = useCallback((viewport: any) => {
    dispatchMapState({ type: 'viewport/set', viewport });
  }, []);

  return {
    state,
    interactionState,
    selectedBuildingState,
    setSelectedBuildingState,
    navigationTargetState,
    setNavigationTargetState,
    localRoute,
    setLocalRoute,
    handleSearchChange,
    onViewportSnapshotChange,
    setSelectedBusiness,
  };
}
