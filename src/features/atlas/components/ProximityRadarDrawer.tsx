import React, { useMemo, useState } from 'react';
import { Business } from '../../../types';
import { HadayekZone } from '../../../data/hadayekAtlasData';
import { Radar, ChevronDown, ChevronUp, Store, X } from 'lucide-react';
import { Drawer, IconButton } from '../../../shared/ui';
import { computeNearbyBusinesses, extractNearbyCategories } from '../model/proximityRadar';
import { RadarBusinessCard } from './RadarBusinessCard';

export interface ProximityRadarDrawerProps {
  target: {
    zone: HadayekZone;
    buildingNumber: string;
    coords: { lat: number; lng: number };
  } | null;
  businesses: Business[];
  onOpenBusiness: (biz: Business) => void;
  onClose?: () => void;
  className?: string;
}

export const ProximityRadarDrawer: React.FC<ProximityRadarDrawerProps> = ({
  target,
  businesses,
  onOpenBusiness,
  onClose,
  className = '',
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const nearbyBusinesses = useMemo(() => computeNearbyBusinesses(target, businesses), [target, businesses]);
  const categories = useMemo(() => extractNearbyCategories(nearbyBusinesses), [nearbyBusinesses]);

  const displayList = useMemo(() => {
    const maxItems = 10;
    if (activeCategoryFilter === 'all') return nearbyBusinesses.slice(0, maxItems);
    return nearbyBusinesses.filter((item) => item.business.category === activeCategoryFilter).slice(0, maxItems);
  }, [nearbyBusinesses, activeCategoryFilter]);

  if (!target) return null;

  const targetLabel = target.buildingNumber
    ? `عمارة ${target.buildingNumber} - ${target.zone.nameAr}`
    : target.zone.nameAr;

  if (isCollapsed) {
    return (
      <div className={`fixed bottom-4 inset-x-4 max-w-sm mx-auto z-40 animate-fade-in ${className}`}>
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="w-full bg-slate-900/95 hover:bg-slate-900 text-white rounded-2xl p-3 shadow-2xl border-2 border-amber-400 flex items-center justify-between gap-3 cursor-pointer backdrop-blur-md transition-all active:scale-95"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <Radar className="w-4 h-4 animate-spin" />
            </div>
            <div className="text-right">
              <span className="text-xs font-black block text-amber-400">رادار الخدمات والأنشطة</span>
              <span className="text-[11px] text-slate-300">أقرب {displayList.length} أنشطة حول {targetLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
            <span>توسيع</span>
            <ChevronUp className="w-4 h-4" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <Drawer
      isOpen={!isCollapsed}
      onClose={() => setIsCollapsed(true)}
      position="bottom"
      hideDefaultHeader
      aria-label="رادار الخدمات والأنشطة المحيطة"
      className={`!border-2 !border-amber-400 !rounded-t-2xl sm:!rounded-3xl sm:bottom-3 sm:inset-x-6 max-w-3xl mx-auto shadow-2xl !max-h-[62vh] ${className}`}
      contentClassName="p-3.5 sm:p-5 flex flex-col font-['Cairo',sans-serif] overflow-y-auto"
    >
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
            <Radar className="w-5 h-5 animate-pulse" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">رادار الخدمات والأنشطة المحيطة</h3>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300 shrink-0">
                أقرب {displayList.length} أنشطة
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-600 truncate mt-0.5">
              حول <strong className="text-amber-700">{targetLabel}</strong> (مرتبة بالأمتار لأقرب 10 أنشطة)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            title="تصغير الرادار"
          >
            <ChevronDown className="w-4 h-4 text-slate-600" />
            <span className="text-[11px]">تصغير</span>
          </button>
          {onClose && (
            <IconButton
              aria-label="إغلاق الرادار"
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="!w-7 !h-7 !rounded-xl !bg-slate-100 hover:!bg-rose-50 hover:!text-rose-600 !text-slate-500"
              icon={<X className="w-4 h-4" />}
            />
          )}
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 border-b border-slate-100 scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('all')}
            className={`text-[11px] font-black px-3 py-1 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeCategoryFilter === 'all' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            الكل ({displayList.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategoryFilter(cat)}
              className={`text-[11px] font-black px-3 py-1 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeCategoryFilter === cat ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="mt-2.5 overflow-y-auto flex-1 pe-0.5 space-y-2.5 scrollbar-thin">
        {displayList.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Store className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">لا توجد منشآت مسجلة في هذا التصنيف حالياً قرب هذا الموقع.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
            {displayList.map(({ business: b, distanceMeters }) => (
              <RadarBusinessCard
                key={b.id}
                business={b}
                distanceMeters={distanceMeters}
                onOpenBusiness={onOpenBusiness}
              />
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
};
