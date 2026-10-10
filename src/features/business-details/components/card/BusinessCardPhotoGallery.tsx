import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Pressable } from '../../../../shared/ui';
import { Business } from '../../../../types';
import { getOptimizedImageUrl } from '../../../../utils/imageOptimizer';
import { getCategoryFallbackCover } from '../../../../utils/categoryPhotos';
import { displayBusinessName } from '../../../../shared/lib/format';
import { ShieldCheck, Heart, Play, MapPin, Store } from 'lucide-react';
import { BusinessCardGalleryNav } from './BusinessCardGalleryNav';

export interface BusinessCardPhotoGalleryProps {
  business: Business;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onOpenBusiness: (biz: Business) => void;
  onOpenVideoModal?: (biz: Business) => void;
  priority?: boolean;
  popHeart?: boolean;
  areaString: string;
}

function previewAreaLabel(area: string): string {
  const parts = area.split(' · ').map((part) => part.trim()).filter(Boolean);
  const city = parts[0] || '';
  const zone = parts.find((part) => /^منطقة\s/.test(part)) || '';
  const street = parts.find((part) => part !== city && part !== zone) || '';
  const shortStreet = street && street.length <= 28 && !/[،,]|محافظة|مصر/.test(street) ? street : '';
  return [city, shortStreet].filter(Boolean).join(' · ');
}

