import React from 'react';
import { Map as MapIcon, List as ListIcon } from 'lucide-react';

export type DirectoryViewMode = 'map' | 'list';

export interface ViewSegmentedSwitchProps {
  activeView: DirectoryViewMode;
  onViewChange: (view: DirectoryViewMode) => void;
  className?: string;
}

/**
 * 🎛️ ViewSegmentedSwitch (Decision D2)
 *
 * Compact icon-only segmented control positioned in the top row.
 * - Icon-only, no text nodes.
 * - Preserves equal dimensions and positioning across both views.
 * - State-driven indicator with logical RTL positioning.
 * - Fully accessible radiogroup with >= 44x44px hit targets.
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
      className={`relative inline-flex items-center p-0.5 sm:p-1 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-full select-none shadow-2xs ${className}`}
    >
      {/* Sliding Active Indicator (State-driven via RTL logical property) */}
      <div
        aria-hidden="true"
        className={`absolute top-0.5 sm:top-1 bottom-0.5 sm:bottom-1 w-[calc(50%-4px)] sm:w-[calc(50%-6px)] rounded-full bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500 shadow-sm transition-all duration-200 ease-out pointer-events-none ${
          activeView === 'map'
            ? 'start-0.5 sm:start-1'
            : 'start-[calc(50%+2px)] sm:start-[calc(50%+3px)]'
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
        className={`relative z-10 min-w-11 min-h-11 sm:min-w-10 sm:min-h-10 px-2 sm:px-2.5 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 ${
          activeView === 'map'
            ? 'text-slate-950 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <MapIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
      </button>

      {/* List Option */}
      <button
        type="button"
        role="radio"
        aria-checked={activeView === 'list'}
        aria-label="قائمة الأنشطة"
        title="قائمة الأنشطة"
        onClick={() => onViewChange('list')}
        className={`relative z-10 min-w-11 min-h-11 sm:min-w-10 sm:min-h-10 px-2 sm:px-2.5 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 ${
          activeView === 'list'
            ? 'text-slate-950 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <ListIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
      </button>
    </div>
  );
};
