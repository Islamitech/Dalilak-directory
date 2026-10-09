import React from 'react';
import { ViewSegmentedSwitch } from '../layout/ViewSegmentedSwitch';
import { UnifiedSearchFilterBar } from '../../features/search';
import { Business } from '../../types';

export interface MapModernTopBarProps {
  selectedZone?: string;
  onViewList?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  selectedCategory?: string;
  onCategoryChange?: (cat: string) => void;
  onZoneChange?: (zone: string) => void;
  businesses?: Business[];
}

/**
 * 🎛️ MapModernTopBar — Slim top-center map affordances
 *
 * Product Decision:
 * 1. Single search box lives in AppNavbar (no search input on map).
 * 2. The map/list switch is its own control, separate from the filters.
 * 3. Category and zone are a second, smaller chip group.
 */
export const MapModernTopBar: React.FC<MapModernTopBarProps> = ({
  selectedZone = '',
  onViewList,
  selectedCategory = 'all',
  onCategoryChange,
  onZoneChange,
  businesses = [],
}) => {
  return (
    <div dir="rtl" data-map-top-bar className="absolute top-2 inset-x-2 sm:inset-x-4 z-[1000] pointer-events-none">
      <div className="relative max-w-fit mx-auto flex flex-col items-center gap-1.5">
        {/* Single Ultra-Slim Affordance: View Switch + Filters */}
        {/* Frosted backing keeps chips legible over busy map labels/roads */}
        <div className="flex flex-nowrap items-center justify-center gap-2 max-w-full">
          <div className="pointer-events-auto shrink-0 rounded-pill bg-white/92 backdrop-blur-md border border-slate-200/80 shadow-sm p-0.5">
            <ViewSegmentedSwitch
              activeView="map"
              size="sm"
              onViewChange={(view) => {
                if (view === 'list') onViewList?.();
              }}
            />
          </div>
          <div className="pointer-events-auto rounded-pill bg-white/92 backdrop-blur-md border border-slate-200/80 shadow-sm px-1 py-0.5">
            <UnifiedSearchFilterBar
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange || (() => {})}
              selectedZone={selectedZone}
              onZoneChange={onZoneChange || (() => {})}
              businesses={businesses}
              variant="map"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
