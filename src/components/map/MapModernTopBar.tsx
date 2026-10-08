import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { ViewSegmentedSwitch } from '../layout/ViewSegmentedSwitch';

export interface MapModernTopBarProps {
  selectedZone?: string;
  buildingNumber?: string;
  onViewList?: () => void;
  children?: React.ReactNode;
}

/**
 * 🎛️ MapModernTopBar — top-center map affordances
 *
 * Filtering lives in the app header (DirectoryFilterSheet). This bar keeps
 * only the map/list view switch (centered, where the old filter button sat),
 * the zone-scoped building-number search behind a compact popover, and the
 * active building chip.
 */
export const MapModernTopBar: React.FC<MapModernTopBarProps> = ({
  selectedZone = '',
  buildingNumber,
  onViewList,
  children,
}) => {
  const [buildingSearchOpen, setBuildingSearchOpen] = useState(false);
  const canSearchBuildings = Boolean(selectedZone && selectedZone !== 'all');

  return (
    <div dir="rtl" className="absolute top-3 inset-x-3 sm:inset-x-5 z-[1000] pointer-events-none map-top-safe-area">
      <div className="relative max-w-2xl mx-auto pointer-events-auto flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          {canSearchBuildings && (
            <button
              type="button"
              aria-expanded={buildingSearchOpen}
              aria-label="البحث عن مبنى برقمه"
              title="بحث عن مبنى"
              onClick={() => setBuildingSearchOpen((prev) => !prev)}
              className={`w-11 h-11 rounded-full bg-white/90 backdrop-blur-md border shadow-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                buildingSearchOpen
                  ? 'bg-amber-50 border-amber-400 text-amber-700'
                  : 'border-slate-200/70 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
              }`}
            >
              <Building2 size={20} />
            </button>
          )}

          <ViewSegmentedSwitch
            className="lg:hidden"
            activeView="map"
            onViewChange={(view) => {
              if (view === 'list') onViewList?.();
            }}
          />
        </div>

        {canSearchBuildings && buildingSearchOpen && children && (
          <div className="w-full max-w-xs rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/70 shadow-lg p-2 animate-fade-in">
            {children}
          </div>
        )}

        {buildingNumber && (
          <div aria-label="موقع المبنى" className="rounded-full bg-white/95 border border-slate-200 px-3 py-1.5 text-xs text-slate-700 shadow-sm font-bold">
            منطقة {selectedZone} ← مبنى {buildingNumber}
          </div>
        )}
      </div>
    </div>
  );
};
