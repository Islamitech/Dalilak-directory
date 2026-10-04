import React from 'react';
import { Map as MapIcon, List as ListIcon } from 'lucide-react';

export type DirectoryViewMode = 'map' | 'list';

export interface ViewSegmentedSwitchProps {
  activeView: DirectoryViewMode;
  onViewChange: (view: DirectoryViewMode) => void;
  className?: string;
}

/**
 * 🎛️ ViewSegmentedSwitch
 *
 * Floating segmented control matching docs/design/prototype.html (.view-switch):
 * - Dark frosted-glass container with subtle border and elevation
 * - Dual icon + Arabic label buttons ('الخريطة' & 'الأنشطة')
 * - State-driven sliding amber indicator with RTL logical positioning
 * - Fully accessible radiogroup with >= 44px touch targets
 */
export const ViewSegmentedSwitch: React.FC<ViewSegmentedSwitchProps> = ({
  activeView,
  onViewChange,
  className = '',
}) => {
  return (
    <div
      role="radiogroup"
      aria-label="طريقة العرض"
      className={`view-switch relative inline-flex items-center p-1.5 bg-slate-900/92 dark:bg-slate-900/95 backdrop-blur-xl border border-white/10 dark:border-white/10 rounded-full select-none shadow-2xl ${className}`}
    >
      {/* Sliding Active Indicator (State-driven via RTL logical property) */}
      <div
        aria-hidden="true"
        className={`switch-indicator absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full bg-gradient-to-r from-amber-500 to-amber-600 shadow-md transition-all duration-300 ease-out pointer-events-none ${
          activeView === 'map'
            ? 'start-1.5'
            : 'start-[calc(50%+1.5px)]'
        }`}
      />

      {/* Map Option */}
      <button
        type="button"
        role="radio"
        aria-checked={activeView === 'map'}
        aria-label="الخريطة التفاعلية"
        title="الخريطة"
        onClick={() => onViewChange('map')}
        className={`switch-btn relative z-10 min-h-[44px] px-5 py-2.5 rounded-full flex items-center justify-center gap-2 cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 text-xs sm:text-sm font-bold whitespace-nowrap ${
          activeView === 'map'
            ? 'text-slate-950 font-black'
            : 'text-white/60 hover:text-white'
        }`}
      >
        <MapIcon className="w-4 h-4 stroke-[2.2]" />
        <span>الخريطة</span>
      </button>

      {/* List Option */}
      <button
        type="button"
        role="radio"
        aria-checked={activeView === 'list'}
        aria-label="قائمة الأنشطة"
        title="الأنشطة"
        onClick={() => onViewChange('list')}
        className={`switch-btn relative z-10 min-h-[44px] px-5 py-2.5 rounded-full flex items-center justify-center gap-2 cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 text-xs sm:text-sm font-bold whitespace-nowrap ${
          activeView === 'list'
            ? 'text-slate-950 font-black'
            : 'text-white/60 hover:text-white'
        }`}
      >
        <ListIcon className="w-4 h-4 stroke-[2.2]" />
        <span>الأنشطة</span>
      </button>
    </div>
  );
};
