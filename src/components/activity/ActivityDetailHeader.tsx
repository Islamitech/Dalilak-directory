import React from 'react';
import { Pressable } from '../../shared/ui';
import { AlertCircle, Camera, CheckCheck, Heart, MapPin, Play, Share2, ShieldCheck, X } from 'lucide-react';
import { Business } from '../../types';
import { displayBusinessName } from '../../shared/lib/format';
import { getCategoryVisual } from '../../utils/categoryVisuals';

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
  const visual = getCategoryVisual(business.category);
  const mainPhoto = photos.length > 0 ? photos[0] : (business.coverPhoto || null);
  const hasPhotos = photos.length > 0 || Boolean(mainPhoto);
  const isVerified = business.verificationStatus === 'verified' || Boolean(business.packageId?.includes('verified'));
  const rawName = displayBusinessName(business.nameAr, business.nameEn) || business.nameAr;
  const displayName = rawName
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || rawName;
  const areaString = business.category || '';

  return (
    <div
      className={`dl-dh ${mainPhoto ? 'dl-has-photo' : ''}`}
      style={{ background: mainPhoto ? 'var(--text)' : visual.gradient }}
    >
      {mainPhoto ? (
        <Pressable
          type="button"
          className="dl-dh-full-btn"
          data-lb="0"
          aria-label={`معاينة صور ${business.nameAr}`}
          onClick={() => onPreviewPhoto(0)}
        >
          <img
            src={mainPhoto}
            alt=""
            className="dl-dh-full-img"
            loading="eager"
          />
          <div className="dl-dh-full-overlay" />
          {mainPhoto.includes('images.unsplash.com') && (
            <span className="absolute bottom-3 start-3 z-10 text-caption font-extrabold text-white bg-slate-950/70 rounded-pill px-2.5 py-1">
              صورة توضيحية
            </span>
          )}
        </Pressable>
      ) : (
        <Pressable
          type="button"
          className="dl-dhp"
          data-lb="0"
          aria-label={`معاينة صور ${business.nameAr}`}
          onClick={() => {
            if (hasPhotos) onPreviewPhoto(0);
          }}
        >
          <div className="dl-dh-circle">
            {visual.icon}
          </div>
        </Pressable>
      )}

      {/* Bottom gradient + merged title block (same look as the list card) */}
      <div className="dl-dh-grad" aria-hidden="true" />

      {(isVerified || Boolean(business.googleRating && business.googleRating > 0)) && (
        <div className="dl-dtl">
          {isVerified && (
            <span className="dl-hv">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>موثق</span>
            </span>
          )}
          {Boolean(business.googleRating && business.googleRating > 0) && (
            <div className="dl-rp" dir="ltr">
              <span className="text-[var(--primary-2)]">★</span>
              <span>{business.googleRating!.toFixed(1)}</span>
            </div>
          )}
        </div>
      )}

      <div className="dl-dtt">
        <h2 id="activity-detail-modal-title" className="dl-dnm-h dl-ts">
          <bdi dir="rtl">{displayName}</bdi>
        </h2>
        {areaString && (
          <p className="dl-loc dl-ts">
            <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
            <span dir="auto">{areaString}</span>
          </p>
        )}
      </div>

      {/* Photo Count Chip (bottom-end / left in RTL) */}
      {photos.length > 0 && (
        <span className="dl-dcam">
          <Camera className="w-3.5 h-3.5" />
          <span>{photos.length}</span>
        </span>
      )}

      {/* Video Pill (bottom-start / right in RTL) */}
      {business.videos && business.videos.length > 0 && onOpenVideoModal && (
        <Pressable
          type="button"
          onClick={() => onOpenVideoModal(business)}
          className="dl-dvid"
          aria-label="مشاهدة فيديو النشاط"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>فيديو</span>
        </Pressable>
      )}

      {/* Close Button (top-start / right in RTL, 36px/44px touch) */}
      {onClose && (
        <Pressable
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          title="إغلاق"
          className="dl-dx min-w-[36px] min-h-[36px]"
        >
          <X className="w-4 h-4" />
        </Pressable>
      )}

      {/* Share / copy link (next to favorite) */}
      {onShare && (
        <Pressable
          type="button"
          onClick={onShare}
          aria-label={copied ? 'تم نسخ الرابط' : copyError ? 'تعذر نسخ الرابط' : 'نسخ رابط النشاط'}
          title={copied ? 'تم نسخ الرابط' : copyError ? 'تعذر نسخ الرابط' : 'نسخ رابط النشاط'}
          className={`dl-dsh min-w-[36px] min-h-[36px] ${copied ? 'dl-on' : ''}`}
        >
          {copied ? (
            <CheckCheck className="w-4 h-4" />
          ) : copyError ? (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </Pressable>
      )}
      {/* Favorite Button (top-end / left in RTL, 36px/44px touch) */}
      {onToggleFavorite && (
        <Pressable
          type="button"
          onClick={() => onToggleFavorite(business.id)}
          aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          aria-pressed={isFavorite}
          title={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          className={`dl-dfv min-w-[36px] min-h-[36px] ${isFavorite ? 'dl-on' : ''}`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </Pressable>
      )}
    </div>
  );
};
