import React from 'react';
import { Business } from '../../../types';
import {
  calculateDistanceKm,
  formatDistanceString,
  getBusinessOpenStatus,
} from '../../../utils/directoryEnhancements';
import { getOptimizedImageUrl } from '../../../utils/imageOptimizer';
import { getCategoryFallbackCover } from '../../../utils/categoryPhotos';
import { ShieldCheck, Heart, Star, MapPin } from 'lucide-react';
import { BusinessActionButtons } from './BusinessActionButtons';
import type { BusinessCardVariantProps } from './BusinessCardGridVariant';

export const BusinessCardListVariant: React.FC<BusinessCardVariantProps> = ({
  business,
  onOpenBusiness,
  onToggleFavorite,
  isFavorite = false,
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
    <div className="group relative bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-amber-400/80 rounded-2xl p-3 sm:p-4 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      {/* Primary card link/button: accessible full surface with no nested buttons */}
      <button
        type="button"
        role="button"
        aria-label={business.nameAr}
        onClick={() => onOpenBusiness(business)}
        className="absolute inset-0 z-0 w-full h-full cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      />

      <div className="flex items-center gap-3 min-w-0 flex-1 pointer-events-none relative z-[1]">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-slate-900">
          <img
            src={getOptimizedImageUrl(mainPhoto, 160, 160)}
            alt={business.nameAr}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-1 start-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 fill-emerald-600" />
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 truncate max-w-[180px]">
              {business.category}
            </span>
            {business.googleRating && (
              <span className="inline-flex items-center gap-0.5 text-xs font-black text-amber-600">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{business.googleRating.toFixed(1)}</span>
              </span>
            )}
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                openStatus.isOpen ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'
              }`}
            >
              {openStatus.badgeText}
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-black text-slate-900 truncate group-hover:text-amber-600 transition-colors">
            <bdi dir="auto">{business.nameAr}</bdi>
          </h3>

          <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{[business.city, business.street].filter(Boolean).join('، ')}</span>
            </span>
            {distanceKm !== null && (
              <span className="text-slate-400 font-medium shrink-0">
                · {formatDistanceString(distanceKm)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 relative z-10 pointer-events-auto">
        <BusinessActionButtons business={business} />

        {onToggleFavorite && (
          <button
            type="button"
            aria-label={isFavorite ? `إزالة ${business.nameAr} من المفضلة` : `إضافة ${business.nameAr} إلى المفضلة`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(business.id);
            }}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shrink-0"
          >
            <Heart
              className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`}
            />
          </button>
        )}
      </div>
    </div>
  );
};
