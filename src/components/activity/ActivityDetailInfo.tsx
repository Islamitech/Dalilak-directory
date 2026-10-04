import React, { useState } from 'react';
import { Clock, MapPin, Navigation, ExternalLink, Star } from 'lucide-react';
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

  return (
    <>
      {/* Business Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Hours */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">ساعات العمل:</span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${openStatus.statusClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${openStatus.dotColor}`} />
                <span>{openStatus.badgeText}</span>
              </span>
            </div>
            <p className="font-black text-slate-800">
              {business.workingHours || 'يومياً على مدار الساعة'}
            </p>
          </div>
        </div>

        {/* Address */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="space-y-1 flex-1">
            <span className="text-[11px] font-bold text-slate-500 block">العنوان الدقيق:</span>
            <p className="font-black text-slate-800 leading-snug">
              {[business.street, business.landmark ? `(بجوار ${business.landmark})` : '', business.city, business.governorate].filter(Boolean).join('، ')}
            </p>
          </div>
        </div>
      </div>

      {/* In-App Interactive Mini Map */}
      {business.lat && business.lng ? (
        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 space-y-2.5 p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>موقع المنشأة على الخريطة التفاعلية</span>
            </div>
            <div className="flex items-center gap-1.5">
              {business.lat && business.lng && onShowOnMap && (
                <button
                  type="button"
                  onClick={() => onShowOnMap(business)}
                  className="py-1 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] transition-colors flex items-center gap-1 border border-amber-400 cursor-pointer shadow-2xs"
                  title="عرض على الخريطة التفاعلية بكامل الشاشة"
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
                  className="py-1 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition-colors flex items-center gap-1 border border-blue-200"
                  title="فتح على تطبيق Google Maps"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Google Maps</span>
                </a>
              )}
            </div>
          </div>
          <div className="relative h-44 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
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
            <div className="absolute bottom-2 end-2 bg-white/95 backdrop-blur-xs px-2 py-1 rounded-lg text-[10px] font-mono text-slate-700 shadow-sm border border-slate-200 flex items-center gap-1 pointer-events-none">
              <MapPin className="w-3 h-3 text-rose-500" />
              <span>{business.lat.toFixed(4)}, {business.lng.toFixed(4)}</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Description */}
      {business.description && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
          <span className="text-[11px] text-amber-700 font-black block">نبذة عن المكان والخدمات:</span>
          <p className={`text-slate-700 leading-relaxed font-medium ${!isDescExpanded && business.description.length > 200 ? 'line-clamp-3' : ''}`}>
            {business.description}
          </p>
          {business.description.length > 200 && (
            <button
              type="button"
              onClick={() => setIsDescExpanded(!isDescExpanded)}
              className="text-amber-600 hover:text-amber-700 font-bold text-xs pt-1 cursor-pointer"
            >
              {isDescExpanded ? 'عرض أقل ▴' : 'عرض المزيد ▾'}
            </button>
          )}
        </div>
      )}

      {/* Google Reviews Breakdown Widget */}
      {business.googleRatingEnabled && business.googleRating && business.googleRating > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span className="font-black text-slate-900">تقييمات زوار المكان على Google Maps</span>
            </div>
            {effectiveUrl && (
              <a
                href={effectiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] flex items-center gap-1"
              >
                <span>فتح المراجعات على الخريطة</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center shrink-0">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
                {business.googleRating.toFixed(1)}
              </span>
              <div className="flex items-center gap-0.5 justify-center pt-1" dir="ltr">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= Math.floor(business.googleRating || 0)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-500 font-bold block pt-0.5">
                ({business.googleReviewsCount || 0} تقييم موثق)
              </span>
            </div>

            <div className="flex-1 text-[11px] text-slate-600 font-medium leading-relaxed border-s border-slate-200 ps-4">
              هذا التقييم صادر من عملاء وزوار حقيقيين على خرائط Google الرسمية ومربوط مباشرة بحساب النشاط المعتمد.
            </div>
          </div>
        </div>
      )}
    </>
  );
};
