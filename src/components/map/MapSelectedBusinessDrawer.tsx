import React, { useState } from 'react';
import { Business } from '../../types';
import { ArrowLeft, X, ShieldCheck, Star, Phone, Navigation, MessageCircle } from 'lucide-react';
import { getBusinessOpenStatus } from '../../utils/directoryEnhancements';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';
import { getWhatsAppUrl } from '../../shared/lib/whatsapp';
import { getGoogleMapsDirectionsUrl } from '../../shared/lib/directions';

export interface MapSelectedBusinessDrawerProps {
  selectedBiz: Business | null;
  setSelectedBiz: (biz: Business | null) => void;
  onSelectBusiness?: (biz: Business) => void;
  onStartNavigation?: (biz: Business) => void;
}

/**
 * 🗺️ MapSelectedBusinessDrawer (Phase 3 - Prototype .map-sheet)
 *
 * Bottom-anchored card preview when a business pin is selected on the map:
 * - Positioned at bottom of map without legacy 100px switch spacing
 * - Squircle avatar with cover photo or category icon
 * - Business name, category/zone, verified badge, rating, and open/closed status
 * - Primary arrow button opening full ActivityDetailModal
 * - Quick action buttons (Call, WhatsApp, Directions)
 */
export const MapSelectedBusinessDrawer: React.FC<MapSelectedBusinessDrawerProps> = ({
  selectedBiz,
  setSelectedBiz,
  onSelectBusiness,
  onStartNavigation,
}) => {
  const [photoError, setPhotoError] = useState(false);

  if (!selectedBiz) return null;

  const openStatus = getBusinessOpenStatus(selectedBiz.workingHours);
  const mainPhoto = selectedBiz.coverPhoto || (selectedBiz.photos && selectedBiz.photos.length > 0 ? selectedBiz.photos[0] : null);
  const isVerified = selectedBiz.verificationStatus === 'verified' || selectedBiz.packageId?.includes('verified');
  const hasRating = Boolean(selectedBiz.googleRating && selectedBiz.googleRating > 0);
  const hasWorkingHours = Boolean(selectedBiz.workingHours && selectedBiz.workingHours.trim().length > 0);

  const cleanPhone = (selectedBiz.phone || '').replace(/[^\d+]/g, '');
  const whatsAppUrl = getWhatsAppUrl(
    selectedBiz.whatsapp || selectedBiz.phone,
    `مرحباً ${selectedBiz.nameAr}، وجدتك عبر منصة دليلك وأود الاستفسار عن خدماتكم.`
  );
  const directionsUrl = getGoogleMapsDirectionsUrl({
    lat: selectedBiz.lat,
    lng: selectedBiz.lng,
    destinationAddress: `${selectedBiz.city || ''} ${selectedBiz.street || ''}`,
    query: selectedBiz.nameAr,
  });

  const handleOpenDetails = () => {
    if (onSelectBusiness) {
      onSelectBusiness(selectedBiz);
    }
  };

  return (
    <div
      role="dialog"
      aria-label={`تفاصيل ${selectedBiz.nameAr}`}
      className="map-sheet absolute bottom-3 sm:bottom-4 start-3 end-3 sm:start-auto sm:end-auto sm:left-1/2 sm:-translate-x-1/2 w-auto sm:w-[440px] max-w-[calc(100vw-1.5rem)] z-[450] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl p-3.5 flex flex-col gap-2.5 transition-all duration-200 animate-in fade-in slide-in-from-bottom-6"
      dir="rtl"
    >
      {/* Drag handle / Close row */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="إغلاق بطاقة المعاينة"
          onClick={() => setSelectedBiz(null)}
          className="w-10 h-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-full mx-auto cursor-pointer transition-colors"
        />
        <button
          type="button"
          aria-label="إغلاق"
          onClick={() => setSelectedBiz(null)}
          className="absolute top-2.5 start-2.5 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Preview Card */}
      <div className="sheet-card flex items-center gap-3">
        {/* Squircle Avatar */}
        <div className="sheet-icon w-14 h-14 rounded-xl shrink-0 overflow-hidden relative flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600 text-white font-bold text-xl shadow-xs">
          {mainPhoto && !photoError ? (
            <img
              src={getOptimizedImageUrl(mainPhoto, 112, 112)}
              alt=""
              width="56"
              height="56"
              role="presentation"
              aria-hidden="true"
              loading="lazy"
              onError={() => setPhotoError(true)}
              className="w-full h-full object-cover select-none"
            />
          ) : (
            <span>🏢</span>
          )}
        </div>

        {/* Info */}
        <div className="sheet-info flex-1 min-w-0 cursor-pointer" onClick={handleOpenDetails}>
          <h4 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5 mb-0.5">
            <bdi dir="auto">{selectedBiz.nameAr}</bdi>
            {isVerified && <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0 inline" />}
          </h4>
          <div className="cat-line text-xs text-slate-500 dark:text-slate-400 truncate mb-1">
            {selectedBiz.category} · {[selectedBiz.city, selectedBiz.street].filter(Boolean).join('، ')}
          </div>
          <div className="meta flex items-center gap-2 text-xs">
            {hasRating && (
              <span className="rating font-bold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{selectedBiz.googleRating!.toFixed(1)}</span>
              </span>
            )}
            {hasWorkingHours && (
              <span
                className={`status px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  openStatus.isOpen
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                }`}
              >
                {openStatus.badgeText}
              </span>
            )}
          </div>
        </div>

        {/* Primary Arrow CTA Button */}
        <button
          type="button"
          id="sheetArrow"
          title="عرض التفاصيل الكاملة"
          aria-label="عرض التفاصيل الكاملة"
          onClick={handleOpenDetails}
          className="sheet-btn primary w-10 h-10 min-w-[40px] rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Quick Action Buttons Row */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        {cleanPhone ? (
          <a
            href={`tel:${cleanPhone}`}
            onClick={(e) => e.stopPropagation()}
            className="min-h-[40px] py-1.5 px-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
            title="اتصال"
          >
            <Phone className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
            <span>اتصال</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="min-h-[40px] py-1.5 px-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 font-bold flex items-center justify-center gap-1 opacity-50 cursor-not-allowed"
          >
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span>اتصال</span>
          </button>
        )}

        {whatsAppUrl ? (
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="min-h-[40px] py-1.5 px-2 rounded-xl text-xs font-bold bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-900 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800 flex items-center justify-center gap-1 transition-all cursor-pointer"
            title="واتساب"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>واتساب</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="min-h-[40px] py-1.5 px-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 font-bold flex items-center justify-center gap-1 opacity-50 cursor-not-allowed"
          >
            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
            <span>واتساب</span>
          </button>
        )}

        {onStartNavigation ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartNavigation(selectedBiz);
            }}
            className="min-h-[40px] py-1.5 px-2 rounded-xl text-xs font-bold bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-900 dark:text-blue-300 border border-blue-200/90 dark:border-blue-800 flex items-center justify-center gap-1 transition-all cursor-pointer"
            title="ملاحة"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>ملاحة</span>
          </button>
        ) : (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="min-h-[40px] py-1.5 px-2 rounded-xl text-xs font-bold bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-900 dark:text-blue-300 border border-blue-200/90 dark:border-blue-800 flex items-center justify-center gap-1 transition-all cursor-pointer"
            title="اتجاهات"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>اتجاهات</span>
          </a>
        )}
      </div>
    </div>
  );
};
