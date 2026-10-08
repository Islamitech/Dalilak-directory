import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Business } from '../../../../types';
import { getOptimizedImageUrl } from '../../../../utils/imageOptimizer';
import { getCategoryFallbackCover } from '../../../../utils/categoryPhotos';
import { displayBusinessName } from '../../../../shared/lib/format';
import { ShieldCheck, Heart, Play, ChevronLeft, ChevronRight, MapPin, Store } from 'lucide-react';

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

  const rawPhotos = business.photos && business.photos.length > 0 ? business.photos : business.coverPhoto ? [business.coverPhoto] : [];
  const gallery = rawPhotos.slice(0, 4);
  const hasMultiple = gallery.length > 1;

  const isVerified = business.verificationStatus === 'verified' || business.packageId?.includes('verified');
  const hasVideo = Boolean(business.videoUrl || (business as unknown as { videos?: string[] }).videos?.length);

  const fallbackCover = getCategoryFallbackCover(business.category);
  const displayName = displayBusinessName(business.nameAr, business.nameEn) || business.nameAr;
  // Card shows the Arabic name only; the bilingual form lives in the detail view.
  const cardTitle =
    displayName
      .split(/\s*\|\s*/)
      .map((part) => part.trim())
      .find((part) => /[\u0600-\u06FF]/.test(part)) || displayName;
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
    // In RTL, scrollLeft is negative or indexed
    rail.scrollTo({
      left: -targetIdx * rail.clientWidth,
      behavior: 'smooth',
    });
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
            <div key={idx} className="dl-slide">
              <img
                src={getOptimizedImageUrl(src, 480, 360)}
                alt=""
                width="480"
                height="360"
                loading={priority && idx === 0 ? 'eager' : 'lazy'}
                fetchPriority={priority && idx === 0 ? 'high' : 'auto'}
                decoding="async"
                className="dl-in"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="dl-slide">
          {fallbackCover ? (
            <img
              src={fallbackCover}
              alt=""
              width="480"
              height="360"
              loading="lazy"
              decoding="async"
              className="dl-in"
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

      {/* 4. Top-End Favorite Button */}
      {onToggleFavorite && (
        <div className="dl-hrt">
          <button
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
          </button>
        </div>
      )}

      {/* 5. Center Video Play Button */}
      {hasVideo && (
        <div className="dl-vid">
          <button
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
          </button>
        </div>
      )}

      {/* 6. Title and Location Block */}
      <div className="dl-tt">
        <h3 className="dl-nm dl-ts">
          <button
            type="button"
            data-testid="business-card-name"
            onClick={(e) => {
              e.stopPropagation();
              onOpenBusiness(business);
            }}
            aria-label={displayName}
          >
            <bdi dir="rtl">{cardTitle}</bdi>
          </button>
        </h3>
        {areaString && (
          <p className="dl-loc dl-ts">
            <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
            <span dir="auto">{areaString}</span>
          </p>
        )}
      </div>

      {/* 7. Slide counter, nav chevrons and segment indicators */}
      {hasMultiple && (
        <>
          <span className="dl-cnt" dir="ltr" aria-hidden="true">
            {currentSlide + 1}/{gallery.length}
          </span>
          <button
            type="button"
            className="dl-nav-btn dl-nx"
            onClick={(e) => slideTo(1, e)}
            aria-label="الصورة التالية"
            style={{ display: currentSlide >= gallery.length - 1 ? 'none' : 'flex' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="dl-nav-btn dl-pv"
            onClick={(e) => slideTo(-1, e)}
            aria-label="الصورة السابقة"
            style={{ display: currentSlide <= 0 ? 'none' : 'flex' }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="dl-segs" aria-hidden="true">
            {gallery.map((_, k) => (
              <i key={k} className={`dl-seg ${k === currentSlide ? 'dl-on' : ''}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
