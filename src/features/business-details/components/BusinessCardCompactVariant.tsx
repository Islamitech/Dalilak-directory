import React from 'react';
import { Pressable } from '../../../shared/ui';
import { Business } from '../../../types';
import {
  calculateDistanceKm,
  formatDistanceString,
  getBusinessOpenStatus,
} from '../../../utils/directoryEnhancements';
import { getOptimizedImageUrl } from '../../../utils/imageOptimizer';
import { getCategoryFallbackCover } from '../../../utils/categoryPhotos';
import { getFirstStrongDirection } from '../../../utils/textDirection';
import { ShieldCheck } from 'lucide-react';
import { getBusinessEntryGate } from '../../../utils/hadayekZoneHelper';
import type { BusinessCardVariantProps } from './BusinessCardGridVariant';

export const BusinessCardCompactVariant: React.FC<BusinessCardVariantProps> = ({
  business,
  onOpenBusiness,
  userCoords = null,
  priority = false,
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

  const isVerified = business.verificationStatus === 'verified' || Boolean(business.packageId?.includes('verified'));
  const entryGate = getBusinessEntryGate(business);
  const hasRating = Boolean(business.googleRating && business.googleRating > 0);

  return (
    <Pressable
      type="button"
      aria-label={business.nameAr}
      onClick={() => onOpenBusiness(business)}
      className="compact-card w-full text-start flex items-center gap-3 p-2.5 bg-white border border-slate-200/80 rounded-md shadow-[0_2px_8px_rgba(15,23,42,0.05)] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.10)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      <img
        src={getOptimizedImageUrl(mainPhoto, 160, 160)}
        alt=""
        width="64"
        height="64"
        className="w-16 h-16 rounded-md object-cover shrink-0 bg-slate-100"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 dir={getFirstStrongDirection(business.nameAr)} className="text-sm font-extrabold text-slate-900 truncate">
            <bdi dir="auto">{business.nameAr}</bdi>
          </h4>
          {isVerified && <ShieldCheck className="w-3.5 h-3.5 text-[var(--brand)] shrink-0" />}
        </div>
        <p className="text-caption font-bold text-amber-700 truncate mt-0.5">{business.category}</p>
        {entryGate && <p className="text-caption font-bold text-slate-500 truncate">{entryGate.line}</p>}
        <div className="flex items-center flex-wrap gap-1.5 mt-1.5 text-caption font-bold">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill border ${
              openStatus.isOpen
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-slate-500 bg-slate-50 border-slate-200'
            }`}
          >
            <i className={`w-1.5 h-1.5 rounded-pill ${openStatus.isOpen ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {openStatus.badgeText}
          </span>
          {distanceKm !== null && (
            <span className="px-2 py-0.5 rounded-pill bg-slate-100 text-slate-600">{formatDistanceString(distanceKm)}</span>
          )}
          {hasRating && (
            <span className="px-2 py-0.5 rounded-pill bg-amber-50 text-amber-700">★ {Number(business.googleRating).toFixed(1)}</span>
          )}
        </div>
      </div>
    </Pressable>
  );
};
