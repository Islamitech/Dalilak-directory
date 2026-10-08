import React, { useEffect, useRef, useState } from 'react';
import { Business } from '../../types';
import { BuildingDetailDrawer } from './BuildingDetailDrawer';
import { InAppNavigationDrawer } from './InAppNavigationDrawer';
import { MapBuildingPreviewCard } from './MapBuildingPreviewCard';

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
  buildingSheetRequest?: number;
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
  buildingSheetRequest = 0,
  onClearBuilding,
  onSelectBuildingBusiness,
  navigationTargetState,
  onSetNavigationTarget,
  onCloseNavigation,
  onUpdateRoute,
  setSelectedBuildingState,
}) => {
  const [isBuildingDetailsOpen, setIsBuildingDetailsOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const buildingKey = selectedBuildingState
    ? `${selectedBuildingState.zoneLetter}:${selectedBuildingState.buildingNumber}`
    : '';
  const previousBuildingKey = useRef(buildingKey);

  useEffect(() => {
    if (previousBuildingKey.current !== buildingKey) {
      setIsBuildingDetailsOpen(false);
      setSheetOpen(false);
      previousBuildingKey.current = buildingKey;
    }
  }, [buildingKey]);

  useEffect(() => {
    if (buildingSheetRequest > 0) setSheetOpen(true);
  }, [buildingSheetRequest]);

  if (mode !== 'view') return null;

  return (
    <>
      {/* 🏢 Selected Building Detail Drawer */}
      {!navigationTargetState && selectedBuildingState && sheetOpen && !isBuildingDetailsOpen && (
        <MapBuildingPreviewCard
          building={selectedBuildingState}
          businesses={businesses}
          onOpenDetails={() => setIsBuildingDetailsOpen(true)}
          onClose={() => {
            setSheetOpen(false);
            setIsBuildingDetailsOpen(false);
          }}
        />
      )}

      {!navigationTargetState && selectedBuildingState && sheetOpen && isBuildingDetailsOpen && (
        <BuildingDetailDrawer
          building={selectedBuildingState}
          businesses={businesses}
          onClose={() => setIsBuildingDetailsOpen(false)}
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
