import React from 'react';
import { Phone, MessageCircle, Navigation, Share2, CheckCheck } from 'lucide-react';
import { Business } from '../../types';

export interface ActivityDetailQuickActionsProps {
  business: Business;
  effectiveUrl: string | null;
  smartWhatsAppUrl: string;
  onShowOnMap?: (biz: Business) => void;
  onShare?: (e: React.MouseEvent) => void;
  copied?: boolean;
}

export const ActivityDetailQuickActions: React.FC<ActivityDetailQuickActionsProps> = ({
  business,
  effectiveUrl,
  smartWhatsAppUrl,
  onShowOnMap,
  onShare,
  copied = false,
}) => {
  return (
    <div className="actions-grid grid grid-cols-4 gap-2">
      {/* Primary Call CTA (spans 2 columns) */}
      {business.phone ? (
        <a
          href={`tel:${business.phone}`}
          className="act-btn primary col-span-2 min-h-[44px] py-3 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all"
        >
          <Phone className="w-4 h-4 shrink-0" />
          <span>اتصال مباشر</span>
        </a>
      ) : (
        <button
          disabled
          className="act-btn primary col-span-2 min-h-[44px] py-3 px-3 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
        >
          <Phone className="w-4 h-4 shrink-0" />
          <span>لا يوجد هاتف</span>
        </button>
      )}

      {/* WhatsApp CTA */}
      <a
        href={smartWhatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="محادثة واتساب"
        className="act-btn outline min-h-[44px] py-3 px-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 active:scale-[0.98] font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
        title="محادثة واتساب"
      >
        <MessageCircle className="w-4 h-4 shrink-0 text-emerald-600" />
        <span className="hidden sm:inline">واتساب</span>
      </a>

      {/* Directions CTA */}
      {business.lat && business.lng && onShowOnMap ? (
        <button
          type="button"
          onClick={() => onShowOnMap(business)}
          aria-label="عرض على الخريطة"
          className="act-btn outline min-h-[44px] py-3 px-2 rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-amber-50 active:scale-[0.98] font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          title="الاتجاهات على الخريطة"
        >
          <Navigation className="w-4 h-4 shrink-0 text-amber-600" />
          <span className="hidden sm:inline">الاتجاهات</span>
        </button>
      ) : effectiveUrl ? (
        <a
          href={effectiveUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="الاتجاهات عبر Google Maps"
          className="act-btn outline min-h-[44px] py-3 px-2 rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-amber-50 active:scale-[0.98] font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
          title="الاتجاهات"
        >
          <Navigation className="w-4 h-4 shrink-0 text-amber-600" />
          <span className="hidden sm:inline">الاتجاهات</span>
        </a>
      ) : onShare ? (
        <button
          type="button"
          onClick={onShare}
          aria-label="مشاركة النشاط"
          className="act-btn outline min-h-[44px] py-3 px-2 rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 active:scale-[0.98] font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          title="مشاركة رابط النشاط"
        >
          {copied ? (
            <CheckCheck className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <Share2 className="w-4 h-4 shrink-0 text-slate-600" />
          )}
          <span className="hidden sm:inline">{copied ? 'تم النسخ' : 'مشاركة'}</span>
        </button>
      ) : (
        <button
          disabled
          className="act-btn outline min-h-[44px] py-3 px-2 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed"
        >
          <Navigation className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">لا يوجد موقع</span>
        </button>
      )}
    </div>
  );
};
