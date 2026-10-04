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
import { getWhatsAppUrl } from '../../../shared/lib/whatsapp';
import { getGoogleMapsDirectionsUrl } from '../../../shared/lib/directions';
import {
  ShieldCheck,
  Heart,
  Star,
  Navigation,
  MessageCircle,
  Phone,
  MapPin,
  Play,
} from 'lucide-react';
import { Card, Chip } from '../../../shared/ui';

export interface UnifiedBusinessCardProps {
  business: Business;
  onOpenBusiness: (biz: Business) => void;
  onToggleFavorite?: (id: string) => void;
  isFavorite?: boolean;
  userCoords?: { lat: number; lng: number } | null;
  onOpenVideoModal?: (biz: Business) => void;
  variant?: 'grid' | 'compact' | 'map-drawer';
}

export const UnifiedBusinessCard: React.FC<UnifiedBusinessCardProps> = ({
  business,
  onOpenBusiness,
  onToggleFavorite,
  isFavorite = false,
  userCoords = null,
  onOpenVideoModal,
  variant = 'grid',
}) => {
  const fallbackCover = getCategoryFallbackCover(business.category);
  const mainPhoto =
    business.coverPhoto ||
    (business.photos && business.photos.length > 0
      ? business.photos[0]
      : fallbackCover);

  const openStatus = getBusinessOpenStatus(business.workingHours);
  const distanceKm = userCoords && business.lat && business.lng
    ? calculateDistanceKm(userCoords.lat, userCoords.lng, business.lat, business.lng)
    : null;

  // Directions URL via shared safe helper
  const directionsUrl = getGoogleMapsDirectionsUrl({
    lat: business.lat,
    lng: business.lng,
    destinationAddress: `${business.city || ''} ${business.street || ''}`,
    query: business.nameAr,
  });

  // WhatsApp URL via shared helper
  const whatsAppUrl = getWhatsAppUrl(
    business.whatsapp || business.phone,
    `مرحباً ${business.nameAr}، وجدتك عبر منصة دليلك وأود الاستفسار عن خدماتكم.`
  );

  const cleanPhone = (business.phone || '').replace(/[^\d+]/g, '');

  if (variant === 'compact') {
    return (
      <div
        onClick={() => onOpenBusiness(business)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') onOpenBusiness(business); }}
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
  }

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
          onError={(e: any) => {
            if (e.currentTarget.src !== fallbackCover) {
              e.currentTarget.src = fallbackCover;
            }
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
        />

        {/* Protection Shield */}
        <div className="absolute inset-0 z-[5] select-none pointer-events-auto" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

        {/* Top-Right: Official Verification Badge */}
        <div className="absolute top-3 start-3 z-10">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-xs backdrop-blur-md"
            title="منشأة معتمدة في دليلك"
          >
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>موثق</span>
          </span>
        </div>

        {/* Top-Left: Open / Closed Status Badge */}
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

          {/* Favorite Toggle Button */}
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
          {/* Category & Rating */}
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

          {/* Business Title */}
          <h3 className="text-base font-black text-slate-900 leading-snug mb-1.5 line-clamp-1 group-hover:text-amber-600 transition-colors">
            {business.nameAr}
          </h3>

          {/* Address / Landmark */}
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-3 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>
              {business.city}
              {business.street ? ` - ${business.street}` : ''}
              {business.landmark ? ` (${business.landmark})` : ''}
            </span>
          </div>
        </div>

        {/* Distance indicator if available */}
        {distanceKm !== null && (
          <div className="text-[11px] font-bold text-slate-400 mb-3">
            يبعد عنك: {formatDistanceString(distanceKm)}
          </div>
        )}

        {/* 3. Action Buttons (Strict Order: Call -> WhatsApp -> Directions) */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
          {/* Action 1: Call */}
          {cleanPhone ? (
            <a
              href={`tel:${cleanPhone}`}
              onClick={(e) => e.stopPropagation()}
              className="min-h-[44px] py-2 px-2 rounded-xl text-xs font-black bg-slate-50 hover:bg-amber-50 text-slate-800 hover:text-amber-900 border border-slate-200 hover:border-amber-300 flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
              title="اتصال هاتفي فوري"
            >
              <Phone className="w-3.5 h-3.5 text-slate-700 shrink-0" />
              <span>اتصال</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="min-h-[44px] py-2 px-2 rounded-xl text-xs bg-slate-50 text-slate-400 border border-slate-200 font-bold flex items-center justify-center gap-1 opacity-50 cursor-not-allowed"
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>اتصال</span>
            </button>
          )}

          {/* Action 2: WhatsApp */}
          {whatsAppUrl ? (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="min-h-[44px] py-2 px-2 rounded-xl text-xs font-black bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/90 flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
              title="محادثة واتساب مباشرة"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>واتساب</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="min-h-[44px] py-2 px-2 rounded-xl text-xs bg-slate-50 text-slate-400 border border-slate-200 font-bold flex items-center justify-center gap-1 opacity-50 cursor-not-allowed"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span>واتساب</span>
            </button>
          )}

          {/* Action 3: Directions */}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="min-h-[44px] py-2 px-2 rounded-xl text-xs font-black bg-blue-50/80 hover:bg-blue-100 text-blue-900 border border-blue-200/90 flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
            title="الاتجاهات على خرائط Google"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>اتجاهات</span>
          </a>
        </div>
      </div>
    </div>
  );
};
