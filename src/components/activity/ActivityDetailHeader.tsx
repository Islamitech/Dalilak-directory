import React, { useState } from 'react';
import { Pressable } from '../../shared/ui';
import { AlertCircle, Camera, CheckCheck, Heart, MapPin, Play, Share2, ShieldCheck, X } from 'lucide-react';
import { Business } from '../../types';
import { displayBusinessName } from '../../shared/lib/format';
import { getCategoryVisual } from '../../utils/categoryVisuals';
import { collectRealPhotos } from '../../utils/categoryPhotos';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';
import { formatBusinessAreaLabel } from '../../utils/hadayekZoneHelper';

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
  const mainPhoto = realPhotos[0] && brokenSrc !== realPhotos[0] ? realPhotos[0] : '';
  const isVerified = business.verificationStatus === 'verified' || Boolean(business.packageId?.includes('verified'));
  const rawName = displayBusinessName(business.nameAr, business.nameEn) || business.nameAr;
  const displayName = rawName.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim() || rawName;
  const areaString = formatBusinessAreaLabel(business);

  return (
    <>
      <div className={`dl-dh ${mainPhoto ? 'dl-has-photo' : 'dl-dh-plain'}`}>
        {mainPhoto ? (
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
          <div className="dl-icon-cover" aria-hidden="true">
            {visual.icon}
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
              <Pressable type="button" className="dl-dcam" onClick={() => onPreviewPhoto(0)} aria-label={`${realPhotos.length} صور`}>
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

        {onClose && (
          <Pressable type="button" onClick={onClose} aria-label="إغلاق" title="إغلاق" className="dl-dx min-w-11 min-h-11">
            <X className="w-4 h-4" />
          </Pressable>
        )}

        {onShare && (
          <Pressable
            type="button"
            onClick={onShare}
            aria-label={copied ? 'تم نسخ الرابط' : copyError ? 'تعذر نسخ الرابط' : 'نسخ رابط النشاط'}
            title={copied ? 'تم نسخ الرابط' : copyError ? 'تعذر نسخ الرابط' : 'نسخ رابط النشاط'}
            className={`dl-dsh min-w-[36px] min-h-[36px] ${copied ? 'dl-on' : ''}`}
          >
            {copied ? <CheckCheck className="w-4 h-4" /> : copyError ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <Share2 className="w-4 h-4" />}
          </Pressable>
        )}

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

      <div className="dl-dmeta">
        {business.category && <p className="dl-hcat-quiet">{business.category}</p>}
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
