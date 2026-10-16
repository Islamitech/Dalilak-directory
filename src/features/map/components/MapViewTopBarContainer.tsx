import React from 'react';
import { Business } from '../../../types';
import { MapCanvasTransit } from './MapCanvasTransit';

export interface MapViewTopBarContainerProps {
  mode: 'picker' | 'view';
  lat: number;
  lng: number;
  activeZone: string;
  businesses: Business[];
  onViewList?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  categoryFilter?: string;
  onCategoryChange?: (cat: string) => void;
  onSelectZone?: (zone: string) => void;
  matchingCount?: number;
  onResetAll?: () => void;
  filtersActive?: boolean;
  onDirectoryScopeChange?: (scope: 'hadayek' | 'all') => void;
}

export const MapViewTopBarContainer: React.FC<MapViewTopBarContainerProps> = ({
  mode,
  onViewList,
  matchingCount,
  onResetAll,
  filtersActive,
}) => {
  if (mode !== 'view') {
    return null;
  }

  return (
    <div className="absolute top-2.5 start-2.5 end-2.5 sm:end-auto z-[990] pointer-events-none flex flex-col gap-2">
      <MapCanvasTransit
        count={matchingCount ?? 0}
        onOpenList={onViewList}
        filtersActive={filtersActive}
        onReset={onResetAll}
      />
    </div>
  );
};
