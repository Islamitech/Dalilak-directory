import React from 'react';
import { Navigation, MessageCircle, Phone, Eye } from 'lucide-react';
import { Business } from '../../types';
import {
  getBusinessMapDetails,
  getSmartWhatsAppUrl,
} from '../../utils/directoryEnhancements';
import { Drawer, IconButton } from '../../shared/ui';

export interface MapSelectedBusinessDrawerProps {
  selectedBiz: Business | null;
  setSelectedBiz: (biz: Business | null) => void;
  onSelectBusiness?: (biz: Business) => void;
  onStartNavigation?: (biz: Business) => void;
}

export const MapSelectedBusinessDrawer: React.FC<MapSelectedBusinessDrawerProps> = ({
  selectedBiz,
  setSelectedBiz,
  onSelectBusiness,
  onStartNavigation,
}) => {
  if (!selectedBiz) return null;

  const { effectiveUrl } = getBusinessMapDetails(selectedBiz);
  const smartWhatsAppUrl = getSmartWhatsAppUrl(selectedBiz);
  const phone = selectedBiz.phone || selectedBiz.ownerPhone;

  return (
    <Drawer
      isOpen={!!selectedBiz}
      onClose={() => setSelectedBiz(null)}
      position="bottom"
      hideDefaultHeader
      aria-label={`إجراءات ${selectedBiz.nameAr}`}
      className="!border-2 !border-slate-200/90 !rounded-t-2xl sm:!rounded-3xl sm:bottom-4 sm:inset-x-4 max-w-2xl mx-auto shadow-2xl !max-h-[80vh]"
      contentClassName="p-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-3 flex flex-col gap-2 font-['Cairo',sans-serif]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black text-slate-800 truncate">
          {selectedBiz.nameAr}
        </span>
        <IconButton
          aria-label={`إغلاق إجراءات ${selectedBiz.nameAr}`}
          onClick={() => setSelectedBiz(null)}
          size="sm"
          variant="ghost"
          className="!w-8 !h-8 !rounded-full !bg-slate-100 hover:!bg-slate-200 !text-slate-500"
          icon={<span className="text-sm font-black">✕</span>}
        />
      </div>

      {/* Direct Seeker Action Buttons */}
      <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100 text-xs font-black">
        {/* Directions */}
        {onStartNavigation ? (
          <button
            type="button"
            onClick={() => onStartNavigation(selectedBiz)}
            className="min-h-11 px-1 rounded-xl text-center flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black border border-amber-400"
            title="بدء التوجيه والملاحة إلى هذا النشاط"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="text-[11px]">ملاحة</span>
          </button>
        ) : effectiveUrl ? (
          <a
            href={effectiveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-11 px-1 rounded-xl text-center flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
            title="فتح الاتجاهات على خرائط Google"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px]">اتجاهات</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="min-h-11 px-1 rounded-xl bg-slate-50 text-slate-400 text-center flex items-center justify-center gap-1 opacity-50"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="text-[11px]">اتجاهات</span>
          </button>
        )}

        {/* WhatsApp */}
        {phone ? (
          <a
            href={smartWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-11 px-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-center flex items-center justify-center gap-1 transition-colors active:scale-95 cursor-pointer shadow-xs"
            title="محادثة واتساب مباشرة"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px]">واتساب</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="min-h-11 px-1 rounded-xl bg-slate-50 text-slate-400 text-center flex items-center justify-center gap-1 opacity-50"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="text-[11px]">واتساب</span>
          </button>
        )}

        {/* Phone Call */}
        {phone ? (
          <a
            href={`tel:${phone}`}
            className="min-h-11 px-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-center flex items-center justify-center gap-1 transition-colors active:scale-95 cursor-pointer shadow-xs"
            title="اتصال هاتفي مباشر"
          >
            <Phone className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-[11px]">اتصال</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="min-h-11 px-1 rounded-xl bg-slate-50 text-slate-400 text-center flex items-center justify-center gap-1 opacity-50"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="text-[11px]">اتصال</span>
          </button>
        )}

        {/* Full Details Modal */}
        <button
          type="button"
          onClick={() => {
            if (onSelectBusiness) onSelectBusiness(selectedBiz);
          }}
          className="min-h-11 px-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-center flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs font-black"
          title="عرض كامل التفاصيل والصور"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="text-[11px]">تفاصيل</span>
        </button>
      </div>
    </Drawer>
  );
};
