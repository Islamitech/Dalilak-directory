import React from 'react';
import { Business } from '../../../types';
import {
  calculateDistanceKm,
  formatDistanceString,
  getBusinessOpenStatus,
} from '../../../utils/directoryEnhancements';
import { getOptimizedImageUrl } from '../../../utils/imageOptimizer';
import { getCategoryFallbackCover } from '../../../utils/categoryPhotos';
import { PhotoWatermarkBadge } from '../../../components/PhotoWatermarkBadge';
import { ShieldCheck, Heart, Star, MapPin, Play } from 'lucide-react';
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
  onOpenVideoModal,
}) => {
  const fallbackCover = getCategoryFallbackCover(business.category);
  const mainPhoto =
    business.coverPhoto ||
    (business.photos && business.photos.length > 0 ? business.photos[0] : fallbackCover);

  const openStatus = getBusinessOpenStatus(business.workingHours);
  const distanceKm =
    userCoords && business.lat && business.lng
      ? calculateDistanceKm(userCoords.lat, userCoords.lng, business.lat, business.lng)
      : null;

  return (
    <div
      onClick={() => onOpenBusiness(business)}
      onContextMenu={(e) => e.preventDefault()}
      role="article"
      className="group bg-white border border-slate-200/90 hover:border-amber-400/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between hover:-translate-y-0.5 cursor-pointer protected-asset-shield"
    >
      {/* 1. Visual Anchor: 16:10 Photo with anti-extraction shield */}
      <div
        className="relative aspect-[16/10] w-full bg-slate-950 overflow-hidden select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        <img
          src={getOptimizedImageUrl(mainPhoto, 420, 262)}
          alt={business.nameAr || 'صورة المنشأة'}
          width="420"
          height="262"
          role="presentation"
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            if (e.currentTarget.src !== fallbackCover) {
              e.currentTarget.src = fallbackCover;
            }
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
        />

        <div className="absolute inset-0 z-[5] select-none pointer-events-auto" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

        {/* Top-Start: Official Verification Badge */}
        <div className="absolute top-3 start-3 z-10">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-xs backdrop-blur-md"
            title="منشأة معتمدة في دليلك"
          >
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>موثق</span>
          </span>
        </div>

        {/* Top-End: Status and Favorite */}
        <div className="absolute top-3 end-3 z-10 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md border shadow-sm ${
              openStatus.isOpen
                ? 'bg-slate-950/85 text-emerald-400 border-emerald-500/50'
                : 'bg-slate-950/85 text-rose-400 border-rose-500/50'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                openStatus.isOpen ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
              }`}
            />
            <span>{openStatus.badgeText}</span>
          </span>

          {onToggleFavorite && (
            <button
              type="button"
              aria-label={isFavorite ? `إزالة ${business.nameAr} من المفضلة` : `إضافة ${business.nameAr} إلى المفضلة`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(business.id);
              }}
              className="w-8 h-8 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-white/20 text-white flex items-center justify-center transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white/80'
                }`}
              />
            </button>
          )}
        </div>

        {/* Video Reel Badge */}
        {business.videos && business.videos.length > 0 && onOpenVideoModal && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenVideoModal(business);
            }}
            aria-label={`مشاهدة فيديو ${business.nameAr}`}
            className="absolute bottom-3 end-3 z-10 inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white shadow-md border border-rose-400/40 backdrop-blur-md transition-transform active:scale-95"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>فيديو</span>
          </button>
        )}

        <PhotoWatermarkBadge />
      </div>

      {/* 2. Body Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200/60 truncate max-w-[70%]">
              {business.category}
            </span>
            {business.googleRating && (
              <span className="inline-flex items-center gap-1 text-xs font-black text-amber-600">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{business.googleRating.toFixed(1)}</span>
              </span>
            )}
          </div>

          <h3 className="text-base font-black text-slate-900 leading-snug mb-1.5 line-clamp-1 group-hover:text-amber-600 transition-colors">
            <bdi dir="auto">{business.nameAr}</bdi>
          </h3>

          <div className="flex items-center gap-1 text-xs text-slate-500 mb-3 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>
              {business.city}
              {business.street ? ` - ${business.street}` : ''}
              {business.landmark ? ` (${business.landmark})` : ''}
            </span>
          </div>
        </div>

        {distanceKm !== null && (
          <div className="text-[11px] font-bold text-slate-400 mb-3">
            يبعد عنك: {formatDistanceString(distanceKm)}
          </div>
        )}

        <BusinessActionButtons business={business} />
      </div>
    </div>
  );
};
