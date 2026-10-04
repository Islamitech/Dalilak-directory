import React from 'react';
import { Building2 } from 'lucide-react';

export interface CadastralBuildingCardProps {
  buildingNumber: string;
  zoneLetter: string;
  nearestGateName: string;
  onNavigateToMap: (zone: string, bldg: string) => void;
}

export const CadastralBuildingCard: React.FC<CadastralBuildingCardProps> = ({
  buildingNumber,
  zoneLetter,
  nearestGateName,
  onNavigateToMap,
}) => {
  return (
    <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            عمارة {buildingNumber} — منطقة ({zoneLetter})
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            حدائق الأهرام • أقرب بوابة: {nearestGateName}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onNavigateToMap(zoneLetter, buildingNumber)}
        className="inline-flex items-center justify-center min-h-[38px] px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
      >
        عرض على الخريطة
      </button>
    </div>
  );
};
