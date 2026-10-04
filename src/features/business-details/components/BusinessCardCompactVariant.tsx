import React from 'react';
import { Business } from '../../../types';
import {
  calculateDistanceKm,
  formatDistanceString,
  getBusinessOpenStatus,
} from '../../../utils/directoryEnhancements';
import { getOptimizedImageUrl } from '../../../utils/imageOptimizer';
import { getCategoryFallbackCover } from '../../../utils/categoryPhotos';
import { ShieldCheck } from 'lucide-react';
import type { BusinessCardVariantProps } from './BusinessCardGridVariant';

export const BusinessCardCompactVariant: React.FC<BusinessCardVariantProps> = ({
  business,
  onOpenBusiness,
  userCoords = null,
}) => {
  const fallbackCover = getCategoryFallbackCover(business.category);
  const mainPhoto =
    business.coverPhoto ||
    (business.photos && business.photos.length > 0
      ? business.photos[0]
      : fallbackCover);

  const openStatus = getBusinessOpenStatus(business.workingHours);
  const distanceKm =
    userCoords && business.lat && business.lng
      ? calculateDistanceKm(userCoords.lat, userCoords.lng, business.lat, business.lng)
      : null;

  return (
    <div
      onClick={() => onOpenBusiness(business)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpenBusiness(business);
      }}
      className="flex items-center gap-3 p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      <img
        src={getOptimizedImageUrl(mainPhoto, 120, 120)}
        alt={business.nameAr}
        className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-100"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <h4 className="text-sm font-black text-slate-900 truncate">{business.nameAr}</h4>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        </div>
        <p className="text-xs text-slate-500 truncate mb-1">{business.category}</p>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          {distanceKm !== null && <span>{formatDistanceString(distanceKm)}</span>}
          <span className={openStatus.isOpen ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
            {openStatus.badgeText}
          </span>
        </div>
      </div>
    </div>
  );
};
