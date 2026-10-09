import React from 'react';
import { Phone, MessageCircle, Navigation } from 'lucide-react';
import { Business } from '../../../../types';
import { getWhatsAppUrl } from '../../../../shared/lib/whatsapp';
import { getGoogleMapsDirectionsUrl } from '../../../../shared/lib/directions';
import { formatDistanceString } from '../../../../utils/directoryEnhancements';
import { ButtonLink } from '../../../../shared/ui/Button';

const DENSE = 'px-2! gap-1!';

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
        {hasPhone && (
          <ButtonLink
            href={`tel:${rawPhone.replace(/[^\d+]/g, '')}`}
            variant="primary"
            size="md"
            leadingIcon={<Phone />}
            className={DENSE}
            title="اتصال هاتفي مباشر"
          >
            اتصال
          </ButtonLink>
        )}

        {whatsAppUrl && (
          <ButtonLink
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
            size="md"
            leadingIcon={<MessageCircle className="text-green-600" />}
            className={DENSE}
            title="مراسلة واتساب"
          >
            واتساب
          </ButtonLink>
        )}

        <ButtonLink
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
          size="md"
          leadingIcon={<Navigation className="text-blue-600" />}
          trailing={distanceLabel}
          className={DENSE}
          title="الاتجاهات على خرائط Google"
          aria-label={distanceLabel ? `الاتجاهات، على بعد ${distanceLabel}` : 'الاتجاهات'}
        >
          الاتجاهات
        </ButtonLink>
      </div>
    </div>
  );
};
