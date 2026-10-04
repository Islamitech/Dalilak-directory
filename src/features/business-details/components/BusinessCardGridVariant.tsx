import React, { useState } from 'react';
import { Business } from '../../../types';
import {
  calculateDistanceKm,
  formatDistanceString,
  getBusinessOpenStatus,
} from '../../../utils/directoryEnhancements';
import { getOptimizedImageUrl } from '../../../utils/imageOptimizer';
import { getCategoryFallbackCover } from '../../../utils/categoryPhotos';
import { Camera, Heart, MapPin, ShieldCheck, Star, Store, Tag } from 'lucide-react';
import { BusinessActionButtons } from './BusinessActionButtons';

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
  const fallbackCover = getCategoryFallbackCover(business.category);
  const mainPhoto = business.coverPhoto || (business.photos && business.photos[0]) || fallbackCover;
  const photoCount = (business.photos && business.photos.length) || (business.coverPhoto ? 1 : 0);

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
      onClick={() => onOpenBusiness(business)}
      className="card group relative bg-white border border-slate-200/90 hover:border-amber-400 rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer focus-within:ring-2 focus-within:ring-amber-500/50"
    >
      {/* Full-width photo header with integrated identity block */}
      <div className="relative h-44 sm:h-52 shrink-0 bg-slate-900">
        {mainPhoto && !photoError ? (
          <img
            src={getOptimizedImageUrl(mainPhoto, 480, 360)}
            alt=""
            width="480"
            height="360"
            role="presentation"
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            onError={() => setPhotoError(true)}
            className="w-full h-full object-cover select-none transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
            <Store className="w-10 h-10 stroke-[1.5] text-amber-400/70" aria-hidden="true" />
          </div>
        )}

        {/* Identity overlay: category, name, zone merged into the photo */}
        <div className="absolute inset-x-0 bottom-0 px-3.5 pb-3 pt-14 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isVerified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-300 bg-emerald-500/25 backdrop-blur-sm px-2 py-0.5 rounded-md border border-emerald-300/30">
                <ShieldCheck className="w-3 h-3" />
                <span>موثق</span>
              </span>
            )}
            <span className="text-[10px] font-black text-amber-200 bg-amber-400/20 backdrop-blur-sm px-2 py-0.5 rounded-md border border-amber-200/25 truncate max-w-[70%]">
              {business.category}
            </span>
          </div>

          <h3 className="card-name mt-1.5 text-[15px] sm:text-base font-bold text-white leading-snug drop-shadow-sm">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenBusiness(business);
              }}
              aria-label={business.nameAr}
              className="text-start w-full font-bold text-white hover:text-amber-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md"
            >
              <bdi dir="auto">{business.nameAr}</bdi>
            </button>
          </h3>

          {areaString && (
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-200 font-medium">
              <MapPin className="w-3 h-3 text-amber-300 shrink-0" />
              <span className="truncate">{areaString}</span>
            </div>
          )}
        </div>

        {/* Photo count badge */}
        {photoCount > 1 && (
          <span className="absolute top-2.5 start-2.5 inline-flex items-center gap-1 bg-slate-950/60 text-white text-[10px] font-black px-2 py-0.5 rounded-full pointer-events-none">
            <Camera className="w-3 h-3" />
            <span>{photoCount}</span>
          </span>
        )}

        {/* Favorite button (44px target) */}
        {onToggleFavorite && (
          <button
            type="button"
            aria-label={isFavorite ? `إزالة ${business.nameAr} من المفضلة` : `إضافة ${business.nameAr} إلى المفضلة`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(business.id);
            }}
            className={`absolute top-2.5 end-2.5 z-10 w-9 h-9 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all cursor-pointer border shadow-md ${
              isFavorite
                ? 'bg-rose-500 border-rose-500 text-white'
                : 'bg-white/90 border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-300'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Card body: offer chip + meta */}
      <div className="flex flex-col gap-2 p-3.5 flex-1">
        {offerText && (
          <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-dashed border-amber-300 px-2.5 py-1.5 rounded-lg">
            <Tag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">{offerText}</span>
          </p>
        )}

        <div className="card-meta flex items-center gap-2 flex-wrap text-xs min-h-[20px]">
          {hasRating && (
            <span className="rating inline-flex items-center gap-1 font-bold text-amber-600">
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
                openStatus.isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {openStatus.badgeText}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons (clicks here must not open the business) */}
      <div
        className="relative z-10 px-3.5 pb-3.5 mt-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <BusinessActionButtons
          business={business}
          className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100"
        />
      </div>
    </article>
  );
};
