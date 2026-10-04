import React from 'react';
import { Phone, MessageCircle, Navigation } from 'lucide-react';
import { Business } from '../../types';

export interface ActivityDetailQuickActionsProps {
  business: Business;
  effectiveUrl: string | null;
  smartWhatsAppUrl: string;
  onShowOnMap?: (biz: Business) => void;
}

export const ActivityDetailQuickActions: React.FC<ActivityDetailQuickActionsProps> = ({
  business,
  effectiveUrl,
  smartWhatsAppUrl,
  onShowOnMap,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {business.phone ? (
        <a
          href={`tel:${business.phone}`}
          className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs py-3 px-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-xs transition-all text-center"
        >
          <Phone className="w-4 h-4 shrink-0" />
          <span>اتصال مباشر</span>
        </a>
      ) : (
        <button disabled className="opacity-50 bg-slate-100 text-slate-400 font-bold text-xs py-3 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5">
          <Phone className="w-4 h-4" />
          <span>لا يوجد هاتف</span>
        </button>
      )}

      <a
        href={smartWhatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 active:scale-95 font-black text-xs py-3 px-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-xs transition-all text-center"
      >
        <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>محادثة واتساب</span>
      </a>

      {business.lat && business.lng && onShowOnMap ? (
        <button
          type="button"
          onClick={() => onShowOnMap(business)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3 px-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all text-center cursor-pointer border border-amber-400"
          title="عرض النشاط على خريطة دليلك وتحديد موقعه بدقة"
        >
          <Navigation className="w-4 h-4 text-slate-950 shrink-0" />
          <span>الموقع على الخريطة</span>
        </button>
      ) : effectiveUrl ? (
        <a
          href={effectiveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 active:scale-95 font-black text-xs py-3 px-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-xs transition-all text-center"
        >
          <Navigation className="w-4 h-4 text-blue-600 shrink-0" />
          <span>الاتجاهات</span>
        </a>
      ) : (
        <button disabled className="opacity-50 bg-slate-100 text-slate-400 font-bold text-xs py-3 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5">
          <Navigation className="w-4 h-4" />
          <span>لا يوجد موقع</span>
        </button>
      )}
    </div>
  );
};
