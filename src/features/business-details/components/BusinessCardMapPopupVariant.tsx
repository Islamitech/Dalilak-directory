import React from 'react';
import { Navigation, MessageCircle, Phone, Eye, ShieldCheck, MapPin, Star, X } from 'lucide-react';
import { Business } from '../../../types';
import {
  getBusinessMapDetails,
  getSmartWhatsAppUrl,
  getBusinessOpenStatus,
} from '../../../utils/directoryEnhancements';
import { getOptimizedImageUrl } from '../../../utils/imageOptimizer';
import { getCategoryFallbackCover } from '../../../utils/categoryPhotos';
import { getFirstStrongDirection } from '../../../utils/textDirection';
import type { BusinessCardVariantProps } from './BusinessCardGridVariant';

export const BusinessCardMapPopupVariant: React.FC<BusinessCardVariantProps> = ({
  business,
  onOpenBusiness,
  onStartNavigation,
  onClose,
}) => {
  const { effectiveUrl } = getBusinessMapDetails(business);
  const smartWhatsAppUrl = getSmartWhatsAppUrl(business);
  const phone = business.phone;
  const openStatus = getBusinessOpenStatus(business.workingHours);

  const fallbackCover = getCategoryFallbackCover(business.category);
  const mainPhoto =
    business.coverPhoto ||
    (business.photos && business.photos.length > 0 ? business.photos[0] : fallbackCover);
  const locationString = [business.city, business.street].filter(Boolean).join('، ');

  return (
    <div className="flex flex-col gap-2 p-3 font-['Cairo',sans-serif] bg-white rounded-2xl border border-slate-200 shadow-sm" dir="rtl">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-caption font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 truncate">
            {business.category}
          </span>
          <span className="inline-flex items-center gap-0.5 text-caption font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>موثق</span>
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            aria-label="إغلاق"
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Center Details */}
      <div className="flex items-center gap-2.5">
        <img
          src={getOptimizedImageUrl(mainPhoto, 120, 120)}
          alt={business.nameAr}
          className="w-14 h-14 rounded-xl object-cover shrink-0 bg-slate-100"
          loading="lazy"
        />
        <div className="min-w-0 flex-1 space-y-0.5">
          <h4 dir={getFirstStrongDirection(business.nameAr)} className="text-sm font-extrabold text-slate-900 truncate">
            <bdi dir="auto">{business.nameAr}</bdi>
          </h4>
          <div dir={getFirstStrongDirection(locationString)} className="flex items-center gap-1 text-caption text-slate-500 truncate">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span dir="auto">{locationString}</span>
          </div>
          <div className="flex items-center gap-2 text-caption font-bold">
            <span className={openStatus.isOpen ? 'text-emerald-700' : 'text-slate-500'}>
              {openStatus.badgeText}
            </span>
            {business.googleRating && (
              <span className="inline-flex items-center gap-0.5 text-amber-700">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{business.googleRating.toFixed(1)}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons Trio / Quads */}
      <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100 text-xs font-extrabold">
        {onStartNavigation ? (
          <button
            type="button"
            onClick={() => onStartNavigation(business)}
            className="min-h-10 px-1 rounded-xl text-center flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold border border-amber-400"
            title="بدء التوجيه والملاحة إلى هذا النشاط"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="text-caption">ملاحة</span>
          </button>
        ) : effectiveUrl ? (
          <a
            href={effectiveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-10 px-1 rounded-xl text-center flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
            title="فتح الاتجاهات على خرائط Google"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-caption">اتجاهات</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="min-h-10 px-1 rounded-xl bg-slate-50 text-slate-400 text-center flex items-center justify-center gap-1 opacity-50"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="text-caption">اتجاهات</span>
          </button>
        )}

        {phone ? (
          <a
            href={smartWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-10 px-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-center flex items-center justify-center gap-1 transition-colors active:scale-95 cursor-pointer shadow-xs"
            title="محادثة واتساب مباشرة"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-caption">واتساب</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="min-h-10 px-1 rounded-xl bg-slate-50 text-slate-400 text-center flex items-center justify-center gap-1 opacity-50"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="text-caption">واتساب</span>
          </button>
        )}

        {phone ? (
          <a
            href={`tel:${phone}`}
            className="min-h-10 px-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-center flex items-center justify-center gap-1 transition-colors active:scale-95 cursor-pointer shadow-xs font-bold"
            title="اتصال هاتفي مباشر"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="text-caption">اتصال</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="min-h-10 px-1 rounded-xl bg-slate-50 text-slate-400 text-center flex items-center justify-center gap-1 opacity-50"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="text-caption">اتصال</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onOpenBusiness(business)}
          className="min-h-10 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-center flex items-center justify-center gap-1 transition-colors active:scale-95 cursor-pointer shadow-xs font-bold"
          title="عرض صفحة النشاط الكاملة"
        >
          <Eye className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-caption">التفاصيل</span>
        </button>
      </div>
    </div>
  );
};
