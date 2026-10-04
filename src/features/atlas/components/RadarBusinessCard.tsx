import React from 'react';
import { Business } from '../../../types';
import { formatHadayekDistance } from '../../../data/hadayekAtlasData';
import { getBusinessOpenStatus } from '../../../utils/directoryEnhancements';
import { Phone, MessageCircle } from 'lucide-react';

interface RadarBusinessCardProps {
  business: Business;
  distanceMeters: number;
  onOpenBusiness: (biz: Business) => void;
}

export const RadarBusinessCard: React.FC<RadarBusinessCardProps> = ({
  business: b,
  distanceMeters,
  onOpenBusiness,
}) => {
  const openStatus = getBusinessOpenStatus(b.workingHours);
  const phone = b.phone || b.secondaryPhone;
  const photo = (b.photos && b.photos[0]) || b.coverPhoto;

  return (
    <div
      onClick={() => onOpenBusiness(b)}
      className="group bg-slate-50 hover:bg-amber-50/20 border border-slate-200 hover:border-amber-400 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between gap-2 transition-all shadow-xs hover:shadow-md cursor-pointer"
    >
      <div className="flex items-start gap-2.5">
        {photo ? (
          <img
            src={photo}
            alt={b.nameAr}
            className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200 group-hover:scale-105 transition-transform"
            loading="lazy"
          />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0 font-black text-sm border border-amber-200">
            {b.nameAr ? b.nameAr.charAt(0) : '🏛️'}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-amber-700 transition-colors">
            {b.nameAr}
          </h4>

          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.2 rounded">
              {b.category}
            </span>
            <span className="text-[10px] font-black text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded">
              {formatHadayekDistance(distanceMeters)}
            </span>
          </div>

          {b.street && (
            <p className="text-[10px] text-slate-500 truncate mt-1">
              📍 {b.street}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
        <span
          className={`text-[10px] font-bold flex items-center gap-1 ${
            openStatus.isOpen ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              openStatus.isOpen ? 'bg-emerald-500' : 'bg-slate-400'
            }`}
          />
          {openStatus.isOpen ? 'مفتوح الآن' : 'مغلق'}
        </span>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {phone && (
            <>
              <a
                href={`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `مرحباً، أود الاستفسار من خلال دليلك حدائق الأهرام بخصوص ${b.nameAr}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-xs"
                title="محادثة واتساب"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
              <a
                href={`tel:${phone.replace(/\D/g, '')}`}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200"
                title="اتصال هاتفي"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
            </>
          )}
          <button
            type="button"
            onClick={() => onOpenBusiness(b)}
            className="text-[10px] font-black text-amber-700 hover:underline px-1 py-0.5"
          >
            التفاصيل ⬅️
          </button>
        </div>
      </div>
    </div>
  );
};
