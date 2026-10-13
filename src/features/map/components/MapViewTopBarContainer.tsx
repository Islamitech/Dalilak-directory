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
  directoryScope?: 'hadayek' | 'all';
  onDirectoryScopeChange?: (scope: 'hadayek' | 'all') => void;
}

export const MapViewTopBarContainer: React.FC<MapViewTopBarContainerProps> = ({
  mode,
  lat,
  lng,
  onViewList,
  businesses,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  onSelectZone,
  activeZone,
  matchingCount,
  onResetAll,
  filtersActive,
  directoryScope = 'hadayek',
  onDirectoryScopeChange,
}) => {
  if (mode !== 'view') {
    return null;
  }

  return (
    <MapCanvasTransit
      count={matchingCount ?? 0}
      onOpenList={onViewList}
      filtersActive={filtersActive}
      onReset={onResetAll}
    />
  );
};
