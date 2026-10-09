import React, { useEffect, useState } from 'react';
import { Business } from '../../types';
import { EntitySheet, type EntitySheetSnap } from '../../shared/ui';
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
    preferredGateId?: string;
  } | null;
  onSetNavigationTarget: (target: any) => void;
  onCloseNavigation: () => void;
  onUpdateRoute?: (route: any) => void;
  setSelectedBuildingState: (bldg: any) => void;
}

export const MapDrawersCoordinator: React.FC<MapDrawersCoordinatorProps> = ({
  mode,
  businesses,
  selectedBuildingState,
  onClearBuilding,
  onSelectBuildingBusiness,
  navigationTargetState,
  onSetNavigationTarget,
  onCloseNavigation,
  onUpdateRoute,
}) => {
  const [snap, setSnap] = useState<EntitySheetSnap>('peek');
  const [activityOpen, setActivityOpen] = useState(false);
  const buildingKey = selectedBuildingState
    ? `${selectedBuildingState.zoneLetter}:${selectedBuildingState.buildingNumber}`
    : '';

  useEffect(() => {
    setSnap('peek');
  }, [buildingKey]);

  useEffect(() => {
    const onActivity = (event: Event) => {
      setActivityOpen(Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open));
    };
    window.addEventListener('map:activity-sheet', onActivity);
    return () => window.removeEventListener('map:activity-sheet', onActivity);
  }, []);

  if (mode !== 'view') return null;

  const closeBuilding = () => {
    if (window.history.state?.buildingSheet) {
      window.history.back();
      return;
    }
    onClearBuilding?.();
  };

  const showBuilding = Boolean(selectedBuildingState) && !navigationTargetState && !activityOpen;

  return (
    <>
      {showBuilding && selectedBuildingState && (
        <EntitySheet
          snap={snap}
          onSnapChange={setSnap}
          onClose={closeBuilding}
          placement="map"
          ariaLabel={`عمارة ${selectedBuildingState.buildingNumber}`}
          peek={
            <MapBuildingPreviewCard
              building={selectedBuildingState}
              businesses={businesses}
              onOpenDetails={() => setSnap('half')}
            />
          }
        >
          <BuildingDetailDrawer
            building={selectedBuildingState}
            businesses={businesses}
            onClose={closeBuilding}
            onSelectBusiness={onSelectBuildingBusiness}
            onStartNavigation={(target) => onSetNavigationTarget(target)}
          />
        </EntitySheet>
      )}

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
