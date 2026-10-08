import React, { useState } from 'react';
import { Check, Clock, MapPin, Phone, Tag, UserPlus } from 'lucide-react';
import { Business } from '../../types';
import { getBusinessOpenStatus } from '../../utils/directoryEnhancements';
import { formatCount, formatRating, formatWorkingHoursLabel } from '../../shared/lib/format';
import { formatDisplayPhone } from '../../shared/lib/phone';
import { formatBusinessAreaLabel, getBusinessHadayekZoneLetter } from '../../utils/hadayekZoneHelper';

export interface ActivityDetailInfoProps {
  business: Business;
  effectiveUrl?: string | null;
  onShowOnMap?: (biz: Business) => void;
  onSaveContact?: () => void;
  vCardSaved?: boolean;
}

export const ActivityDetailInfo: React.FC<ActivityDetailInfoProps> = ({
  business,
  onSaveContact,
  vCardSaved = false,
}) => {
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const openStatus = getBusinessOpenStatus(business.workingHours);
  const hoursLabel = formatWorkingHoursLabel(business.workingHours);
  const hasRating = Boolean(business.googleRatingEnabled && business.googleRating && business.googleRating > 0);
  const ratingPercent = hasRating ? Math.min(100, Math.max(0, (business.googleRating! / 5) * 100)).toFixed(0) : 0;

  const offerText = business.offer || null;

  const phone = business.phone;
  const zone = getBusinessHadayekZoneLetter(business);
  const landmark = zone
    ? (business.landmark || '').replace(/المنطقة\s*[\u0621-\u064A]/g, `منطقة ${zone}`)
    : business.landmark;
  const addressParts = [
    formatBusinessAreaLabel(business),
    landmark ? `(بجوار ${landmark})` : '',
    business.governorate,
  ].filter(Boolean);

  const addressText = addressParts.join('، ');

  return (
    <div className="space-y-2.5">
      {/* 1. Rating Box */}
      {hasRating && (
        <div className="dl-rb">
          <div className="dl-s">{formatRating(business.googleRating)}</div>
          <div>
            <span
              className="dl-stars"
              style={{ '--p': `${ratingPercent}%`, fontSize: '14px' } as React.CSSProperties}
              aria-hidden="true"
            >
              ★★★★★
            </span>
            <div className="dl-k">
              {business.googleReviewsCount && business.googleReviewsCount > 0
                ? `${formatCount(business.googleReviewsCount)} تقييم موثق`
                : 'تقييم Google'}
            </div>
          </div>
        </div>
      )}

      {/* 2. Offer Card */}
      {offerText && (
        <div className="dl-oc">
          <Tag className="w-4 h-4 shrink-0" />
          <span>{offerText}</span>
        </div>
      )}

      {/* 3. Info Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Hours / Status Row */}
        <div className="dl-ir">
          <span className="dl-ico">
            <Clock className="w-4 h-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="dl-il">الحالة الآن</div>
            <div className="dl-iv">
              <span className={`dl-stb ${openStatus.isOpen ? 'dl-o' : 'dl-c'}`}>
                <i />
                {openStatus.badgeText}
              </span>
              {hoursLabel && (
                <span className="dl-sh">{hoursLabel}</span>
              )}
            </div>
          </div>
        </div>

        {/* Address Row */}
        <div className="dl-ir">
          <span className="dl-ico">
            <MapPin className="w-4 h-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="dl-il">العنوان</div>
            <div className="dl-iv" dir="auto">
              <span className="min-w-0 break-words leading-relaxed">{addressText}</span>
            </div>
          </div>
        </div>

        {/* Phone Row */}
        {phone && (
          <div className="dl-ir">
            <span className="dl-ico">
              <Phone className="w-4 h-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="dl-il">الهاتف</div>
              <div className="dl-iv">
                <a
                  href={`tel:${phone}`}
                  dir="ltr"
                  className="tabular-nums hover:text-amber-600 transition-colors"
                >
                  {formatDisplayPhone(phone)}
                </a>
              </div>
            </div>
            {onSaveContact && (
              <button
                type="button"
                onClick={onSaveContact}
                className={`dl-isv ${vCardSaved ? 'dl-on' : ''}`}
                aria-label="حفظ جهة الاتصال"
                title="حفظ جهة الاتصال"
              >
                {vCardSaved ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>{vCardSaved ? 'تم الحفظ' : 'حفظ'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Description / About (if present) */}
      {(business.seoIntro || business.description) && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium space-y-1">
          <span className="text-caption text-amber-700 font-extrabold block">نبذة ومعلومات:</span>
          <p className={!isDescExpanded && (business.seoIntro || business.description)!.length > 180 ? 'line-clamp-2' : ''}>
            {business.seoIntro || business.description}
          </p>
          {(business.seoIntro || business.description)!.length > 180 && (
            <button
              type="button"
              onClick={() => setIsDescExpanded(!isDescExpanded)}
              className="text-amber-700 hover:underline font-bold text-xs pt-0.5 cursor-pointer block"
            >
              {isDescExpanded ? 'عرض أقل ▴' : 'عرض المزيد ▾'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
