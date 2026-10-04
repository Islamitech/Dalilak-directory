import React from 'react';
import { Building2, ChevronLeft, Store, MapPin } from 'lucide-react';
import { Business } from '../../types';
import { getRecommendedGateForZone } from '../../data/hadayekAtlasData';
import { getBusinessHadayekZoneLetter } from '../../utils/hadayekZoneHelper';

export interface MapSearchSuggestionsDropdownProps {
  searchQuery: string;
  buildingMatch: any;
  digitOnlyMatches: Array<{ buildingNumber: string; zoneLetter: string; gate: string }>;
  matchingBusinesses: Business[];
  outsideSelectedZoneBusinesses: Business[];
  matchingZone: any;
  matchingCategories: Array<{ id: string; name: string; icon: string }>;
  activityIntent: any;
  onSelectBuildingItem: (zoneLetter: string, bldgNum: string) => void;
  onSelectBusinessItem: (biz: Business) => void;
  onSelectZone?: (zone: string) => void;
  onSelectOutsideZoneBusiness?: (biz: Business) => void;
  onSelectCategoryItem: (catId: string, zone?: string) => void;
}

export const MapSearchSuggestionsDropdown: React.FC<MapSearchSuggestionsDropdownProps> = ({
  searchQuery,
  buildingMatch,
  digitOnlyMatches,
  matchingBusinesses,
  outsideSelectedZoneBusinesses,
  matchingZone,
  matchingCategories,
  activityIntent,
  onSelectBuildingItem,
  onSelectBusinessItem,
  onSelectZone,
  onSelectOutsideZoneBusiness,
  onSelectCategoryItem,
}) => {
  return (
    <div className="absolute top-full inset-x-0 mt-2 bg-white/98 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-[1000] max-h-[calc(100dvh-var(--map-keyboard-height,0px)-6rem)] overflow-y-auto divide-y divide-slate-100 font-['Cairo',sans-serif]">
      {/* 1. Exact Building Match (e.g. 222 ح) */}
      {buildingMatch && (
        <button
          type="button"
          onClick={() => onSelectBuildingItem(buildingMatch.zoneLetter, buildingMatch.buildingNumber)}
          className="w-full text-right p-3 hover:bg-amber-50/90 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Building2 size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>عمارة {buildingMatch.buildingNumber}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 font-bold">
                  منطقة {buildingMatch.zoneLetter}
                </span>
              </div>
              <div className="text-xs text-slate-500 truncate mt-0.5">
                حدائق الأهرام • أقرب بوابة: {getRecommendedGateForZone(buildingMatch.zoneLetter).primaryGate.popularNameAr}
              </div>
            </div>
          </div>
          <div className="text-xs font-bold text-amber-600 group-hover:translate-x-[-4px] transition-transform flex items-center gap-1 shrink-0">
            <span>تحديد على الخريطة</span>
            <ChevronLeft size={16} />
          </div>
        </button>
      )}

      {/* 2. Digit-only building candidates (e.g. user typed 222) */}
      {digitOnlyMatches.map((dm) => (
        <button
          key={dm.zoneLetter}
          type="button"
          onClick={() => onSelectBuildingItem(dm.zoneLetter, dm.buildingNumber)}
          className="w-full text-right p-2.5 px-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Building2 size={16} />
            </div>
            <div className="min-w-0 text-xs">
              <span className="font-bold text-slate-800">عمارة {dm.buildingNumber}</span>
              <span className="text-slate-500 mx-1.5">•</span>
              <span className="text-slate-600 font-semibold">منطقة {dm.zoneLetter}</span>
              <span className="text-slate-400 text-[11px] me-2">({dm.gate})</span>
            </div>
          </div>
          <span className="text-[11px] text-amber-600 font-bold group-hover:translate-x-[-3px] transition-transform">انتقال</span>
        </button>
      ))}

      {/* 3. Matching Businesses */}
      {matchingBusinesses.map((biz) => (
        <button
          key={biz.id}
          type="button"
          onClick={() => onSelectBusinessItem(biz)}
          className="w-full text-right p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Store size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">{biz.nameAr}</div>
              <div className="text-xs text-slate-500 truncate mt-0.5">
                {biz.category} {biz.street ? `• ${biz.street}` : ''}
              </div>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-600 group-hover:translate-x-[-4px] transition-transform flex items-center gap-1 shrink-0">
            <span>عرض النشاط</span>
            <ChevronLeft size={16} />
          </div>
        </button>
      ))}

      {outsideSelectedZoneBusinesses.map((biz) => {
        const zoneLetter = getBusinessHadayekZoneLetter(biz);
        return (
          <button
            key={`all-zones-${biz.id}`}
            type="button"
            onClick={() => onSelectOutsideZoneBusiness?.(biz)}
            className="w-full text-right px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold"
          >
            عرض {biz.nameAr} في كل المناطق{zoneLetter ? ` (منطقة ${zoneLetter})` : ''}
          </button>
        );
      })}

      {/* 4. Matching Zone */}
      {matchingZone && (
        <button
          type="button"
          onClick={() => onSelectZone?.(matchingZone.letterAr)}
          className="w-full text-right p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <MapPin size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900">{matchingZone.nameAr}</div>
              <div className="text-xs text-slate-500 truncate mt-0.5">
                الانتقال لنطاق منطقة {matchingZone.letterAr} في حدائق الأهرام
              </div>
            </div>
          </div>
          <div className="text-xs font-bold text-emerald-600 group-hover:translate-x-[-4px] transition-transform flex items-center gap-1 shrink-0">
            <span>تحديد المنطقة</span>
            <ChevronLeft size={16} />
          </div>
        </button>
      )}

      {/* 1b. Matching Categories (City-Wide Discovery) */}
      {matchingCategories.map((mc) => (
        <button
          key={mc.id}
          type="button"
          onClick={() => onSelectCategoryItem(mc.id, activityIntent?.zone === 'all' || !activityIntent ? '' : activityIntent.zone)}
          className="w-full text-right p-3 hover:bg-amber-50/90 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg shrink-0">
              {mc.icon || '📍'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>عرض جميع {mc.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  {activityIntent && activityIntent.zone !== 'all' ? `منطقة ${activityIntent.zone}` : 'المدينة كاملة'}
                </span>
              </div>
              <div className="text-xs text-slate-500 truncate mt-0.5">
                استكشاف كافة أنشطة {mc.name} على خريطة حدائق الأهرام
              </div>
            </div>
          </div>
          <div className="text-xs font-bold text-amber-600 group-hover:translate-x-[-4px] transition-transform flex items-center gap-1 shrink-0">
            <span>تطبيق الفلتر</span>
            <ChevronLeft size={16} />
          </div>
        </button>
      ))}

      {/* 5. Fallback if no direct match */}
      {!buildingMatch && digitOnlyMatches.length === 0 && matchingCategories.length === 0 && matchingBusinesses.length === 0 && !matchingZone && (
        <div className="p-4 text-center text-xs text-slate-500">
          لم نجد نتائج مطابقة لـ &quot;{searchQuery}&quot;
          <div className="text-[11px] text-slate-400 mt-1 font-semibold">
            جرّب كتابة رقم العمارة والمنطقة (مثل: 222 ح) أو اسم المحل
          </div>
        </div>
      )}
    </div>
  );
};