export const BusinessCardPhotoGallery: React.FC<BusinessCardPhotoGalleryProps> = ({
  business,
  isFavorite = false,
  onToggleFavorite,
  onOpenBusiness,
  onOpenVideoModal,
  priority = false,
  popHeart = false,
  areaString,
}) => {
  const railRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadedPhotos, setLoadedPhotos] = useState<Record<number, boolean>>({});
  const [fallbackLoaded, setFallbackLoaded] = useState(false);

  const rawPhotos = business.photos && business.photos.length > 0 ? business.photos : business.coverPhoto ? [business.coverPhoto] : [];
  const gallery = rawPhotos.slice(0, 4);
  const hasMultiple = gallery.length > 1;
  const isVerified = business.verificationStatus === 'verified' || business.packageId?.includes('verified');
  const hasVideo = Boolean(business.videoUrl || (business as unknown as { videos?: string[] }).videos?.length);
  const fallbackCover = getCategoryFallbackCover(business.category);
  const displayName = displayBusinessName(business.nameAr, business.nameEn) || business.nameAr;
  const withoutNotes = displayName.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const cardTitle =
    withoutNotes
      .split(/\s+\|\s+|\s+[–—-]\s+/)
      .map((part) => part.trim())
      .find((part) => /[\u0600-\u06FF]/.test(part)) || withoutNotes || displayName;
  const currentPhoto = gallery[currentSlide] || (gallery.length === 0 ? fallbackCover : '');
  const showIllustrative = Boolean(
    currentPhoto && (currentPhoto.includes('images.unsplash.com') || currentPhoto === fallbackCover)
  );

  const handleScroll = useCallback(() => {
    const rail = railRef.current;
    if (!rail || rail.clientWidth === 0) return;
    const scrollPos = Math.abs(rail.scrollLeft);
    const index = Math.round(scrollPos / rail.clientWidth);
    setCurrentSlide(Math.min(gallery.length - 1, Math.max(0, index)));
  }, [gallery.length]);

  const slideTo = (direction: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const rail = railRef.current;
    if (!rail) return;
    const targetIdx = Math.min(gallery.length - 1, Math.max(0, currentSlide + direction));
    rail.scrollTo({ left: -targetIdx * rail.clientWidth, behavior: 'smooth' });
    setCurrentSlide(targetIdx);
  };

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    rail.addEventListener('scroll', handleScroll, { passive: true });
    return () => rail.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="dl-photo">
      {/* 1. Photo Rail or Fallback */}
      {gallery.length > 0 ? (
        <div ref={railRef} className="dl-rail">
          {gallery.map((src, idx) => (
            <div key={idx} className={`dl-slide ${loadedPhotos[idx] ? '' : 'dl-sk'}`}>
              <img
                src={getOptimizedImageUrl(src, 480, 360)}
                alt=""
                width="480"
                height="360"
                loading={priority && idx === 0 ? 'eager' : 'lazy'}
                fetchPriority={priority && idx === 0 ? 'high' : 'auto'}
                decoding="async"
                className={loadedPhotos[idx] ? 'dl-in' : ''}
                onLoad={() => setLoadedPhotos((prev) => (prev[idx] ? prev : { ...prev, [idx]: true }))}
                onError={(event) => {
                  const img = event.currentTarget;
                  if (fallbackCover && img.dataset.fallback !== '1') {
                    img.dataset.fallback = '1';
                    img.src = fallbackCover;
                    return;
                  }
                  setLoadedPhotos((prev) => (prev[idx] ? prev : { ...prev, [idx]: true }));
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={`dl-slide ${fallbackCover && !fallbackLoaded ? 'dl-sk' : ''}`}>
          {fallbackCover ? (
            <img
              src={fallbackCover}
              alt=""
              width="480"
              height="360"
              loading="lazy"
              decoding="async"
              className={fallbackLoaded ? 'dl-in' : ''}
              onLoad={() => setFallbackLoaded(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-900">
              <Store className="w-12 h-12 stroke-[1.5] text-amber-400/80" aria-hidden="true" />
            </div>
          )}
        </div>
      )}

      {/* 2. Top and Bottom Gradient Overlays */}
      <div className="dl-ovt" aria-hidden="true" />
      <div className="dl-ovb" aria-hidden="true" />

      {/* 3. Top-Start Badges (Verified + Category) */}
      <div className="dl-tl">
        {isVerified && (
          <span className="dl-hv">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>موثق</span>
          </span>
        )}
        <span className="dl-hcat">{business.category}</span>
        {showIllustrative && <span className="dl-hcat">صورة توضيحية</span>}
      </div>

      {/* Dalilak Verified Stamp Badge on Photo */}
      {isVerified && (
        <span
          className={`dl-stamp ${hasMultiple ? 'dl-stamp-multi' : ''}`}
          aria-label="نشاط موثق لدى دليلك"
        >
          <span className="dl-stamp-row" dir="ltr">
            <span className="dl-ck" aria-hidden="true">✓</span>
            <span className="dl-dn">دليلك</span>
          </span>
        </span>
      )}

      {/* 4. Top-End Favorite Button */}
      {onToggleFavorite && (
        <div className="dl-hrt">
          <Pressable
            type="button"
            data-testid="favorite-button"
            aria-pressed={isFavorite}
            aria-label={isFavorite ? `إزالة ${business.nameAr} من المفضلة` : `إضافة ${business.nameAr} إلى المفضلة`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(business.id);
            }}
            className={isFavorite ? 'dl-on' : ''}
          >
            <span className={popHeart ? 'dl-pop' : ''}>
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} aria-hidden="true" />
            </span>
          </Pressable>
        </div>
      )}

      {/* 5. Center Video Play Button */}
      {hasVideo && (
        <div className="dl-vid">
          <Pressable
            type="button"
            aria-label={`تشغيل فيديو ${business.nameAr}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenVideoModal) {
                onOpenVideoModal(business);
              } else {
                onOpenBusiness(business);
              }
            }}
          >
            <Play className="w-5 h-5 fill-current ms-0.5" aria-hidden="true" />
          </Pressable>
        </div>
      )}

      {/* 6. Title and Location Block */}
      <div className={`dl-tt${isVerified || hasMultiple ? ' dl-tt-end' : ''}`}>
        <h3 className="dl-nm dl-ts">
          <Pressable
            type="button"
            data-testid="business-card-name"
            onClick={(e) => {
              e.stopPropagation();
              onOpenBusiness(business);
            }}
            aria-label={displayName}
          >
            <bdi dir="rtl">{cardTitle}</bdi>
          </Pressable>
        </h3>
        {previewAreaLabel(areaString) && (
          <p className="dl-loc dl-ts">
            <MapPin className="w-3.5 h-3.5 text-white shrink-0" aria-hidden="true" />
            <span dir="rtl">{previewAreaLabel(areaString)}</span>
          </p>
        )}
      </div>

      {hasMultiple && (
        <BusinessCardGalleryNav
          count={gallery.length}
          currentSlide={currentSlide}
          onSlide={slideTo}
        />
      )}
    </div>
  );
};
