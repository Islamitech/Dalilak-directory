import React, { useState, useEffect } from 'react';
import { Business } from '../../../types';
import { calculateDistanceKm, getBusinessOpenStatus } from '../../../utils/directoryEnhancements';
import { formatWorkingHoursLabel } from '../../../shared/lib/format';
import { formatBusinessAreaLabel, getBusinessEntryGate } from '../../../utils/hadayekZoneHelper';
import { Tag } from 'lucide-react';
import { BusinessCardPhotoGallery } from './card/BusinessCardPhotoGallery';
import { BusinessCardRatingRow } from './card/BusinessCardRatingRow';
import { BusinessCardActionButtons } from './card/BusinessCardActionButtons';

const seenBusinessIds = new Set<string>();

export interface BusinessCardVariantProps {
  business: Business;
  onOpenBusiness: (biz: Business) => void;
  onToggleFavorite?: (id: string) => void;
  isFavorite?: boolean;
  userCoords?: { lat: number; lng: number } | null;
  onOpenVideoModal?: (biz: Business) => void;
  onStartNavigation?: (biz: Business) => void;
  onShowOnMap?: (biz: Business) => void;
  onClose?: () => void;
  photos?: string[];
  onPreviewPhoto?: (index: number) => void;
  priority?: boolean;
}

export const BusinessCardGridVariant: React.FC<BusinessCardVariantProps> = ({
  business,
  onOpenBusiness,
  onToggleFavorite,
  isFavorite = false,
  userCoords = null,
  onOpenVideoModal,
  priority = false,
}) => {
  const [isFresh, setIsFresh] = useState(false);
  const [popHeart, setPopHeart] = useState(false);

  useEffect(() => {
    if (!seenBusinessIds.has(business.id)) {
      seenBusinessIds.add(business.id);
      setIsFresh(true);
    }
  }, [business.id]);

  const handleToggleFavoriteWithPop = (id: string) => {
    setPopHeart(true);
    setTimeout(() => setPopHeart(false), 450);
    if (onToggleFavorite) onToggleFavorite(id);
  };

  const openStatus = getBusinessOpenStatus(business.workingHours);
  const hoursLabel = formatWorkingHoursLabel(business.workingHours);
  const hasRawHours = Boolean(business.workingHours && business.workingHours.trim().length > 0);
  const hasHours = Boolean(hoursLabel);

  const distanceKm =
    userCoords && business.lat && business.lng
      ? calculateDistanceKm(userCoords.lat, userCoords.lng, business.lat, business.lng)
      : null;

  const areaString = formatBusinessAreaLabel(business);
  const entryGate = getBusinessEntryGate(business);

  const offerText = business.offer || null;

  return (
    <article
      data-biz-id={business.id}
      onClick={() => onOpenBusiness(business)}
      className={`dl-card ${isFresh ? 'dl-fresh' : ''}`}
    >
      {/* 1. Photo Gallery Header with overlays & badges */}
      <BusinessCardPhotoGallery
        business={business}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite ? handleToggleFavoriteWithPop : undefined}
        onOpenBusiness={onOpenBusiness}
        onOpenVideoModal={onOpenVideoModal}
        priority={priority}
        popHeart={popHeart}
        areaString={areaString}
      />

      {/* 2. Body: Working Hours, Distance, Ratings, Offer */}
      <div className="dl-hbd">
        <div className="dl-hrow">
          {hasHours ? (
            <span className={`dl-sp ${openStatus.isOpen ? 'dl-open' : 'dl-closed'}`}>
              <span className="dl-pd">
                {openStatus.isOpen && <b aria-hidden="true" />}
                <i aria-hidden="true" />
              </span>
              <span>{openStatus.badgeText}</span>
              <small>· {hoursLabel}</small>
            </span>
          ) : (
            <span className="dl-nh">{hasRawHours ? 'ساعات العمل غير واضحة' : 'ساعات العمل غير مسجّلة'}</span>
          )}
        </div>

        {entryGate && <p className="text-caption font-bold text-slate-500 truncate">{entryGate.line}</p>}

        {/* Google rating summary (single line) */}
        <BusinessCardRatingRow
          rating={business.googleRating}
          reviewsCount={business.googleReviewsCount}
        />

        {/* Promotional Offer */}
        {offerText && (
          <p className="dl-hoff">
            <b>
              <Tag className="w-3 h-3" aria-hidden="true" />
              <span>عرض</span>
            </b>
            <span dir="auto">{offerText}</span>
          </p>
        )}
      </div>

      {/* 3. Action Buttons Footer */}
      <BusinessCardActionButtons
        business={business}
        distanceKm={distanceKm}
      />
    </article>
  );
};
