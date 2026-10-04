import React from 'react';
import { Navigation, ExternalLink } from 'lucide-react';
import { HadayekZone } from '../../../data/hadayekAtlasData';

export interface AtlasGateBannerProps {
  primaryGate: {
    nameAr: string;
    popularNameAr: string;
    accessRoadAr: string;
  };
  currentZone: HadayekZone;
  onOpenGoogleMapsRoute: () => void;
  onOpenGatesGuide?: () => void;
}

export const AtlasGateBanner: React.FC<AtlasGateBannerProps> = ({
  primaryGate,
  currentZone,
  onOpenGoogleMapsRoute,
  onOpenGatesGuide,
}) => {
  return (
    <div className="mt-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
          <Navigation className="w-4 h-4 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
              🚪 البوابة الموصى بها للدخول:
            </span>
            <span className="text-xs font-black text-[var(--text-primary)]">
              {primaryGate.nameAr} ({primaryGate.popularNameAr})
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            عبر {primaryGate.accessRoadAr} ⬅️ يخدم مباشرة {currentZone.nameAr} و {currentZone.mainStreetsAr[0]}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
        <button
          type="button"
          onClick={onOpenGoogleMapsRoute}
          className="flex-1 sm:flex-none text-xs font-black bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>ملاحة Google</span>
        </button>

        {onOpenGatesGuide && (
          <button
            type="button"
            onClick={onOpenGatesGuide}
            className="sm:hidden text-xs font-black text-amber-700 bg-amber-100/80 px-3 py-2 rounded-xl"
          >
            البوابات
          </button>
        )}
      </div>
    </div>
  );
};
