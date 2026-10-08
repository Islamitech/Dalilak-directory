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
    <div className="sheet-hero relative select-none">
      {/* Full-image hero (edge-to-edge top of the sheet) */}
      <div className="relative h-52 sm:h-64 bg-slate-100 overflow-hidden">
        <button
          type="button"
          aria-label={`معاينة صور ${business.nameAr}`}
          onClick={() => {
            if (photos.length > 0) onPreviewPhoto(0);
          }}
          className="protected-asset-shield absolute inset-0 w-full h-full block cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500"
        >
          {mainPhoto ? (
            <img
              src={mainPhoto}
              alt=""
              role="presentation"
              aria-hidden="true"
              draggable={false}
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
            />
          ) : (
            <span className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 text-white">
              <Store className="w-12 h-12" aria-hidden="true" />
            </span>
          )}
        </button>

        {/* Photo count chip (bottom-start) */}
        {photos.length > 0 && (
          <span className="absolute bottom-3 start-3 z-10 inline-flex items-center gap-1 bg-slate-950/65 text-white text-[11px] font-black px-2.5 py-1 rounded-full pointer-events-none">
            <Camera className="w-3.5 h-3.5" />
            <span>{photos.length}</span>
          </span>
        )}

        {/* Video pill trigger (bottom-end) */}
        {business.videos && business.videos.length > 0 && onOpenVideoModal && (
          <button
            type="button"
            onClick={() => onOpenVideoModal(business)}
            className="absolute bottom-3 end-3 z-10 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer min-h-[36px]"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>فيديو</span>
          </button>
        )}

        {/* Close button (top-end, 44px target) */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            title="إغلاق"
            className="absolute top-3 end-3 z-10 w-9 h-9 min-w-[44px] min-h-[44px] rounded-full bg-white/90 hover:bg-white border border-slate-200 text-slate-600 hover:text-rose-600 flex items-center justify-center shadow-sm transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Favorite button (top-start, 44px target) */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => onToggleFavorite(business.id)}
            aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            title={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            className={`absolute top-3 start-3 z-10 w-9 h-9 min-w-[44px] min-h-[44px] rounded-full border flex items-center justify-center shadow-sm transition-all cursor-pointer ${
              isFavorite
                ? 'bg-rose-500 border-rose-500 text-white'
                : 'bg-white/90 border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-300'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Name block below the photo */}
      <div className="px-4 sm:px-5 pt-4 pb-4 text-center border-b border-slate-200 bg-white">
        <h2
          id="activity-detail-modal-title"
          className="text-xl sm:text-2xl font-black text-slate-900 flex items-center justify-center gap-2 leading-snug"
        >
          <bdi dir="auto">{business.nameAr}</bdi>
          {isVerified && (
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" aria-label="نشاط موثق ومعتمد" />
          )}
        </h2>

        <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
          <span className="sheet-cat inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/70">
            {[business.category, business.city || business.governorate].filter(Boolean).join(' · ')}
          </span>
        </div>
      </div>
    </div>
  );
};
