import React from 'react';
import { Pressable } from '../../shared/ui';
import { Check, Phone, Tag, UserPlus } from 'lucide-react';
import { Business } from '../../types';
import { formatWorkingHoursLabel } from '../../shared/lib/format';
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
  onSaveContact,
  vCardSaved = false,
}) => {
  const openStatus = getBusinessOpenStatus(business.workingHours);
  const hoursLabel = formatWorkingHoursLabel(business.workingHours);
  const offerText = business.offer || null;
  const phone = business.phone;
  const about = business.description || business.seoIntro;

  return (
    <div className="flex flex-col gap-2.5">
      {hoursLabel && (
        <div className="dl-hrow">
          <span className={`dl-sp ${openStatus.isOpen ? 'dl-open' : 'dl-closed'}`}>
            <span className="dl-pd">
              {openStatus.isOpen && <b aria-hidden="true" />}
              <i aria-hidden="true" />
            </span>
            <span>{openStatus.badgeText}</span>
            <small>· {hoursLabel}</small>
          </span>
        </div>
      )}

      {offerText && (
        <div className="dl-oc">
          <Tag className="w-4 h-4 shrink-0" />
          <span>{offerText}</span>
        </div>
      )}

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

      {about && (
        <p className="text-sm text-slate-700 leading-relaxed font-medium">{about}</p>
      )}
    </div>
  );
};
