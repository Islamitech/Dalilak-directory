import React, { useState } from 'react';
import { Pressable } from '../../shared/ui';
import {
  Check,
  ChevronDown,
  Clock,
  Compass,
  MapPin,
  Phone,
  Sparkles,
  Tag,
  UserPlus,
} from 'lucide-react';
import { Business } from '../../types';
import { formatCount, formatRating, formatWorkingHoursLabel, getWordRating } from '../../shared/lib/format';
import { formatDisplayPhone } from '../../shared/lib/phone';
import { getBusinessOpenStatus } from '../../utils/directoryEnhancements';
import { ActivityDetailRatingCard } from './ActivityDetailRatingCard';

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
  const [showFullAbout, setShowFullAbout] = useState(false);
  const openStatus = getBusinessOpenStatus(business.workingHours);
  const hoursLabel = formatWorkingHoursLabel(business.workingHours);
  const offerText = business.offer || null;
  const phone = business.phone;
  const secondaryPhone = business.secondaryPhone;
  const about = business.description || business.seoIntro;
  const ratingText = business.googleRatingEnabled !== false ? formatRating(business.googleRating) : null;
  const reviewCount =
    typeof business.googleReviewsCount === 'number' && business.googleReviewsCount > 0
      ? formatCount(business.googleReviewsCount)
      : null;
  const mapsUrl = business.googleMapsUrl && business.googleMapsUrl.startsWith('http') ? business.googleMapsUrl : null;
  const openMap = onEnterFromGate || (onShowOnMap ? () => onShowOnMap(business) : undefined);
  const mapLabel = onEnterFromGate && gateLabel ? `الدخول الأسرع من ${gateLabel}` : 'اعرض الموقع على الخريطة التفاعلية';
  const services = Array.isArray(business.services) ? business.services.filter(Boolean) : [];

  return (
    <div className="flex flex-col gap-3">
      {/* 1. Google Rating Card */}
      {ratingText && (
        <ActivityDetailRatingCard
          ratingText={ratingText}
          reviewCount={reviewCount}
          mapsUrl={mapsUrl}
          wordRating={getWordRating(Number(ratingText))}
        />
      )}

      {/* 2. Location & Gate Card */}
      <div className="dl-detail-card">
        <div className="dl-detail-card-header">
          <span className="dl-detail-card-title">
            <MapPin className="w-4 h-4 text-amber-600" />
            <span>الموقع والعنوان</span>
          </span>
          {gateLabel && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-caption font-bold bg-slate-100 text-slate-700 border border-slate-200">
              <Compass className="w-3 h-3 text-amber-600" />
              <span>{gateLabel}</span>
            </span>
          )}
        </div>

        <div className="space-y-1.5 text-start">
          <p className="text-sm font-bold text-slate-800 leading-snug">
            {[business.street, business.city || 'حدائق الأهرام', business.governorate].filter(Boolean).join('، ')}
          </p>
          {business.landmark && (
            <p className="text-caption font-medium text-slate-500 flex items-center gap-1">
              <span className="font-bold text-slate-600">علامة مميزة:</span>
              <span>{business.landmark}</span>
            </p>
          )}
        </div>

        {openMap && (
          <Pressable
            type="button"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200/80 hover:border-amber-300 text-slate-700 hover:text-amber-900 text-caption font-bold transition-all cursor-pointer mt-1"
            onClick={openMap}
          >
            <Compass className="w-4 h-4 text-amber-600" />
            <span>{mapLabel}</span>
          </Pressable>
        )}
      </div>

      {/* 3. Working Hours Card */}
      {hoursLabel && (
        <div className="dl-detail-card">
          <div className="dl-detail-card-header">
            <span className="dl-detail-card-title">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>أوقات ومواعيد العمل</span>
            </span>
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
          </div>

          <p className="text-sm font-bold text-slate-800" dir="auto">
            {hoursLabel}
          </p>
        </div>
      )}

      {/* 4. Services & Features Chips */}
      {services.length > 0 && (
        <div className="dl-detail-card">
          <div className="dl-detail-card-header">
            <span className="dl-detail-card-title">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>الخدمات والمميزات المعتمدة</span>
            </span>
          </div>
          <div className="dl-service-chips">
            {services.map((srv, idx) => (
              <span key={idx} className="dl-service-chip">
                <span>{srv}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 5. Promotional Offer Banner */}
      {offerText && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300/80 flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
            <Tag className="w-4 h-4" />
          </div>
          <div className="min-w-0 text-start">
            <span className="inline-block text-caption font-extrabold text-amber-800 uppercase tracking-wider mb-0.5">عرض خاص</span>
            <p className="text-sm font-bold text-slate-800 leading-snug" dir="auto">{offerText}</p>
          </div>
        </div>
      )}

      {/* 6. Direct Contact Card */}
      {phone && (
        <div className="dl-detail-card">
          <div className="dl-detail-card-header">
            <span className="dl-detail-card-title">
              <Phone className="w-4 h-4 text-amber-600" />
              <span>أرقام التواصل المباشر</span>
            </span>
            {onSaveContact && (
              <Pressable
                type="button"
                onClick={onSaveContact}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-caption font-bold border transition-all cursor-pointer ${
                  vCardSaved
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                }`}
                aria-label="حفظ جهة الاتصال على هاتفك"
                title="حفظ جهة الاتصال على هاتفك"
              >
                {vCardSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <UserPlus className="w-3.5 h-3.5 text-amber-700" />}
                <span>{vCardSaved ? 'تم الحفظ' : 'حفظ الرقم'}</span>
              </Pressable>
            )}
          </div>

          <div className="flex flex-col gap-2 text-start">
            <div className="flex items-center justify-between py-1">
              <span className="text-caption font-bold text-slate-500">الهاتف الأساسي</span>
              <a href={`tel:${phone}`} dir="ltr" className="text-sm font-extrabold text-slate-900 hover:text-amber-700 tabular-nums">
                {formatDisplayPhone(phone)}
              </a>
            </div>

            {secondaryPhone && (
              <div className="flex items-center justify-between py-1 border-t border-slate-100">
                <span className="text-caption font-bold text-slate-500">هاتف بديل</span>
                <a href={`tel:${secondaryPhone}`} dir="ltr" className="text-sm font-extrabold text-slate-900 hover:text-amber-700 tabular-nums">
                  {formatDisplayPhone(secondaryPhone)}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. About & Description Card */}
      {about && (
        <div className="dl-detail-card text-start">
          <div className="dl-detail-card-header">
            <span className="dl-detail-card-title">
              <span>نبذة عن النشاط</span>
            </span>
          </div>
          <p className={`text-sm text-slate-700 leading-relaxed font-medium ${!showFullAbout && about.length > 180 ? 'line-clamp-3' : ''}`}>
            {about}
          </p>
          {about.length > 180 && (
            <button
              type="button"
              onClick={() => setShowFullAbout((prev) => !prev)}
              className="inline-flex items-center gap-1 text-caption font-extrabold text-amber-800 hover:text-amber-900 self-start cursor-pointer mt-0.5"
            >
              <span>{showFullAbout ? 'عرض أقل' : 'قراءة المزيد'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFullAbout ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
