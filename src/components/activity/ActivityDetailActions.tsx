import React from 'react';
import { Phone, MessageCircle, Navigation } from 'lucide-react';
import { Business } from '../../types';
import { requestBusinessNavigation } from '../../shared/lib/pendingNavigation';
import { Button, ButtonLink } from '../../shared/ui';

export interface ActivityDetailQuickActionsProps {
  business: Business;
  effectiveUrl: string | null;
  smartWhatsAppUrl: string;
  onShowOnMap?: (biz: Business) => void;
}

/**
 * Quick actions of the detail modal. Same variants as the list card buttons;
 * unavailable actions are omitted rather than rendered disabled.
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
    <div className="grid grid-flow-col auto-cols-fr gap-2">
      {hasPhone && (
        <ButtonLink
          href={`tel:${rawPhone.replace(/[^\d+]/g, '')}`}
          variant="primary"
          size="md"
          leadingIcon={<Phone />}
          className="px-2.5! gap-1!"
          title="اتصال هاتفي مباشر"
        >
          اتصال
        </ButtonLink>
      )}

      {hasWhatsApp && (
        <ButtonLink
          href={smartWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
          size="md"
          leadingIcon={<MessageCircle className="text-green-600" />}
          className="px-2.5! gap-1!"
          title="مراسلة واتساب"
        >
          واتساب
        </ButtonLink>
      )}

      <Button
        variant="secondary"
        size="md"
        onClick={handleDirections}
        leadingIcon={<Navigation className="text-blue-600" />}
        className="px-2.5! gap-1!"
        title="الاتجاهات على الخريطة"
        aria-label="الاتجاهات على الخريطة"
      >
        الاتجاهات
      </Button>
    </div>
  );
};
