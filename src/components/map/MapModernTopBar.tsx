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
  matchingCount?: number;
  onResetAll?: () => void;
}

/**
 * 🎛️ MapModernTopBar — Slim top-center map affordances
 *
 * Product Decision:
 * 1. Single search box lives in AppNavbar (no search input on map).
 * 2. View switch sits visibly at the top center.
 * 3. Thin, single-word filter chips strip directly below view switch.
 */
export const MapModernTopBar: React.FC<MapModernTopBarProps> = ({
  selectedZone = '',
  onViewList,
  selectedCategory = 'all',
  onCategoryChange,
  onZoneChange,
  businesses = [],
  matchingCount = 0,
  onResetAll,
}) => {
  return (
    <div dir="rtl" data-map-top-bar className="absolute top-2 inset-x-2 sm:inset-x-4 z-[1000] pointer-events-none">
      <div className="relative max-w-fit mx-auto flex flex-col items-center gap-1.5">
        {/* Single Ultra-Slim Affordance: View Switch + Filters */}
        {/* Frosted backing keeps chips legible over busy map labels/roads */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1 sm:gap-2 px-1.5 py-1 rounded-3xl bg-white/92 backdrop-blur-md border border-slate-200/80 shadow-md">
          {/* Switch */}
          <div className="flex items-center gap-1">
            <ViewSegmentedSwitch
              activeView="map"
              size="sm"
              onViewChange={(view) => {
                if (view === 'list') onViewList?.();
              }}
            />
          </div>

          {/* Slim Dropdown Filters: Category & Zone */}
          <UnifiedSearchFilterBar
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange || (() => {})}
            selectedZone={selectedZone}
            onZoneChange={onZoneChange || (() => {})}
            businesses={businesses}
            matchingCount={matchingCount}
            onResetAll={onResetAll}
            variant="map"
          />
        </div>
      </div>
    </div>
  );
};
