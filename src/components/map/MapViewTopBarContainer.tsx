import React from 'react';
import { Business } from '../../types';
import { MapModernTopBar } from './MapModernTopBar';

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
}

export const MapViewTopBarContainer: React.FC<MapViewTopBarContainerProps> = ({
  mode,
  lat,
  lng,
  activeZone,
  businesses,
  onViewList,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  onSelectZone,
  matchingCount,
  onResetAll,
}) => {
  if (mode !== 'view' || Math.abs(lat - 29.9683) >= 0.06 || Math.abs(lng - 31.1002) >= 0.06) {
    return null;
  }

  return (
    <MapModernTopBar
      selectedZone={activeZone}
      onViewList={onViewList}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      selectedCategory={categoryFilter}
      onCategoryChange={onCategoryChange}
      onZoneChange={onSelectZone}
      businesses={businesses}
      matchingCount={matchingCount}
      onResetAll={onResetAll}
    />
  );
};
