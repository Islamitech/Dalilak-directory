import React from 'react';
import { Phone, MessageCircle, Navigation } from 'lucide-react';
import { Business } from '../../../types';
import { getWhatsAppUrl } from '../../../shared/lib/whatsapp';
import { getGoogleMapsDirectionsUrl } from '../../../shared/lib/directions';

export interface BusinessActionButtonsProps {
  business: Business;
  className?: string;
}

export const BusinessActionButtons: React.FC<BusinessActionButtonsProps> = ({
  business,
  className = 'grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80',
}) => {
  const cleanPhone = (business.phone || '').replace(/[^\d+]/g, '');

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

  return (
    <div className={className}>
      {/* Action 1: Call */}
      {cleanPhone ? (
        <a
          href={`tel:${cleanPhone}`}
          onClick={(e) => e.stopPropagation()}
          className="min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-xs"
          title="اتصال هاتفي فوري"
        >
          <Phone className="w-3.5 h-3.5 shrink-0" />
          <span>اتصال</span>
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="min-h-[44px] py-2 px-2 rounded-xl text-xs bg-slate-50 text-slate-400 border border-slate-200 font-bold flex items-center justify-center gap-1 opacity-50 cursor-not-allowed"
        >
          <Phone className="w-3.5 h-3.5 shrink-0" />
          <span>اتصال</span>
        </button>
      )}

      {/* Action 2: WhatsApp */}
      {whatsAppUrl ? (
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
          title="محادثة واتساب مباشرة"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>واتساب</span>
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="min-h-[44px] py-2 px-2 rounded-xl text-xs bg-slate-50 text-slate-400 border border-slate-200 font-bold flex items-center justify-center gap-1 opacity-50 cursor-not-allowed"
        >
          <MessageCircle className="w-3.5 h-3.5 shrink-0" />
          <span>واتساب</span>
        </button>
      )}

      {/* Action 3: Directions */}
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
        title="الاتجاهات على خرائط Google"
        aria-label="الاتجاهات"
      >
        <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span>الاتجاهات</span>
      </a>
    </div>
  );
};
