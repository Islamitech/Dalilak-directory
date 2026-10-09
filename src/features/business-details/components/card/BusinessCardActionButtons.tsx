import React, { useState } from 'react';
import { Phone, MessageCircle, Navigation, Share2, Check } from 'lucide-react';
import { Business } from '../../../../types';
import { getWhatsAppUrl } from '../../../../shared/lib/whatsapp';
import { getGoogleMapsDirectionsUrl } from '../../../../shared/lib/directions';
import { formatDistanceString } from '../../../../utils/directoryEnhancements';
import { getPublicDirectoryUrl } from '../../../../utils/directoryUrl';
import { ButtonLink } from '../../../../shared/ui/Button';
import { IconButton } from '../../../../shared/ui/IconButton';

const DENSE = 'min-h-11! px-2! gap-1!';

export interface BusinessCardActionButtonsProps {
  business: Business;
  distanceKm?: number | null;
}

/**
 * Card footer: primary call + prominent WhatsApp + neutral directions + quick share.
 * Unavailable actions are omitted instead of rendered disabled so the
 * remaining buttons stretch to fill the row.
 */
export const BusinessCardActionButtons: React.FC<BusinessCardActionButtonsProps> = ({
  business,
  distanceKm,
}) => {
  const [copied, setCopied] = useState(false);
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

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const shareUrl = getPublicDirectoryUrl(business);
    const shareData = {
      title: business.nameAr,
      text: `تعرف على «${business.nameAr}» عبر منصة دليلك:\n`,
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch {
        // Fallback silently if clipboard is unavailable
      }
    }
  };

  return (
    <div className="dl-hca" onClick={(e) => e.stopPropagation()}>
      <div className="dl-hag">
        <div className="dl-hag-main">
          {hasPhone && (
            <ButtonLink
              href={`tel:${rawPhone.replace(/[^\d+]/g, '')}`}
              variant="primary"
              size="md"
              leadingIcon={<Phone />}
              className={DENSE}
              truncateLabel={false}
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
              leadingIcon={<MessageCircle />}
              className={`${DENSE} dl-btn-whatsapp`}
              truncateLabel={false}
              title="مراسلة واتساب فورية"
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
            leadingIcon={<Navigation />}
            trailing={distanceLabel}
            className={`${DENSE} dl-btn-ink`}
            truncateLabel={false}
            title="الاتجاهات على خرائط Google"
            aria-label={distanceLabel ? `الاتجاهات، على بعد ${distanceLabel}` : 'الاتجاهات'}
          >
            الاتجاهات
          </ButtonLink>
        </div>

        <IconButton
          aria-label={copied ? 'تم نسخ رابط النشاط' : `مشاركة رابط ${business.nameAr}`}
          title={copied ? 'تم نسخ الرابط!' : 'مشاركة النشاط'}
          variant={copied ? 'primary' : 'secondary'}
          size="md"
          className={`shrink-0 w-11 min-w-11 h-11 min-h-11 transition-all ${
            copied
              ? 'text-emerald-700! bg-emerald-50! border-emerald-300!'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300'
          }`}
          icon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
          onClick={handleShare}
        />
      </div>
    </div>
  );
};
