import React from 'react';
import { Car, Footprints, Route } from 'lucide-react';
import { RouteStats } from '../model/directionsModel';

interface NavigationStatsBarProps {
  stats: RouteStats;
}

export const NavigationStatsBar: React.FC<NavigationStatsBarProps> = ({ stats }) => {
  return (
    <div className="dl-stats" role="group" aria-label="تفاصيل المسار">
      <div>
        <small>
          <Route className="w-3 h-3 text-slate-500" />
          <span>المسافة</span>
        </small>
        <b>{stats.distanceText}</b>
      </div>
      <div className="dl-car">
        <small>
          <Car className="w-3 h-3 text-amber-600" />
          <span>بالسيارة</span>
        </small>
        <b>~{stats.drivingMinutes} د</b>
      </div>
      <div className="dl-walk">
        <small>
          <Footprints className="w-3 h-3 text-blue-600" />
          <span>سيراً</span>
        </small>
        <b>~{stats.walkingMinutes} د</b>
      </div>
    </div>
  );
};
