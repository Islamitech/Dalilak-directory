import React from 'react';
import { Car, Footprints } from 'lucide-react';
import { RouteStats } from '../model/directionsModel';

interface NavigationStatsBarProps {
  stats: RouteStats;
}

export const NavigationStatsBar: React.FC<NavigationStatsBarProps> = ({ stats }) => {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 grid grid-cols-3 gap-2 text-center">
      <div>
        <div className="text-[10px] text-slate-500 font-bold">المسافة المقدرة</div>
        <div className="text-sm font-black text-slate-900 mt-0.5">{stats.distanceText}</div>
      </div>
      <div className="border-inline-start border-slate-200">
        <div className="text-[10px] text-slate-500 font-bold flex items-center justify-center gap-1">
          <Car className="w-3 h-3 text-amber-600" />
          <span>بالسيارة</span>
        </div>
        <div className="text-sm font-black text-amber-700 mt-0.5">~{stats.drivingMinutes} دقيقة</div>
      </div>
      <div className="border-inline-start border-slate-200">
        <div className="text-[10px] text-slate-500 font-bold flex items-center justify-center gap-1">
          <Footprints className="w-3 h-3 text-blue-600" />
          <span>سيراً</span>
        </div>
        <div className="text-sm font-black text-blue-700 mt-0.5">~{stats.walkingMinutes} دقيقة</div>
      </div>
    </div>
  );
};
