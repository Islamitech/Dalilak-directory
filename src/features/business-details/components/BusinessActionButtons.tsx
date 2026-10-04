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
          className="min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-800 dark:text-slate-200 hover:text-amber-900 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700 hover:border-amber-300 flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
          title="اتصال هاتفي فوري"
        >
          <Phone className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
          <span>اتصال</span>
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="min-h-[44px] py-2 px-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 font-bold flex items-center justify-center gap-1 opacity-50 cursor-not-allowed"
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
          className="min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-900 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800 flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
          title="محادثة واتساب مباشرة"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>واتساب</span>
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="min-h-[44px] py-2 px-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 font-bold flex items-center justify-center gap-1 opacity-50 cursor-not-allowed"
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
        className="min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-900 dark:text-blue-300 border border-blue-200/90 dark:border-blue-800 flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
        title="الاتجاهات على خرائط Google"
        aria-label="الاتجاهات"
      >
        <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>الاتجاهات</span>
      </a>
    </div>
  );
};
