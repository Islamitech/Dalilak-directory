import React, { useState, useRef } from 'react';
import { Pressable } from '../../shared/ui';
import { AlertCircle, Camera, CheckCheck, Heart, MapPin, Play, Share2, ShieldCheck, X } from 'lucide-react';
import { Business } from '../../types';
import { displayBusinessName } from '../../shared/lib/format';
import { getCategoryVisual } from '../../utils/categoryVisuals';
import { collectRealPhotos } from '../../utils/categoryPhotos';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';
import { formatBusinessAreaLabel } from '../../utils/hadayekZoneHelper';
import { getBusinessOpenStatus } from '../../utils/directoryEnhancements';

export interface ActivityDetailHeaderProps {
  business: Business;
  photos: string[];
  onPreviewPhoto: (index: number) => void;
  onOpenVideoModal?: (biz: Business) => void;
  onClose?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onShare?: (e: React.MouseEvent) => void;
  copied?: boolean;
  copyError?: boolean;
}

export const ActivityDetailHeader: React.FC<ActivityDetailHeaderProps> = ({
  business,
  photos,
  onPreviewPhoto,
  onOpenVideoModal,
  onClose,
  isFavorite = false,
  onToggleFavorite,
  onShare,
  copied = false,
  copyError = false,
}) => {
  const visual = getCategoryVisual(business.category, 'light');
  const realPhotos = collectRealPhotos(photos, business.coverPhoto);
  const [brokenSrc, setBrokenSrc] = useState('');
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const mainPhoto = realPhotos[0] && brokenSrc !== realPhotos[0] ? realPhotos[0] : '';
  const isVerified = business.verificationStatus === 'verified' || Boolean(business.packageId?.includes('verified'));
  const rawName = displayBusinessName(business.nameAr, business.nameEn) || business.nameAr;
  const displayName = rawName.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim() || rawName;
  const areaString = formatBusinessAreaLabel(business);
  const openStatus = getBusinessOpenStatus(business.workingHours);

  const handleCarouselScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el.clientWidth) return;
    const nextIdx = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
    if (nextIdx >= 0 && nextIdx < realPhotos.length && nextIdx !== activePhotoIdx) {
      setActivePhotoIdx(nextIdx);
    }
  };

  return (
    <>
      <div className={`dl-dh relative ${realPhotos.length > 0 ? 'dl-has-photo' : 'dl-dh-plain'}`}>
        {realPhotos.length > 1 ? (
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none w-full h-full"
            style={{ scrollBehavior: 'smooth' }}
          >
            {realPhotos.map((photo, idx) => (
              <Pressable
                key={photo}
                type="button"
                className="snap-center shrink-0 w-full h-full relative block cursor-pointer p-0"
                aria-label={`معاينة صورة ${idx + 1} لـ ${business.nameAr}`}
                onClick={() => onPreviewPhoto(idx)}
              >
                <img
                  src={getOptimizedImageUrl(photo, 960, 720)}
                  alt=""
                  className="dl-dh-full-img w-full h-full object-cover"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
                <div className="dl-dh-full-overlay" />
              </Pressable>
            ))}
          </div>
        ) : mainPhoto ? (
          <Pressable
            type="button"
            className="dl-dh-full-btn"
            aria-label={`معاينة صور ${business.nameAr}`}
            onClick={() => onPreviewPhoto(0)}
          >
            <img
              src={getOptimizedImageUrl(mainPhoto, 960, 720)}
              alt=""
              className="dl-dh-full-img"
              loading="eager"
              onError={() => setBrokenSrc(mainPhoto)}
            />
            <div className="dl-dh-full-overlay" />
          </Pressable>
        ) : (
          <div className="dl-icon-cover" style={{ background: visual.gradient }} aria-hidden="true">
            {visual.icon}
          </div>
        )}

        {realPhotos.length > 1 && (
          <div className="absolute bottom-2.5 inset-inline-0 flex items-center justify-center gap-1.5 z-10">
            {realPhotos.map((_, i) => (
              <Pressable
                key={i}
                type="button"
                aria-label={`صورة ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIdx(i);
                  if (carouselRef.current) {
                    const w = carouselRef.current.clientWidth;
                    carouselRef.current.scrollTo({ left: w * i, behavior: 'smooth' });
                  }
                }}
                className={`h-1.5 rounded-pill transition-all cursor-pointer p-0 border-0 ${
                  i === activePhotoIdx ? 'w-4 bg-white shadow-sm' : 'w-1.5 bg-white/60 hover:bg-white/90'
                }`}
              />
            ))}
          </div>
        )}

        {(isVerified || realPhotos.length > 1) && (
          <div className="dl-dtl">
            {isVerified && (
              <span className="dl-hv">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>موثق</span>
              </span>
            )}
            {realPhotos.length > 1 && (
              <Pressable type="button" className="dl-dcam" onClick={() => onPreviewPhoto(activePhotoIdx)} aria-label={`${realPhotos.length} صور`}>
                <Camera className="w-3.5 h-3.5" />
                <span>{realPhotos.length}</span>
              </Pressable>
            )}
          </div>
        )}

        {business.videos && business.videos.length > 0 && onOpenVideoModal && (
          <Pressable type="button" onClick={() => onOpenVideoModal(business)} className="dl-dvid" aria-label="مشاهدة فيديو النشاط">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>فيديو</span>
          </Pressable>
        )}

        <div className="dl-dh-toolbar">
          {onToggleFavorite && (
            <Pressable
              type="button"
              onClick={() => onToggleFavorite(business.id)}
              aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
              aria-pressed={isFavorite}
              title={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
              className={`dl-dh-tool-btn ${isFavorite ? 'dl-on' : ''}`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Pressable>
          )}

          {onShare && (
            <Pressable
              type="button"
              onClick={onShare}
              aria-label={copied ? 'تم نسخ الرابط' : copyError ? 'تعذر نسخ الرابط' : 'نسخ رابط النشاط'}
              title={copied ? 'تم نسخ الرابط' : copyError ? 'تعذر نسخ الرابط' : 'نسخ رابط النشاط'}
              className={`dl-dh-tool-btn ${copied ? 'dl-on' : ''}`}
            >
              {copied ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : copyError ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <Share2 className="w-4 h-4" />}
            </Pressable>
          )}

          {onClose && (
            <Pressable type="button" onClick={onClose} aria-label="إغلاق" title="إغلاق" className="dl-dh-tool-btn">
              <X className="w-4 h-4" />
            </Pressable>
          )}
        </div>
      </div>

      <div className="dl-dmeta">
        <div className="flex items-center justify-between gap-2">
          {business.category && <p className="dl-hcat-quiet">{business.category}</p>}
          {openStatus && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-caption font-extrabold ${
                openStatus.isOpen
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                  : 'text-slate-600 bg-slate-100 border border-slate-200'
              }`}
            >
              <i className={`w-1.5 h-1.5 rounded-pill shrink-0 ${openStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{openStatus.badgeText}</span>
            </span>
          )}
        </div>
        <div className="dl-dmeta-row">
          <h2 id="activity-detail-modal-title" className="dl-dnm-h">
            <bdi dir="rtl">{displayName}</bdi>
          </h2>
        </div>
        {areaString && (
          <p className="dl-dloc">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            <span dir="auto">{areaString}</span>
          </p>
        )}
      </div>
    </>
  );
};
