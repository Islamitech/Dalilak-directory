import React from 'react';
import { Phone, MessageCircle, Navigation } from 'lucide-react';
import { Business } from '../../../../types';
import { getWhatsAppUrl } from '../../../../shared/lib/whatsapp';
import { getGoogleMapsDirectionsUrl } from '../../../../shared/lib/directions';
import { formatDistanceString } from '../../../../utils/directoryEnhancements';

export interface BusinessCardActionButtonsProps {
  business: Business;
  distanceKm?: number | null;
}

/**
 * Card footer: one primary action (call) + neutral secondary actions.
 * Unavailable actions are omitted instead of rendered disabled so the
 * remaining buttons stretch to fill the row.
 */
export const BusinessCardActionButtons: React.FC<BusinessCardActionButtonsProps> = ({
  business,
  distanceKm,
}) => {
  const rawPhone = (business.phone || '').trim();
  const hasPhone = Boolean(rawPhone && rawPhone.length > 3);

  const whatsAppUrl = getWhatsAppUrl(
    business.whatsapp || business.phone,
    `مرحباً ${business.nameAr}، وجدتك عبر منصة دليلك وأود الاستفسار عن خدماتكم.`
  );

  const directionsUrl = getGoogleMapsDirectionsUrl({
    lat: business.lat,
    lng: business.lng,
    destinationAddress: `${business.city || ''} ${business.street || ''}`,
    query: business.nameAr,
  });

  const distanceLabel =
    distanceKm !== null && distanceKm !== undefined ? formatDistanceString(distanceKm) : null;

  return (
    <div className="dl-hca" onClick={(e) => e.stopPropagation()}>
      <div className="dl-hag">
        {/* 1. Call (primary) */}
        {hasPhone && (
          <a
            href={`tel:${rawPhone.replace(/[^\d+]/g, '')}`}
            className="dl-act dl-btnp"
            title="اتصال هاتفي مباشر"
          >
            <span className="dl-t">
              <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>اتصال</span>
            </span>
          </a>
        )}

        {/* 2. WhatsApp (secondary) */}
        {whatsAppUrl && (
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="dl-act dl-bw"
            title="مراسلة واتساب"
          >
            <span className="dl-t">
              <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>واتساب</span>
            </span>
          </a>
        )}

        {/* 3. Directions (secondary, carries the distance) */}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="dl-act dl-bn"
          title="الاتجاهات على خرائط Google"
          aria-label={distanceLabel ? `الاتجاهات، على بعد ${distanceLabel}` : 'الاتجاهات'}
        >
          <span className="dl-t">
            <Navigation className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>الاتجاهات</span>
          </span>
          {distanceLabel && <span className="dl-s">{distanceLabel}</span>}
        </a>
      </div>
    </div>
  );
};
