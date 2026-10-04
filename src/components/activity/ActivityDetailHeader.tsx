import React from 'react';
import { Camera, Heart, Play, ShieldCheck, Store, X } from 'lucide-react';
import { Business } from '../../types';

export interface ActivityDetailHeaderProps {
  business: Business;
  photos: string[];
  onPreviewPhoto: (index: number) => void;
  onOpenVideoModal?: (biz: Business) => void;
  onClose?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export const ActivityDetailHeader: React.FC<ActivityDetailHeaderProps> = ({
  business,
  photos,
  onPreviewPhoto,
  onOpenVideoModal,
  onClose,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const isVerified = business.verificationStatus === 'verified' || business.packageId?.includes('verified');
  const mainPhoto = photos.length > 0 ? photos[0] : (business.coverPhoto || null);

  return (
    <div className="sheet-hero relative p-6 pt-7 text-center border-b border-slate-200 dark:border-slate-800 bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-slate-850 dark:to-slate-800 select-none">
      {/* Close button (44px target) */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="close-btn absolute top-4 end-4 w-9 h-9 min-w-[44px] min-h-[44px] rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Favorite button (44px target) */}
      {onToggleFavorite && (
        <button
          type="button"
          onClick={() => onToggleFavorite(business.id)}
          aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          title={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          className={`fav-btn absolute top-4 start-4 w-9 h-9 min-w-[44px] min-h-[44px] rounded-full border flex items-center justify-center transition-all cursor-pointer ${
            isFavorite
              ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800'
              : 'bg-white/80 text-slate-400 border-slate-200 hover:text-rose-500 hover:bg-rose-50/50 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-400 dark:hover:text-rose-400'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-rose-600 dark:text-rose-400' : ''}`} />
        </button>
      )}

      {/* Squircle Avatar / Icon */}
      <div className="sheet-icon-lg w-20 h-20 sm:w-21 sm:h-21 rounded-3xl mx-auto mb-3.5 shadow-md border border-amber-200/60 dark:border-slate-700 flex items-center justify-center overflow-hidden relative bg-gradient-to-br from-amber-500 to-amber-700 text-white">
        <button
          type="button"
          aria-label={`معاينة صور ${business.nameAr}`}
          onClick={() => {
            if (photos.length > 0) onPreviewPhoto(0);
          }}
          className="w-full h-full text-start cursor-pointer select-none protected-asset-shield focus:outline-none focus:ring-2 focus:ring-amber-500 block relative group"
        >
          {mainPhoto ? (
            <img
              src={mainPhoto}
              alt=""
              role="presentation"
              aria-hidden="true"
              draggable={false}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              <Store className="w-8 h-8" />
            </div>
          )}
        </button>
      </div>

      {/* Video Pill Trigger */}
      {business.videos && business.videos.length > 0 && onOpenVideoModal && (
        <div className="flex items-center justify-center mb-2">
          <button
            type="button"
            onClick={() => onOpenVideoModal(business)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer min-h-[36px]"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>فيديو</span>
          </button>
        </div>
      )}

      {/* Business Name */}
      <h2
        id="activity-detail-modal-title"
        className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2 mb-1.5 leading-snug"
      >
        <bdi dir="auto">{business.nameAr}</bdi>
        {isVerified && (
          <ShieldCheck className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" aria-label="نشاط موثق ومعتمد" />
        )}
      </h2>

      {/* Category & Area */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <span className="sheet-cat inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
          {[business.category, business.city || business.governorate].filter(Boolean).join(' · ')}
        </span>
      </div>

      {/* Photo gallery preview count */}
      {photos.length > 1 && (
        <div className="mt-2.5">
          <button
            type="button"
            onClick={() => onPreviewPhoto(0)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-400 hover:underline cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>معاينة {photos.length} صور متوفرة</span>
          </button>
        </div>
      )}
    </div>
  );
};
