import React from 'react';
import { Business } from '../../../types';
import { ViewSegmentedSwitch } from '../../../components/layout/ViewSegmentedSwitch';
import { UnifiedSearchFilterBar } from '../../search';

export interface MapModernTopBarProps {
  onViewList?: () => void;
  businesses?: Business[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  categoryFilter?: string;
  onCategoryChange?: (category: string) => void;
  selectedZone?: string;
  onZoneChange?: (zone: string) => void;
}

/** Map/list switch plus the same category and zone filters as the activity list. */
export const MapModernTopBar: React.FC<MapModernTopBarProps> = ({
  onViewList,
  businesses = [],
  searchQuery = '',
  onSearchChange,
  categoryFilter = 'all',
  onCategoryChange,
  selectedZone = 'all',
  onZoneChange,
}) => {
  return (
    <div dir="rtl" data-map-top-bar className="absolute top-2 inset-x-2 sm:inset-x-4 z-[1000] pointer-events-none">
      <div className="relative mx-auto flex max-w-full flex-wrap items-center justify-center gap-1.5">
        <div className="pointer-events-auto shrink-0 rounded-pill bg-white/92 p-0.5 shadow-sm backdrop-blur-md border border-slate-200/80">
          <ViewSegmentedSwitch
            activeView="map"
            size="sm"
            onViewChange={(view) => {
              if (view === 'list') onViewList?.();
            }}
          />
        </div>
        {onCategoryChange && onZoneChange && (
          <div className="pointer-events-auto rounded-pill bg-white/92 px-1 py-0.5 shadow-sm backdrop-blur-md border border-slate-200/80">
            <UnifiedSearchFilterBar
              businesses={businesses}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              selectedCategory={categoryFilter}
              onCategoryChange={onCategoryChange}
              selectedZone={selectedZone}
              onZoneChange={onZoneChange}
              variant="map"
            />
          </div>
        )}
      </div>
    </div>
  );
};
