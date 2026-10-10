import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Pressable } from '../../../../shared/ui';
import { Business } from '../../../../types';
import { getOptimizedImageUrl } from '../../../../utils/imageOptimizer';
import { collectDisplayPhotos } from '../../../../utils/categoryPhotos';
import { getCategoryVisual } from '../../../../utils/categoryVisuals';
import { displayBusinessName } from '../../../../shared/lib/format';
import { ShieldCheck, Heart, Play, MapPin } from 'lucide-react';
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
  const parts = area.split(' · ').map((p) => p.trim()).filter(Boolean);
  const city = parts[0] || '', zone = parts.find((p) => /^منطقة\s/.test(p)) || '';
  const street = parts.find((p) => p !== city && p !== zone) || '';
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
  const [failedPhotos, setFailedPhotos] = useState<Record<number, boolean>>({});

  const visual = getCategoryVisual(business.category, 'light');
  const gallery = collectDisplayPhotos(business.photos, business.coverPhoto)
    .filter((src) => !src.includes('images.unsplash.com'))
    .slice(0, 4);
  const hasMultiple = gallery.length > 1;
  const isVerified = business.verificationStatus === 'verified' || business.packageId?.includes('verified');
  const hasVideo = Boolean(business.videoUrl || (business as unknown as { videos?: string[] }).videos?.length);
  const displayName = displayBusinessName(business.nameAr, business.nameEn) || business.nameAr;
  const withoutNotes = displayName.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const cardTitle = withoutNotes.split(/\s+\|\s+|\s+[–—-]\s+/).map((p) => p.trim()).find((p) => /[\u0600-\u06FF]/.test(p)) || withoutNotes || displayName;
  const categoryMark = (
    <div className="dl-icon-cover">
      {visual.icon}
    </div>
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
            <div key={idx} className={`dl-slide ${loadedPhotos[idx] || failedPhotos[idx] ? '' : 'dl-sk'}`}>
              {failedPhotos[idx] ? categoryMark : (
                <img
                  src={getOptimizedImageUrl(src, 640, 480)}
                  srcSet={`${getOptimizedImageUrl(src, 480, 360)} 480w, ${getOptimizedImageUrl(src, 640, 480)} 640w`}
                  sizes="(max-width: 640px) 100vw, 480px"
                  alt=""
                  width="480"
                  height="360"
                  loading={priority && idx === 0 ? 'eager' : 'lazy'}
                  fetchPriority={priority && idx === 0 ? 'high' : 'auto'}
                  decoding="async"
                  className={[priority && idx === 0 ? 'dl-lcp' : '', loadedPhotos[idx] ? 'dl-in' : ''].filter(Boolean).join(' ')}
                  onLoad={() => setLoadedPhotos((prev) => (prev[idx] ? prev : { ...prev, [idx]: true }))}
                  onError={() => setFailedPhotos((prev) => (prev[idx] ? prev : { ...prev, [idx]: true }))}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="dl-slide">{categoryMark}</div>
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
      </div>

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
      <div className={`dl-tt${hasMultiple ? ' dl-tt-end' : ''}`}>
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
