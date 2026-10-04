import React, { useState } from 'react';
import { Clock, MapPin, Navigation, ExternalLink, Star, Phone, Tag } from 'lucide-react';
import { Business } from '../../types';
import { getBusinessOpenStatus } from '../../utils/directoryEnhancements';

export interface ActivityDetailInfoProps {
  business: Business;
  effectiveUrl: string | null;
  onShowOnMap?: (biz: Business) => void;
}

export const ActivityDetailInfo: React.FC<ActivityDetailInfoProps> = ({
  business,
  effectiveUrl,
  onShowOnMap,
}) => {
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const openStatus = getBusinessOpenStatus(business.workingHours);
  const hasRating = Boolean(business.googleRatingEnabled && business.googleRating && business.googleRating > 0);
  let offerText: string | null = null;
  if (business.notes) {
    try {
      const parsedNotes = typeof business.notes === 'string' ? JSON.parse(business.notes) : business.notes;
      if (parsedNotes && typeof parsedNotes === 'object') {
        offerText = parsedNotes.offer || parsedNotes.specialOffer || null;
      }
    } catch {
      // notes was not JSON
    }
  }

  return (
    <div className="space-y-3.5">
      {/* Prototype Rating Box - Rendered ONLY if real verified rating exists */}
      {hasRating && (
        <div className="rating-box flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750">
          <div className="big-score text-3xl font-black text-amber-600 dark:text-amber-400 leading-none font-mono shrink-0">
            {business.googleRating!.toFixed(1)}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="stars flex items-center gap-0.5 text-amber-400" dir="ltr">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 ${
                    s <= Math.round(business.googleRating || 0)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300 dark:text-slate-600'
                  }`}
                />
              ))}
            </div>
            {business.googleReviewsCount !== undefined && (
              <div className="count text-xs text-slate-500 dark:text-slate-400 font-medium">
                {business.googleReviewsCount.toLocaleString('ar-EG')} تقييم موثق
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prototype Offer Card - Rendered ONLY if real offer exists */}
      {offerText && (
        <div className="offer-card p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-amber-900/20 border-1.5 border-dashed border-amber-400 dark:border-amber-600 flex items-center gap-3">
          <Tag className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="offer-text text-xs sm:text-sm font-black text-amber-900 dark:text-amber-200 leading-snug">
            {offerText}
          </div>
        </div>
      )}

      {/* Structured Info List */}
      <div className="info-list space-y-2.5">
        {/* Address Row */}
        <div className="info-row flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750">
          <div className="ico w-9 h-9 rounded-xl bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="text min-w-0 flex-1">
            <div className="lbl text-[11px] font-bold text-slate-500 dark:text-slate-400">العنوان</div>
            <div className="val text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug truncate">
              {[business.street, business.landmark ? `(بجوار ${business.landmark})` : '', business.city, business.governorate].filter(Boolean).join('، ')}
            </div>
          </div>
        </div>

        {/* Phone Row (if available) */}
        {business.phone && (
          <div className="info-row flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750">
            <div className="ico w-9 h-9 rounded-xl bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <Phone className="w-4 h-4" />
            </div>
            <div className="text min-w-0 flex-1">
              <div className="lbl text-[11px] font-bold text-slate-500 dark:text-slate-400">الهاتف</div>
              <div className="val text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 font-mono" dir="ltr">
                <a href={`tel:${business.phone}`} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                  {business.phone}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Hours / Status Row */}
        <div className="info-row flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750">
          <div className="ico w-9 h-9 rounded-xl bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text min-w-0 flex-1">
            <div className="lbl text-[11px] font-bold text-slate-500 dark:text-slate-400">الحالة الآن</div>
            <div className="val text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full border ${openStatus.statusClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${openStatus.dotColor}`} />
                <span>{openStatus.badgeText}</span>
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-xs font-normal">
                {business.workingHours || 'يومياً على مدار الساعة'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description (collapsible if long) */}
      {business.description && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 space-y-1.5">
          <span className="text-[11px] text-amber-700 dark:text-amber-400 font-black block">نبذة عن المكان والخدمات:</span>
          <p className={`text-slate-700 dark:text-slate-300 leading-relaxed font-medium text-xs ${!isDescExpanded && business.description.length > 200 ? 'line-clamp-3' : ''}`}>
            {business.description}
          </p>
          {business.description.length > 200 && (
            <button
              type="button"
              onClick={() => setIsDescExpanded(!isDescExpanded)}
              className="text-amber-600 dark:text-amber-400 hover:underline font-bold text-xs pt-1 cursor-pointer"
            >
              {isDescExpanded ? 'عرض أقل ▴' : 'عرض المزيد ▾'}
            </button>
          )}
        </div>
      )}

      {/* Interactive Mini Map */}
      {business.lat && business.lng && (
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-850 space-y-2.5 p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>الموقع على الخريطة التفاعلية</span>
            </div>
            <div className="flex items-center gap-1.5">
              {onShowOnMap && (
                <button
                  type="button"
                  onClick={() => onShowOnMap(business)}
                  className="py-1 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] transition-colors flex items-center gap-1 border border-amber-400 cursor-pointer shadow-2xs"
                  title="عرض على الخريطة التفاعلية"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>الخريطة الكاملة</span>
                </button>
              )}
              {effectiveUrl && (
                <a
                  href={effectiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-[11px] transition-colors flex items-center gap-1 border border-blue-200 dark:border-blue-800"
                  title="فتح على Google Maps"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Google Maps</span>
                </a>
              )}
            </div>
          </div>
          <div className="relative h-40 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
            <iframe
              title="موقع المنشأة التفاعلي"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${business.lng - 0.008}%2C${business.lat - 0.006}%2C${business.lng + 0.008}%2C${business.lat + 0.006}&layer=mapnik&marker=${business.lat}%2C${business.lng}`}
              className="w-full h-full"
            />
            <div className="absolute bottom-2 end-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-2 py-1 rounded-lg text-[10px] font-mono text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-1 pointer-events-none">
              <MapPin className="w-3 h-3 text-rose-500" />
              <span>{business.lat.toFixed(4)}, {business.lng.toFixed(4)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
