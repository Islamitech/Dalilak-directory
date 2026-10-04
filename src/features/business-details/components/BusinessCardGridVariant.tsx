import React, { useState } from 'react';
import { Business } from '../../../types';
import {
  calculateDistanceKm,
  formatDistanceString,
  getBusinessOpenStatus,
} from '../../../utils/directoryEnhancements';
import { getOptimizedImageUrl } from '../../../utils/imageOptimizer';
import { ShieldCheck, Heart, Star, Tag, Store } from 'lucide-react';
import { BusinessActionButtons } from './BusinessActionButtons';
import { PhotoWatermarkBadge } from '../../../components/PhotoWatermarkBadge';

export interface BusinessCardVariantProps {
  business: Business;
  onOpenBusiness: (biz: Business) => void;
  onToggleFavorite?: (id: string) => void;
  isFavorite?: boolean;
  userCoords?: { lat: number; lng: number } | null;
  onOpenVideoModal?: (biz: Business) => void;
  onStartNavigation?: (biz: Business) => void;
  onShowOnMap?: (biz: Business) => void;
  onClose?: () => void;
  photos?: string[];
  onPreviewPhoto?: (index: number) => void;
}

export const BusinessCardGridVariant: React.FC<BusinessCardVariantProps> = ({
  business,
  onOpenBusiness,
  onToggleFavorite,
  isFavorite = false,
  userCoords = null,
}) => {
  const [photoError, setPhotoError] = useState(false);
  const mainPhoto = business.coverPhoto || (business.photos && business.photos.length > 0 ? business.photos[0] : null);

  const openStatus = getBusinessOpenStatus(business.workingHours);
  const distanceKm =
    userCoords && business.lat && business.lng
      ? calculateDistanceKm(userCoords.lat, userCoords.lng, business.lat, business.lng)
      : null;

  const isVerified = business.verificationStatus === 'verified' || business.packageId?.includes('verified');
  const hasRating = Boolean(business.googleRating && business.googleRating > 0);
  const hasReviewCount = Boolean(business.googleReviewsCount && business.googleReviewsCount > 0);
  const hasWorkingHours = Boolean(business.workingHours && business.workingHours.trim().length > 0);

  const areaString = [business.city, business.street, distanceKm !== null ? formatDistanceString(distanceKm) : null]
    .filter(Boolean)
    .join(' · ');

  // Parse offer text if available from description/notes
  let offerText: string | null = null;
  if (business.notes) {
    try {
      const parsedNotes = JSON.parse(business.notes);
      if (parsedNotes.offer) offerText = parsedNotes.offer;
    } catch {}
  }


  return (
    <article
      data-biz-id={business.id}
      className="card group relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 rounded-2xl p-3.5 flex flex-col justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Top-End: Favorite Button (44px touch target) */}
      {onToggleFavorite && (
        <button
          type="button"
          aria-label={isFavorite ? `إزالة ${business.nameAr} من المفضلة` : `إضافة ${business.nameAr} إلى المفضلة`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(business.id);
          }}
          className={`card-fav absolute top-3 end-3 z-10 w-9 h-9 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all cursor-pointer border ${
            isFavorite
              ? 'bg-rose-500 border-rose-500 text-white shadow-xs'
              : 'bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-300'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      )}

      {/* Main Card Header: Squircle Icon + Body Info */}
      <div className="flex items-start gap-3.5 pe-10">
        {/* Squircle Avatar / Category Icon */}
        <div className="card-icon w-[60px] h-[60px] rounded-2xl shrink-0 overflow-hidden relative flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100/70 dark:from-slate-800 dark:to-slate-800/60 border border-amber-200/40 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-2xs">
          {mainPhoto && !photoError ? (
            <>
            <img
              src={getOptimizedImageUrl(mainPhoto, 120, 120)}
              alt=""
              width="60"
              height="60"
              role="presentation"
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              onError={() => setPhotoError(true)}
              className="w-full h-full object-cover select-none"
            />
            <PhotoWatermarkBadge size="sm" className="hidden" />
            </>
          ) : (
            <Store className="w-6 h-6 stroke-[1.75]" aria-hidden="true" />
          )}
        </div>

        {/* Card Body with Stretched Link Anchor */}
        <div className="card-body min-w-0 flex-1">
          <h3 className="card-name text-[15px] sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 leading-snug">
            <button
              type="button"
              onClick={() => onOpenBusiness(business)}
              aria-label={business.nameAr}
              className="text-start font-bold text-slate-900 dark:text-slate-100 hover:text-amber-600 dark:hover:text-amber-400 transition-colors after:absolute after:inset-0 after:z-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-md"
            >
              <bdi dir="auto">{business.nameAr}</bdi>
            </button>
            {isVerified && (
              <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 inline fill-blue-500/10" aria-label="موثق" />
            )}
          </h3>

          <div className="card-cat text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2 font-medium truncate">
            <span>{business.category}</span>
            {areaString && <span> · {areaString}</span>}
          </div>

          {/* Meta Row: Rating + Open Status */}
          <div className="card-meta flex items-center gap-2 flex-wrap text-xs">
            {hasRating && (
              <span className="rating inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{business.googleRating!.toFixed(1)}</span>
              </span>
            )}
            {hasReviewCount && (
              <span className="reviews text-slate-400 font-normal">
                ({business.googleReviewsCount!.toLocaleString('ar-EG')})
              </span>
            )}
            {hasWorkingHours && (
              <span
                className={`status px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  openStatus.isOpen
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                }`}
              >
                {openStatus.badgeText}
              </span>
            )}
          </div>

          {/* Offer Pill */}
          {offerText && (
            <div className="card-offer inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 bg-gradient-to-r from-amber-50 to-amber-100/60 dark:from-amber-950/30 dark:to-amber-900/20 text-amber-800 dark:text-amber-300 rounded-full text-[11px] font-bold border border-dashed border-amber-300 dark:border-amber-700/60">
              <Tag className="w-3 h-3 text-amber-600 shrink-0" />
              <span>{offerText}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Row (Relative z-10 to stay clickable with stretched link) */}
      <div className="relative z-10">
        <BusinessActionButtons business={business} />
      </div>
    </article>
  );
};
