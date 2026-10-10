import React from 'react';
import { Business } from '../../../types';
import { ViewSegmentedSwitch } from '../../../components/layout/ViewSegmentedSwitch';
import { UnifiedSearchFilterBar } from '../../search';
import { DirectoryScopeSwitch } from '../../../components/views/DirectoryScopeSwitch';
import type { DirectoryScope } from '../../../utils/directoryScope';

export interface MapModernTopBarProps {
  onViewList?: () => void;
  businesses?: Business[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  categoryFilter?: string;
  onCategoryChange?: (category: string) => void;
  selectedZone?: string;
  onZoneChange?: (zone: string) => void;
  directoryScope?: DirectoryScope;
  onDirectoryScopeChange?: (scope: DirectoryScope) => void;
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
  directoryScope = 'hadayek',
  onDirectoryScopeChange,
}) => {
  return (
    <div dir="rtl" data-map-top-bar className="absolute top-2 inset-x-2 sm:inset-x-4 z-[1000] pointer-events-none flex justify-center">
      <div className="pointer-events-auto flex flex-nowrap overflow-x-auto no-scrollbar items-center justify-center gap-2 max-w-full py-1">
        <div className="shrink-0 rounded-pill bg-white border border-slate-200/80 shadow-sm p-0.5">
          <ViewSegmentedSwitch
            activeView="map"
            size="sm"
            onViewChange={(view) => {
              if (view === 'list') onViewList?.();
            }}
          />
        </div>
        {onCategoryChange && (
          <div className="rounded-pill bg-white border border-slate-200/80 shadow-sm px-1 py-0.5">
            <UnifiedSearchFilterBar
              businesses={businesses}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              selectedCategory={categoryFilter}
              onCategoryChange={onCategoryChange}
              selectedZone={selectedZone}
              onZoneChange={onZoneChange || (() => {})}
              showZone={directoryScope === 'hadayek' && Boolean(onZoneChange)}
              variant="map"
            />
          </div>
        )}
      </div>
    </div>
  );
};
