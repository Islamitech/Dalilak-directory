import React from 'react';
import { Phone, MessageCircle, Navigation, ShieldCheck, Star } from 'lucide-react';
import { Business } from '../../types';
import { Pressable, ButtonLink } from '../../shared/ui';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';
import { getCategoryFallbackCover } from '../../utils/categoryPhotos';
import { formatRating } from '../../shared/lib/format';

export interface ActivityDetailPeekProps {
  business: Business;
  photos: string[];
  onExpand: () => void;
  onDirections?: () => void;
  isVerified: boolean;
  areaLabel?: string;
  openStatus?: { isOpen: boolean; badgeText: string } | null;
  smartWhatsAppUrl?: string;
}

export const ActivityDetailPeek: React.FC<ActivityDetailPeekProps> = ({
  business,
  photos,
  onExpand,
  onDirections,
  isVerified,
  areaLabel,
  openStatus,
  smartWhatsAppUrl,
}) => {
  const fallbackCover = getCategoryFallbackCover(business.category);
  const rawCover = business.coverPhoto && !business.coverPhoto.includes('places.googleapis.com') ? business.coverPhoto : null;
  const peekPhotoSrc = getOptimizedImageUrl(photos[0] || rawCover || fallbackCover, 160, 160) || fallbackCover;
  const ratingText = business.googleRatingEnabled !== false ? formatRating(business.googleRating) : null;
  const rawPhone = (business.phone || '').trim();
  const hasPhone = Boolean(rawPhone && rawPhone.length > 3);

  return (
    <div className="ps-3 pe-12 py-1.5 flex items-center gap-3 h-[78px] text-start select-none">
      <Pressable
        type="button"
        onClick={onExpand}
        className="flex-1 min-w-0 flex items-center gap-3 cursor-pointer p-0 bg-transparent border-0 text-start"
        aria-label={`عرض تفاصيل ${business.nameAr}`}
      >
        <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200/80 shadow-xs relative">
          <img
            src={peekPhotoSrc}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackCover; }}
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-extrabold text-slate-900 truncate tracking-tight">{business.nameAr}</h4>
            {isVerified && <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-label="موثق" />}
          </div>

          <div className="flex items-center gap-1.5 text-caption font-medium text-slate-500 truncate mt-0.5">
            <span className="font-bold text-amber-800">{business.category}</span>
            {areaLabel && <span className="text-slate-400 truncate">· {areaLabel}</span>}
          </div>

          <div className="flex items-center gap-2 mt-1 text-caption font-bold text-slate-500">
            {openStatus && (
              <span className={`inline-flex items-center gap-1 shrink-0 ${openStatus.isOpen ? 'text-emerald-700' : 'text-slate-500'}`}>
                <i className={`w-1.5 h-1.5 rounded-full ${openStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span>{openStatus.isOpen ? 'مفتوح' : 'مغلق'}</span>
              </span>
            )}
            {ratingText && (
              <span className="inline-flex items-center gap-0.5 text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded-md font-extrabold">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span dir="ltr">{ratingText}</span>
              </span>
            )}
          </div>
        </div>
      </Pressable>

      <div className="flex items-center gap-1 shrink-0 me-1">
        {hasPhone && (
          <ButtonLink
            href={`tel:${rawPhone.replace(/[^\d+]/g, '')}`}
            variant="secondary"
            size="sm"
            leadingIcon={<Phone className="w-4 h-4 text-emerald-600" />}
            aria-label="اتصال هاتفي مباشر"
            className="h-11 w-11 rounded-xl p-0 flex items-center justify-center bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
          />
        )}
        {smartWhatsAppUrl && (
          <ButtonLink
            href={smartWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
            size="sm"
            leadingIcon={<MessageCircle className="w-4 h-4 text-emerald-600" />}
            aria-label="مراسلة واتساب"
            className="h-11 w-11 rounded-xl p-0 flex items-center justify-center bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
          />
        )}
        {onDirections && (
          <Pressable
            type="button"
            onClick={onDirections}
            aria-label="الاتجاهات"
            className="h-11 w-11 rounded-xl p-0 flex items-center justify-center bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 cursor-pointer"
          >
            <Navigation className="w-4 h-4 text-amber-700" />
          </Pressable>
        )}
      </div>
    </div>
  );
};
