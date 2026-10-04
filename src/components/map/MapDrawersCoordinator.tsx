import React from 'react';
import { Business } from '../../types';
import { MapSelectedBusinessDrawer } from './MapSelectedBusinessDrawer';
import { BuildingDetailDrawer } from './BuildingDetailDrawer';
import { InAppNavigationDrawer } from './InAppNavigationDrawer';

export interface MapDrawersCoordinatorProps {
  mode: 'picker' | 'view';
  businesses: Business[];
  selectedBiz: Business | null;
  isSelectedBizExpandedOnMap: boolean;
  onClearFocusedBusiness?: () => void;
  onSelectBusiness?: (biz: Business) => void;
  selectedBuildingState: {
    buildingNumber: string;
    zoneLetter: string;
    lat: number;
    lng: number;
  } | null;
  onClearBuilding?: () => void;
  onSelectBuildingBusiness: (biz: Business) => void;
  onOpenRadar?: () => void;
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
  setSelectedBiz: (biz: Business | null) => void;
  setSelectedBuildingState: (bldg: any) => void;
}

export const MapDrawersCoordinator: React.FC<MapDrawersCoordinatorProps> = ({
  mode,
  businesses,
  selectedBiz,
  isSelectedBizExpandedOnMap,
  onClearFocusedBusiness,
  onSelectBusiness,
  selectedBuildingState,
  onClearBuilding,
  onSelectBuildingBusiness,
  onOpenRadar,
  navigationTargetState,
  onSetNavigationTarget,
  onCloseNavigation,
  onUpdateRoute,
  setSelectedBiz,
  setSelectedBuildingState,
}) => {
  if (mode !== 'view') return null;

  return (
    <>
      {/* 🏢 Selected Business Bottom Drawer */}
      {!navigationTargetState && !selectedBuildingState && selectedBiz && !isSelectedBizExpandedOnMap && (
        <MapSelectedBusinessDrawer
          selectedBiz={selectedBiz}
          setSelectedBiz={(biz) => {
            setSelectedBiz(biz);
            if (!biz && onClearFocusedBusiness) {
              onClearFocusedBusiness();
            }
          }}
          onSelectBusiness={onSelectBusiness}
          onStartNavigation={(biz) => {
            const target = {
              title: biz.nameAr,
              lat: biz.lat,
              lng: biz.lng,
              type: 'business' as const,
              details: biz.category,
            };
            onSetNavigationTarget(target);
          }}
        />
      )}

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
          onOpenRadar={onOpenRadar}
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
