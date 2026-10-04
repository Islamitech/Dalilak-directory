import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  Loader2,
  Compass,
} from 'lucide-react';
import { Business } from '../../types';
import { MapTileLayerType, MAP_QUICK_CATEGORIES } from './constants/mapConstants';
import { getAvailableQuickCategoriesInZone } from '../../utils/hadayekZoneHelper';
import { useMapState } from './hooks/useMapState';
import { useMapInstance } from './hooks/useMapInstance';
import { MapFilterPortalDropdown } from './MapFilterPortalDropdown';
import { MapZoneBuildingControls } from './MapZoneBuildingControls';

export interface MapHeaderBarProps {
  mode: 'picker' | 'view';
  filteredBusinessesCount: number;
  tileLayer: MapTileLayerType;
  switchTileLayer: (type: MapTileLayerType) => void;
  state: ReturnType<typeof useMapState>;
  onGovChange: (govName: string) => void;
  businesses?: Business[];
  isLocating?: boolean;
  handleGetLocation?: () => void;
  showHadayekGates?: boolean;
  onToggleBusinessesVisibility?: (visible: boolean) => void;
  selectedZone?: string;
  onSelectZone?: (zoneLetter: string) => void;
  onCategorySelect?: (cat: string) => void;
  mapInstance?: ReturnType<typeof useMapInstance>;
  onExploreDirectory?: () => void;
}

export const MapHeaderBar: React.FC<MapHeaderBarProps> = ({
  mode, state, businesses = [], isLocating = false, handleGetLocation,
  showHadayekGates = true, onToggleBusinessesVisibility, onSelectZone,
  onCategorySelect, mapInstance, onExploreDirectory,
}) => {
  const {
    selectedZone, setSelectedZone, showDistrictsOverlay, setShowDistrictsOverlay,
    showGatesLayer, setShowGatesLayer, setShowBusinesses, isMapFilterOpen,
    setIsMapFilterOpen, mapCategoryFilter, setMapCategoryFilter,
    onlyVerifiedFilter, setOnlyVerifiedFilter, isExpanded, setIsExpanded,
  } = state;

  const isZoneScoped = Boolean(selectedZone);
  const activeQuickCategories = React.useMemo(() => {
    if (!isZoneScoped || !businesses || businesses.length === 0) {
      return MAP_QUICK_CATEGORIES.map((c) => ({ ...c, count: 0 }));
    }
    return getAvailableQuickCategoriesInZone(businesses, selectedZone, MAP_QUICK_CATEGORIES);
  }, [businesses, isZoneScoped, selectedZone]);

  const handleDistrictChange = (letter: string) => {
    setSelectedZone(letter);
    if (onSelectZone) onSelectZone(letter);
  };

  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isMapFilterOpen) return;
    const updatePosition = () => {
      if (filterButtonRef.current) {
        const rect = filterButtonRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + 6,
          left: Math.max(8, Math.min(rect.left, window.innerWidth - 328)),
        });
      }
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isMapFilterOpen]);

  useEffect(() => {
    if (!isMapFilterOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMapFilterOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMapFilterOpen, setIsMapFilterOpen]);

  return (
    <div className="relative bg-slate-900/95 backdrop-blur-md px-2 py-2 border-b border-slate-800/80 z-30 text-white select-none">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 w-full">
        {/* Quick Selectors & Micro Toggles */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0 w-full sm:w-auto">
          {/* City Fixed Badge */}
          <div className="inline-flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-black text-[10px] sm:text-xs rounded-md px-2 py-1 shrink-0 shadow-xs" title="الخريطة مثبتة على نطاق حدائق الأهرام">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>حدائق الأهرام</span>
          </div>

          <MapZoneBuildingControls
            selectedZone={selectedZone || ''}
            onDistrictChange={handleDistrictChange}
            mapInstance={mapInstance}
          />
        </div>

        {/* Action Buttons: Filters + Explore + Fullscreen */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0 w-full sm:w-auto ms-0 sm:ms-auto justify-start">
          {showHadayekGates && (
            <label className="inline-flex items-center gap-1 text-purple-300 hover:text-purple-200 font-bold cursor-pointer text-[10px] sm:text-xs transition-colors shrink-0 px-1 border-r border-slate-700/50">
              <input
                type="checkbox"
                checked={showGatesLayer}
                onChange={(e) => setShowGatesLayer(e.target.checked)}
                className="rounded accent-purple-500 w-3 h-3 cursor-pointer"
              />
              <span>بوابات</span>
            </label>
          )}

          <label className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200 font-bold cursor-pointer text-[10px] sm:text-xs transition-colors shrink-0 pe-1 border-e border-slate-700/50 ps-1 me-1">
            <input
              type="checkbox"
              checked={showDistrictsOverlay}
              onChange={(e) => setShowDistrictsOverlay(e.target.checked)}
              className="rounded accent-indigo-500 w-3 h-3 cursor-pointer"
            />
            <span>مناطق</span>
          </label>

          {mode === 'view' && (
            <>
              <button
                ref={filterButtonRef}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isMapFilterOpen) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setDropdownPos({
                      top: rect.bottom + 6,
                      left: Math.max(8, Math.min(rect.left, window.innerWidth - 328)),
                    });
                    setIsMapFilterOpen(true);
                  } else {
                    setIsMapFilterOpen(false);
                  }
                }}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold flex items-center gap-1 transition-all cursor-pointer select-none ${
                  mapCategoryFilter !== 'all' || onlyVerifiedFilter
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
                title="فلاتر وتصنيفات الأنشطة"
              >
                <SlidersHorizontal className="w-2.5 h-2.5" />
                <span>
                  {mapCategoryFilter !== 'all'
                    ? (activeQuickCategories.find((c) => c.id === mapCategoryFilter)?.name.split(' ')[0] || 'نشاط محدد')
                    : 'نوع النشاط'}
                </span>
                {(mapCategoryFilter !== 'all' || onlyVerifiedFilter) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                )}
              </button>

              <MapFilterPortalDropdown
                isOpen={isMapFilterOpen}
                dropdownPos={dropdownPos}
                mapCategoryFilter={mapCategoryFilter}
                onlyVerifiedFilter={onlyVerifiedFilter}
                activeQuickCategories={activeQuickCategories}
                isZoneScoped={isZoneScoped}
                onClose={() => setIsMapFilterOpen(false)}
                onSelectCategory={(catId) => {
                  setMapCategoryFilter(catId);
                  setShowBusinesses(catId !== 'all');
                  if (onCategorySelect) onCategorySelect(catId);
                  if (onToggleBusinessesVisibility) onToggleBusinessesVisibility(catId !== 'all');
                }}
                onToggleVerified={(checked) => setOnlyVerifiedFilter(checked)}
                onReset={() => {
                  setMapCategoryFilter('all');
                  setOnlyVerifiedFilter(false);
                  setShowBusinesses(false);
                  if (onCategorySelect) onCategorySelect('all');
                  if (onToggleBusinessesVisibility) onToggleBusinessesVisibility(false);
                }}
              />
            </>
          )}

          {onExploreDirectory && (
            <button
              type="button"
              onClick={onExploreDirectory}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] sm:text-xs px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
              title="استكشف الدليل"
            >
              <Compass className="w-3 h-3" />
              <span>استكشف</span>
            </button>
          )}

          {mode === 'picker' && handleGetLocation && (
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isLocating}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded shadow-xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              title="تحديد موقعي"
            >
              {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3 fill-slate-950" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 rounded border text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer ${
              isExpanded
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={isExpanded ? 'إنهاء وضع الشاشة الكاملة' : 'توسيع الخريطة'}
          >
            {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
};
