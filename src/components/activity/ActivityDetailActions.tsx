import React from 'react';
import { Phone, MessageCircle, Navigation } from 'lucide-react';
import { Business } from '../../types';
import { requestBusinessNavigation } from '../../shared/lib/pendingNavigation';

export interface ActivityDetailQuickActionsProps {
  business: Business;
  effectiveUrl: string | null;
  smartWhatsAppUrl: string;
  onShowOnMap?: (biz: Business) => void;
}

/**
 * Quick actions of the detail modal. Uses the exact same markup and classes
 * (dl-act / dl-btnp / dl-bw / dl-bn) as the list card buttons so both previews look identical.
 */
export const ActivityDetailQuickActions: React.FC<ActivityDetailQuickActionsProps> = ({
  business,
  effectiveUrl,
  smartWhatsAppUrl,
  onShowOnMap,
}) => {
  const rawPhone = (business.phone || '').trim();
  const hasPhone = Boolean(rawPhone && rawPhone.length > 3);
  const hasWhatsApp = Boolean(smartWhatsAppUrl);

  const handleDirections = () => {
    if (onShowOnMap) {
      // Open the map on this activity and start in-app navigation right away.
      requestBusinessNavigation(business.id);
      onShowOnMap(business);
    } else if (effectiveUrl) {
      window.open(effectiveUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="dl-dag">
      {/* 1. Call */}
      {hasPhone ? (
        <a
          href={`tel:${rawPhone.replace(/[^\d+]/g, '')}`}
          className="dl-act dl-btnp"
          title="اتصال هاتفي مباشر"
        >
          <span className="dl-t">
            <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>اتصال</span>
          </span>
          <span className="dl-s">مكالمة</span>
        </a>
      ) : (
        <button type="button" disabled className="dl-act dl-off" aria-label="لا يوجد هاتف">
          <span className="dl-t">
            <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>اتصال</span>
          </span>
          <span className="dl-s">غير متوفر</span>
        </button>
      )}

      {/* 2. WhatsApp */}
      {hasWhatsApp ? (
        <a
          href={smartWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="dl-act dl-bw"
          title="مراسلة واتساب"
        >
          <span className="dl-t">
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>واتساب</span>
          </span>
          <span className="dl-s">مراسلة</span>
        </a>
      ) : (
        <button type="button" disabled className="dl-act dl-off" aria-label="واتساب غير متوفر">
          <span className="dl-t">
            <MessageCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>واتساب</span>
          </span>
          <span className="dl-s">غير متوفر</span>
        </button>
      )}

      {/* 3. Directions */}
      <button
        type="button"
        onClick={handleDirections}
        className="dl-act dl-bn"
        title="الاتجاهات على الخريطة"
        aria-label="الاتجاهات على الخريطة"
      >
        <span className="dl-t">
          <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
          <span>الاتجاهات</span>
        </span>
        <span className="dl-s">خريطة</span>
      </button>
    </div>
  );
};
