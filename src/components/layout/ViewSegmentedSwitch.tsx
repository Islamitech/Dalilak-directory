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
 * Icons-only floating segmented control in the app's unified map-control
 * recipe: frosted white glass container, slate icons, and a single amber
 * accent reserved for the active segment (same language as the map's
 * floating controls and filter button).
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
      className={`view-switch relative inline-flex items-center p-1 bg-white/90 backdrop-blur-xl border border-slate-200/70 rounded-full select-none shadow-2xl ${className}`}
    >
      {/* Sliding Active Indicator (State-driven via RTL logical property) */}
      <div
        aria-hidden="true"
        className={`switch-indicator absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/30 transition-all duration-300 ease-out pointer-events-none ${
          activeView === 'map'
            ? 'start-1'
            : 'start-[50%]'
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
        className={`switch-btn relative z-10 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
          activeView === 'map'
            ? 'text-white'
            : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <MapIcon className="w-4 h-4 stroke-[2.2]" />
      </button>

      {/* List Option */}
      <button
        type="button"
        role="radio"
        aria-checked={activeView === 'list'}
        aria-label="قائمة الأنشطة"
        title="الأنشطة"
        onClick={() => onViewChange('list')}
        className={`switch-btn relative z-10 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
          activeView === 'list'
            ? 'text-white'
            : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <ListIcon className="w-4 h-4 stroke-[2.2]" />
      </button>
    </div>
  );
};
