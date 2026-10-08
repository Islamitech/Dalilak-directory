import React from 'react';
import { Map as MapIcon, List as ListIcon } from 'lucide-react';

export type DirectoryViewMode = 'map' | 'list';

export interface ViewSegmentedSwitchProps {
  activeView: DirectoryViewMode;
  onViewChange: (view: DirectoryViewMode) => void;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * 🎛️ ViewSegmentedSwitch
 *
 * Icons-only floating segmented control in the app's unified map-control
 * recipe: frosted white glass container, slate icons, and a single amber
 * accent reserved for the active segment.
 */
export const ViewSegmentedSwitch: React.FC<ViewSegmentedSwitchProps> = ({
  activeView,
  onViewChange,
  className = '',
  size = 'md',
}) => {
  const isSm = size === 'sm';

  return (
    <div
      role="radiogroup"
      aria-label="طريقة العرض"
      className={`view-switch relative inline-flex items-center ${
        isSm ? 'p-0.5' : 'p-1'
      } bg-transparent border border-transparent rounded-full select-none shadow-none ${className}`}
    >
      {/* Sliding Active Indicator (State-driven via RTL logical property) */}
      <div
        aria-hidden="true"
        className={`switch-indicator absolute ${
          isSm ? 'top-0.5 bottom-0.5 w-[calc(50%-2px)]' : 'top-1 bottom-1 w-[calc(50%-4px)]'
        } rounded-full bg-amber-500 shadow-xs transition-all duration-300 ease-out pointer-events-none ${
          activeView === 'map'
            ? isSm ? 'start-0.5' : 'start-1'
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
        className={`switch-btn relative z-10 ${
          isSm ? 'h-10 w-[5.4rem] gap-1' : 'h-10 w-[6.2rem] gap-1.5'
        } rounded-full flex items-center justify-center cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
          activeView === 'map'
            ? 'text-slate-950'
            : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <MapIcon className={`${isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} stroke-[2.2]`} />
        <span className={`${isSm ? 'text-caption' : 'text-xs'} font-extrabold`}>خريطة</span>
      </button>

      {/* List Option */}
      <button
        type="button"
        role="radio"
        aria-checked={activeView === 'list'}
        aria-label="قائمة الأنشطة"
        title="الأنشطة"
        onClick={() => onViewChange('list')}
        className={`switch-btn relative z-10 ${
          isSm ? 'h-10 w-[5.4rem] gap-1' : 'h-10 w-[6.2rem] gap-1.5'
        } rounded-full flex items-center justify-center cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
          activeView === 'list'
            ? 'text-slate-950'
            : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <ListIcon className={`${isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} stroke-[2.2]`} />
        <span className={`${isSm ? 'text-caption' : 'text-xs'} font-extrabold`}>قائمة</span>
      </button>
    </div>
  );
};
