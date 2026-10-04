import React from 'react';
import { Business } from '../../types';
import { BuildingDetailDrawer } from './BuildingDetailDrawer';
import { InAppNavigationDrawer } from './InAppNavigationDrawer';

export interface MapDrawersCoordinatorProps {
  mode: 'picker' | 'view';
  businesses: Business[];
  onSelectBusiness?: (biz: Business) => void;
  selectedBuildingState: {
    buildingNumber: string;
    zoneLetter: string;
    lat: number;
    lng: number;
  } | null;
  onClearBuilding?: () => void;
  onSelectBuildingBusiness: (biz: Business) => void;
  navigationTargetState: {
    title: string;
    lat: number;
    lng: number;
    type: 'building' | 'business';
    details?: string;
  } | null;
  onSetNavigationTarget: (target: any) => void;
  onCloseNavigation: () => void;
  onUpdateRoute?: (route: any) => void;
  setSelectedBuildingState: (bldg: any) => void;
}

export const MapDrawersCoordinator: React.FC<MapDrawersCoordinatorProps> = ({
  mode,
  businesses,
  onSelectBusiness,
  selectedBuildingState,
  onClearBuilding,
  onSelectBuildingBusiness,
  navigationTargetState,
  onSetNavigationTarget,
  onCloseNavigation,
  onUpdateRoute,
  setSelectedBuildingState,
}) => {
  if (mode !== 'view') return null;

  return (
    <>
      {/* 🏢 Selected Building Detail Drawer */}
      {!navigationTargetState && selectedBuildingState && (
        <BuildingDetailDrawer
          building={selectedBuildingState}
          businesses={businesses}
          onClose={() => {
            setSelectedBuildingState(null);
            if (onClearBuilding) onClearBuilding();
          }}
          onSelectBusiness={onSelectBuildingBusiness}
          onStartNavigation={(target) => {
            onSetNavigationTarget(target);
          }}
        />
      )}

      {/* 🧭 Interactive In-App Navigation Drawer */}
      {navigationTargetState && (
        <InAppNavigationDrawer
          target={navigationTargetState}
          onClose={onCloseNavigation}
          onUpdateRoute={onUpdateRoute}
        />
      )}
    </>
  );
};
