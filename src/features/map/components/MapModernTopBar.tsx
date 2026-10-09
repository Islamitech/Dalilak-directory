import React from 'react';
import { ViewSegmentedSwitch } from '../../../components/layout/ViewSegmentedSwitch';

export interface MapModernTopBarProps {
  onViewList?: () => void;
}

/** Map/list switch. Search stays in the navbar; the map has no filter chips. */
export const MapModernTopBar: React.FC<MapModernTopBarProps> = ({ onViewList }) => {
  return (
    <div dir="rtl" data-map-top-bar className="absolute top-2 inset-x-2 sm:inset-x-4 z-[1000] pointer-events-none">
      <div className="relative max-w-fit mx-auto flex flex-col items-center gap-1.5">
        <div className="pointer-events-auto shrink-0 rounded-pill bg-white/92 backdrop-blur-md border border-slate-200/80 shadow-sm p-0.5">
          <ViewSegmentedSwitch
            activeView="map"
            size="sm"
            onViewChange={(view) => {
              if (view === 'list') onViewList?.();
            }}
          />
        </div>
      </div>
    </div>
  );
};
