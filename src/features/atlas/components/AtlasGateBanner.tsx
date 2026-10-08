import React from 'react';
import { Navigation, ExternalLink } from 'lucide-react';
import { HadayekZone } from '../../../data/hadayekAtlasData';
import { Button } from '../../../shared/ui';

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
            <span className="text-caption font-bold text-amber-700">
              🚪 البوابة الموصى بها للدخول:
            </span>
            <span className="text-xs font-extrabold text-[var(--text-primary)]">
              {primaryGate.nameAr} ({primaryGate.popularNameAr})
            </span>
          </div>
          <p className="text-caption text-[var(--text-secondary)] mt-0.5">
            عبر {primaryGate.accessRoadAr} ⬅️ يخدم مباشرة {currentZone.nameAr} و {currentZone.mainStreetsAr[0]}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenGoogleMapsRoute}
          leadingIcon={<ExternalLink />}
          className="flex-1 sm:flex-none"
        >
          ملاحة Google
        </Button>

        {onOpenGatesGuide && (
          <Button variant="secondary" size="sm" onClick={onOpenGatesGuide} className="sm:hidden">
            البوابات
          </Button>
        )}
      </div>
    </div>
  );
};
