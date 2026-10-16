import React from 'react';
import { Business } from '../../../types';
import { Pressable } from '../../../shared/ui';
import {
  calculateDistanceKm,
  formatDistanceString,
  getBusinessOpenStatus,
} from '../../../utils/directoryEnhancements';
import { getOptimizedImageUrl } from '../../../utils/imageOptimizer';
import { collectDisplayPhotos, getCategoryFallbackCover } from '../../../utils/categoryPhotos';
import { getFirstStrongDirection } from '../../../shared/lib/textDirection';
import { ShieldCheck, MessageCircle, Phone, Navigation } from 'lucide-react';
import { getBusinessEntryGate } from '../../../utils/hadayekZoneHelper';
import { getWhatsAppUrl } from '../../../shared/lib/whatsapp';
import type { BusinessCardVariantProps } from './BusinessCardGridVariant';

export const BusinessCardCompactVariant: React.FC<BusinessCardVariantProps> = ({
  business,
  onOpenBusiness,
  userCoords = null,
  priority = false,
}) => {
  const fallbackCover = getCategoryFallbackCover(business.category);
  const mainPhoto = collectDisplayPhotos(business.photos, business.coverPhoto)[0] || fallbackCover;

  const openStatus = getBusinessOpenStatus(business.workingHours);
  const distanceKm =
    userCoords && business.lat && business.lng
      ? calculateDistanceKm(userCoords.lat, userCoords.lng, business.lat, business.lng)
      : null;

  const isVerified = business.verificationStatus === 'verified' || Boolean(business.packageId?.includes('verified'));
  const entryGate = getBusinessEntryGate(business);
  const hasRating = Boolean(business.googleRating && business.googleRating > 0);

  const rawPhone = (business.phone || '').trim();
  const hasPhone = Boolean(rawPhone && rawPhone.length > 3);
  const cleanPhone = rawPhone.replace(/[^\d+]/g, '');

  const whatsAppUrl = getWhatsAppUrl(
    business.whatsapp || business.phone,
    `مرحباً ${business.nameAr}، وجدتك عبر منصة دليلك وأود الاستفسار عن خدماتكم.`
  );

  return (
    <article
      onClick={() => onOpenBusiness(business)}
      className="compact-card w-full text-start flex items-center gap-3 p-2.5 bg-white border border-slate-200/80 rounded-md shadow-[0_2px_8px_rgba(15,23,42,0.05)] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.10)] active:scale-[0.99]"
    >
      <div className="relative shrink-0 w-16 h-16 rounded-md overflow-hidden bg-slate-100 group">
        <img
          src={getOptimizedImageUrl(mainPhoto, 160, 160)}
          alt=""
          width="64"
          height="64"
          className="w-full h-full object-cover"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          onError={(e) => {
            const img = e.currentTarget;
            if (img.dataset.fallback !== '1' && fallbackCover && img.src !== fallbackCover) {
              img.dataset.fallback = '1';
              img.src = fallbackCover;
            }
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 dir={getFirstStrongDirection(business.nameAr)} className="text-sm font-extrabold text-slate-900 truncate min-w-0">
            <Pressable
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenBusiness(business);
              }}
              aria-label={business.nameAr}
              className="text-start truncate max-w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-xs"
            >
              <bdi dir="auto">{business.nameAr}</bdi>
            </Pressable>
          </h4>
          {isVerified && <ShieldCheck className="w-3.5 h-3.5 text-[var(--brand-ink)] shrink-0" />}
        </div>
        <p className="text-caption font-bold text-amber-700 truncate mt-0.5">{business.category}</p>
        {entryGate && <p className="text-caption font-bold text-slate-500 truncate">{entryGate.line}</p>}
        <div className="flex items-center flex-wrap gap-1.5 mt-1.5 text-caption font-bold">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-pill border ${
              openStatus.isOpen
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-slate-500 bg-slate-50 border-slate-200'
            }`}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              {openStatus.isOpen && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  openStatus.isOpen ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
            </span>
            <span>{openStatus.badgeText}</span>
          </span>

          {distanceKm !== null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-slate-100 text-slate-600">
              <Navigation className="w-2.5 h-2.5 text-slate-500 shrink-0" />
              <span>{formatDistanceString(distanceKm)}</span>
            </span>
          )}

          {hasRating && (
            <span className="px-2 py-0.5 rounded-pill bg-amber-50 text-amber-700">★ {Number(business.googleRating).toFixed(1)}</span>
          )}
        </div>
      </div>

      {(whatsAppUrl || hasPhone) && (
        <div
          className="shrink-0 flex items-center gap-1.5 z-10"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {whatsAppUrl && (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              title="مراسلة واتساب"
              aria-label={`مراسلة واتساب ${business.nameAr}`}
              className="w-9 h-9 min-w-9 min-h-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-sm transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          )}
          {hasPhone && (
            <a
              href={`tel:${cleanPhone}`}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              title="اتصال هاتفي"
              aria-label={`اتصال هاتفي بـ ${business.nameAr}`}
              className="w-9 h-9 min-w-9 min-h-9 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white flex items-center justify-center shadow-sm transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>
      )}
    </article>
  );
};
