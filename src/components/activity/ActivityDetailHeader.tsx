import React from 'react';
import { MapPin, Star, Play, Camera } from 'lucide-react';
import { Business } from '../../types';

export interface ActivityDetailHeaderProps {
  business: Business;
  photos: string[];
  onPreviewPhoto: (index: number) => void;
  onOpenVideoModal?: (biz: Business) => void;
}

export const ActivityDetailHeader: React.FC<ActivityDetailHeaderProps> = ({
  business,
  photos,
  onPreviewPhoto,
  onOpenVideoModal,
}) => {
  return (
    <div className="space-y-3">
      <div className="relative h-56 sm:h-64 rounded-2xl overflow-hidden bg-slate-950 shadow-md group select-none">
        <button
          type="button"
          aria-label={`معاينة صور ${business.nameAr}`}
          onClick={() => {
            if (photos.length > 0) onPreviewPhoto(0);
          }}
          onContextMenu={(e) => e.preventDefault()}
          className="w-full h-full text-right cursor-pointer select-none protected-asset-shield focus:outline-none focus:ring-2 focus:ring-amber-500 block relative"
        >
          <img
            src={photos[0] || `/api/biz-og?biz=${business.id}`}
            alt=""
            role="presentation"
            aria-hidden="true"
            data-reader-skip="true"
            data-readability-ignore="true"
            draggable={false}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
          />
          <div
            className="absolute inset-0 z-[5] select-none pointer-events-none"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

          <div className="absolute bottom-3.5 inset-x-4 text-white space-y-1 z-10 pointer-events-none">
            <h1 className="text-xl sm:text-2xl font-black leading-tight drop-shadow-md">
              {business.nameAr}
            </h1>
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-300 font-bold">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{[business.city, business.governorate].filter(Boolean).join('، ')}</span>
              </span>

              {business.googleRatingEnabled && business.googleRating && (
                <span className="inline-flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded-lg border border-amber-400/40 text-amber-300 font-mono font-black">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{business.googleRating.toFixed(1)}</span>
                  {business.googleReviewsCount !== undefined && (
                    <span className="text-[10px] text-slate-300 font-normal">({business.googleReviewsCount} تقييم)</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </button>

        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10 pointer-events-none">
          <div className="flex items-center gap-1.5 min-w-0 pointer-events-auto">
            <span className="bg-slate-950/80 backdrop-blur-md text-amber-300 text-[11px] font-black px-3 py-1 rounded-xl border border-amber-400/30 shadow-xs whitespace-nowrap truncate max-w-[220px] sm:max-w-xs">
              {business.category}
            </span>
          </div>

          {business.videos && business.videos.length > 0 && onOpenVideoModal && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenVideoModal(business);
              }}
              className="pointer-events-auto bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>فيديو</span>
            </button>
          )}
        </div>
      </div>

      {photos.length > 1 && (
        <button
          type="button"
          onClick={() => onPreviewPhoto(0)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-100/90 hover:bg-amber-500/10 text-slate-800 hover:text-amber-950 border border-slate-200 hover:border-amber-400/60 transition-all cursor-pointer text-xs font-bold active:scale-[0.99] shadow-2xs group"
          title="فتح ومعاينة ألبوم الصور"
        >
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
            <span className="font-black">معاينة صور المنشأة</span>
          </div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-black bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-amber-800 shadow-2xs">
            <span>{photos.length} صور متوفرة</span>
            <span className="text-slate-400 font-normal">↗</span>
          </span>
        </button>
      )}
    </div>
  );
};
