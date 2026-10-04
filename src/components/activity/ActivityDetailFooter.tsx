import React from 'react';
import { Store, AlertTriangle, Link2, CheckCheck, AlertCircle, Copy, UserPlus, Navigation } from 'lucide-react';
import { Business } from '../../types';
import { getDisplayDirectoryUrl } from '../../utils/directoryUrl';

export interface ActivityDetailFooterProps {
  business: Business;
  similarPlaces: Business[];
  onSelectBusiness?: (biz: Business) => void;
  effectiveUrl: string | null;
  onShowOnMap?: (biz: Business) => void;
  onNavigateToBusinessClaim?: (biz: Business) => void;
  onShare: (e: React.MouseEvent) => void;
  copied: boolean;
  copyError: boolean;
  vCardSaved: boolean;
  onSaveContact: () => void;
}

export const ActivityDetailFooter: React.FC<ActivityDetailFooterProps> = ({
  business,
  similarPlaces,
  onSelectBusiness,
  effectiveUrl,
  onShowOnMap,
  onNavigateToBusinessClaim,
  onShare,
  copied,
  copyError,
  vCardSaved,
  onSaveContact,
}) => {
  return (
    <>
      {/* Similar Places */}
      {similarPlaces.length > 0 && (
        <div className="space-y-2.5 pt-3 border-t border-slate-100">
          <h4 className="font-black text-slate-900 text-xs">أنشطة مشابهة في نفس المنطقة</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {similarPlaces.map((sim) => (
              <button
                key={sim.id}
                type="button"
                onClick={() => {
                  if (onSelectBusiness) onSelectBusiness(sim);
                }}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 text-right flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <img
                  src={sim.coverPhoto || (sim.photos && sim.photos[0]) || `/api/biz-og?biz=${sim.id}`}
                  alt={sim.nameAr}
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-black text-slate-900 text-xs truncate">{sim.nameAr}</p>
                  <p className="text-[10px] text-slate-500 truncate">{sim.category}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Official Canonical Directory Permalink Bar */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/90 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Link2 className="w-4 h-4 text-amber-700 shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black text-amber-900 block">رابط صفحة المنشأة على الدليل العام (SEO):</span>
            <span className="text-xs font-mono text-slate-700 truncate block select-all" dir="ltr">
              {getDisplayDirectoryUrl(business)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onShare}
            className="py-1.5 px-3 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            title="نسخ رابط صفحة النشاط"
          >
            {copied ? (
              <>
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">تم النسخ</span>
              </>
            ) : copyError ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-rose-600">تعذر النسخ</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-amber-700" />
                <span>نسخ الرابط</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Discreet Claim & Report Footer */}
      <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 font-bold">
        <button
          type="button"
          onClick={() => {
            if (onNavigateToBusinessClaim) onNavigateToBusinessClaim(business);
            else {
              window.open(
                `https://wa.me/201556221141?text=${encodeURIComponent(
                  `مرحباً دليلك 👋 أنا صاحب منشأة "${business.nameAr}" وأود إدارة وتحديث بياناتها.`
                )}`,
                '_blank'
              );
            }
          }}
          className="text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Store className="w-3.5 h-3.5" />
          <span>هل أنت صاحب هذا النشاط؟ اطلب إدارته وتحديثه</span>
        </button>

        <a
          href={`https://wa.me/201556221141?text=${encodeURIComponent(
            `إبلاغ عن بيانات: منشأة "${business.nameAr}" (كود: ${business.id})`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>إبلاغ عن خطأ</span>
        </a>
      </div>
    </>
  );
};

export const ActivityDetailStickyBar: React.FC<{
  business: Business;
  effectiveUrl: string | null;
  onShowOnMap?: (biz: Business) => void;
  onSaveContact: () => void;
  vCardSaved: boolean;
}> = ({ business, effectiveUrl, onShowOnMap, onSaveContact, vCardSaved }) => {
  return (
    <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5">
      <button
        type="button"
        onClick={onSaveContact}
        className={`flex-1 text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 font-black transition-all cursor-pointer border ${
          vCardSaved
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
        }`}
      >
        <UserPlus className="w-4 h-4 text-slate-600" />
        <span>{vCardSaved ? 'تم حفظ جهة الاتصال' : 'حفظ جهة الاتصال'}</span>
      </button>

      {business.lat && business.lng && onShowOnMap ? (
        <button
          type="button"
          onClick={() => onShowOnMap(business)}
          className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all text-center cursor-pointer border border-amber-400"
          title="عرض النشاط على خريطة دليلك وتحديد موقعه بدقة"
        >
          <Navigation className="w-4 h-4 text-slate-950" />
          <span>الموقع على الخريطة</span>
        </button>
      ) : effectiveUrl ? (
        <a
          href={effectiveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all text-center"
        >
          <Navigation className="w-4 h-4" />
          <span>الموقع على الخريطة</span>
        </a>
      ) : null}
    </div>
  );
};
