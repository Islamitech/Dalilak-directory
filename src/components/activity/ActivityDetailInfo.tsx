import React from 'react';
import { Pressable } from '../../shared/ui';
import { Check, MapPin, Phone, Tag, UserPlus } from 'lucide-react';
import { Business } from '../../types';
import { formatCount, formatRating, formatWorkingHoursLabel, getWordRating } from '../../shared/lib/format';
import { formatDisplayPhone } from '../../shared/lib/phone';
import { getBusinessOpenStatus } from '../../utils/directoryEnhancements';

export interface ActivityDetailInfoProps {
  business: Business;
  effectiveUrl?: string | null;
  onShowOnMap?: (biz: Business) => void;
  onSaveContact?: () => void;
  vCardSaved?: boolean;
  gateLabel?: string | null;
  onEnterFromGate?: () => void;
}

export const ActivityDetailInfo: React.FC<ActivityDetailInfoProps> = ({
  business,
  onShowOnMap,
  onSaveContact,
  vCardSaved = false,
  gateLabel,
  onEnterFromGate,
}) => {
  const openStatus = getBusinessOpenStatus(business.workingHours);
  const hoursLabel = formatWorkingHoursLabel(business.workingHours);
  const offerText = business.offer || null;
  const phone = business.phone;
  const about = business.description || business.seoIntro;
  const ratingText =
    business.googleRatingEnabled !== false ? formatRating(business.googleRating) : null;
  const reviewCount =
    typeof business.googleReviewsCount === 'number' && business.googleReviewsCount > 0
      ? formatCount(business.googleReviewsCount)
      : null;
  const mapsUrl =
    business.googleMapsUrl && business.googleMapsUrl.startsWith('http') ? business.googleMapsUrl : null;
  const openMap = onEnterFromGate || (onShowOnMap ? () => onShowOnMap(business) : undefined);
  const mapLabel = onEnterFromGate && gateLabel ? `الدخول من ${gateLabel}` : 'اعرض على الخريطة';

  const ratingBlock = ratingText ? (
    <div className="dl-grev">
      <span className="dl-gmark" aria-hidden="true" />
      <div className="dl-grev-copy">
        <div className="dl-grev-score">
          <b dir="ltr">{ratingText}</b>
          <span
            className="dl-stars"
            style={{ '--p': `${Math.round((Number(ratingText) / 5) * 100)}%` } as React.CSSProperties}
            aria-hidden="true"
          >
            ★★★★★
          </span>
          <span className="dl-grev-word">{getWordRating(Number(ratingText))}</span>
        </div>
        <p>
          {reviewCount ? `${reviewCount} تقييم على Google` : 'تقييم من Google'}
        </p>
      </div>
    </div>
  ) : null;

  return (
    <div className="flex flex-col gap-2.5">
      {ratingBlock && mapsUrl ? (
        <a className="dl-grev-link" href={mapsUrl} target="_blank" rel="noopener noreferrer" aria-label={reviewCount ? `تقييم Google ${ratingText} من 5، ${reviewCount} تقييم` : `تقييم Google ${ratingText} من 5`}>
          {ratingBlock}
        </a>
      ) : ratingBlock}

      {hoursLabel && (
        <div className="dl-hrow">
          <span className={`dl-sp ${openStatus.isOpen ? 'dl-open' : 'dl-closed'}`}>
            <span className="dl-pd">
              {openStatus.isOpen && <b aria-hidden="true" />}
              <i aria-hidden="true" />
            </span>
            <span>{openStatus.badgeText}</span>
          </span>
          <span className="dl-hours">{hoursLabel}</span>
        </div>
      )}

      {openMap && (
        <Pressable type="button" className="dl-dline dl-dmap" onClick={openMap}>
          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{mapLabel}</span>
        </Pressable>
      )}

      {offerText && (
        <div className="dl-oc">
          <Tag className="w-4 h-4 shrink-0" />
          <span>{offerText}</span>
        </div>
      )}

      {about && <p className="dl-dabout">{about}</p>}

      {phone && (
        <div className="dl-dline">
          <Phone className="w-3.5 h-3.5" aria-hidden="true" />
          <a href={`tel:${phone}`} dir="ltr" className="tabular-nums hover:text-amber-700">
            {formatDisplayPhone(phone)}
          </a>
          {onSaveContact && (
            <Pressable
              type="button"
              onClick={onSaveContact}
              className={`dl-isv ms-auto ${vCardSaved ? 'dl-on' : ''}`}
              aria-label="حفظ جهة الاتصال"
              title="حفظ جهة الاتصال"
            >
              {vCardSaved ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>{vCardSaved ? 'تم الحفظ' : 'حفظ'}</span>
            </Pressable>
          )}
        </div>
      )}
    </div>
  );
};
