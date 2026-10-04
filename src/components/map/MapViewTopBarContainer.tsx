import React from 'react';
import { Business } from '../../types';
import { MapModernTopBar } from './MapModernTopBar';
import { ZoneScopedSearchBar } from './ZoneScopedSearchBar';

export interface MapViewTopBarContainerProps {
  mode: 'picker' | 'view';
  lat: number;
  lng: number;
  setSelectedBuildingState: (bldg: any) => void;
  onClearBuilding?: () => void;
  effectiveTargetBuilding?: any;
  activeZone: string;
  state: any;
  businesses: Business[];
  externalOnSelectBuilding?: (bldg: any) => void;
  selectedBuildingState: any;
  onViewList?: () => void;
}

export const MapViewTopBarContainer: React.FC<MapViewTopBarContainerProps> = ({
  mode,
  lat,
  lng,
  setSelectedBuildingState,
  onClearBuilding,
  effectiveTargetBuilding,
  activeZone,
  state,
  businesses,
  externalOnSelectBuilding,
  selectedBuildingState,
  onViewList,
}) => {
  if (mode !== 'view' || Math.abs(lat - 29.9683) >= 0.06 || Math.abs(lng - 31.1002) >= 0.06) {
    return null;
  }

  return (
    <MapModernTopBar
      selectedZone={activeZone}
      buildingNumber={effectiveTargetBuilding?.buildingNumber}
      onViewList={onViewList}
    >
      <ZoneScopedSearchBar
        key={activeZone}
        selectedZone={activeZone}
        businesses={businesses}
        selectedBuilding={selectedBuildingState}
        onSelectBuilding={(bldg) => {
          setSelectedBuildingState(bldg);
          state.setSelectedBiz(null);
          if (externalOnSelectBuilding) externalOnSelectBuilding(bldg);
        }}
        onSelectBusiness={(biz) => {
          state.setSelectedBiz(biz);
          setSelectedBuildingState(null);
        }}
        onClearBuilding={() => {
          setSelectedBuildingState(null);
          if (onClearBuilding) onClearBuilding();
        }}
      />
    </MapModernTopBar>
  );
};
