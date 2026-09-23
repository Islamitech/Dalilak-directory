import React, { useState, useMemo, useEffect } from 'react';
import { Business } from '../../types';
import { InteractiveMap, MAP_QUICK_CATEGORIES } from '../InteractiveMap';
import { getBusinessMapDetails } from '../../utils/directoryEnhancements';
import { getAvailableQuickCategoriesInZone } from '../../utils/hadayekZoneHelper';
import {
  HadayekZone,
  HADAYEK_ZONES,
  getHadayekZone,
  getRecommendedGateForZone,
  estimateBuildingCoordinates,
} from '../../data/hadayekAtlasData';
import { ProximityRadarDrawer } from '../atlas/ProximityRadarDrawer';
import { HadayekGatesModal } from '../atlas/HadayekGatesModal';
import {
  Compass,
  MapPin,
  X,
  Navigation,
  Phone,
  Building2,
  ExternalLink,
  Layers,
  HelpCircle,
  Search,
} from 'lucide-react';

export interface MapViewProps {
  businesses: Business[];
  filteredBusinesses: Business[];
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  selectedZone?: string;
  onZoneChange?: (zone: string) => void;
  sortBy: any;
  onSortChange: (s: any) => void;
  openNowOnly: boolean;
  onToggleOpenNow: () => void;
  onOpenBusiness: (biz: Business) => void;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
  userCoords: { lat: number; lng: number } | null;
  onNavigate: (path: string) => void;
  lat?: number;
  lng?: number;
}

export const MapView: React.FC<MapViewProps> = ({
  businesses,
  filteredBusinesses,
  categoryFilter,
  onCategoryChange,
  selectedZone,
  onZoneChange,
  sortBy,
  onSortChange,
  openNowOnly,
  onToggleOpenNow,
  onOpenBusiness,
  onToggleFavorite,
  favorites,
  userCoords,
  onNavigate,
  lat = 29.9683,
  lng = 31.1002,
}) => {
  const [selectedMapBiz, setSelectedMapBiz] = useState<Business | null>(null);
  const [isGatesModalOpen, setIsGatesModalOpen] = useState<boolean>(false);

  // 1. Read URL params (?zone=...&bldg=...)
  const [activeZoneLetter, setActiveZoneLetter] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('zone') || '';
  });

  const [activeBuildingNumber, setActiveBuildingNumber] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('bldg') || '';
  });

  // Keep state synced if URL changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const z = params.get('zone') || '';
    const b = params.get('bldg') || '';
    if (z !== activeZoneLetter) setActiveZoneLetter(z);
    if (b !== activeBuildingNumber) setActiveBuildingNumber(b);
  }, []);

  // Sync state if selectedZone prop changes from parent
  useEffect(() => {
    if (selectedZone !== undefined) {
      const cleanZone = selectedZone === 'all' ? '' : selectedZone;
      if (cleanZone !== activeZoneLetter) {
        setActiveZoneLetter(cleanZone);
      }
    }
  }, [selectedZone]);

  // Compute zone-scoped available quick categories and activity counts
  const quickCategories = useMemo(() => {
    return getAvailableQuickCategoriesInZone(businesses, activeZoneLetter, MAP_QUICK_CATEGORIES);
  }, [businesses, activeZoneLetter]);

  const activeCategoryObj = useMemo(() => {
    if (!categoryFilter || categoryFilter === 'all') return null;
    return quickCategories.find((c) => c.id === categoryFilter) || {
      id: categoryFilter,
      name: categoryFilter,
      icon: '📍',
      count: 0,
    };
  }, [categoryFilter, quickCategories]);

  // 2. Compute Target Building / Zone (Only if an explicit building number is requested)
  const targetBuilding = useMemo(() => {
    if (!activeZoneLetter || !activeBuildingNumber) return null;
    const zone = getHadayekZone(activeZoneLetter);
    if (!zone) return null;
    const coords = estimateBuildingCoordinates(zone.letterAr, activeBuildingNumber);
    return {
      zone,
      zoneLetter: zone.letterAr,
      buildingNumber: activeBuildingNumber,
      lat: coords.lat,
      lng: coords.lng,
      coords: { lat: coords.lat, lng: coords.lng },
    };
  }, [activeZoneLetter, activeBuildingNumber]);

  // Recommended gate for current target
  const gateInfo = useMemo(() => {
    if (!activeZoneLetter) return null;
    return getRecommendedGateForZone(activeZoneLetter);
  }, [activeZoneLetter]);

  const handleSelectZoneJump = (zoneLetter: string) => {
    const nextZone = activeZoneLetter === zoneLetter ? '' : zoneLetter;
    setActiveZoneLetter(nextZone);
    if (onZoneChange) onZoneChange(nextZone || 'all');
    const newUrl = new URL(window.location.href);
    if (nextZone) {
      newUrl.searchParams.set('zone', nextZone);
    } else {
      newUrl.searchParams.delete('zone');
    }
    if (!activeBuildingNumber) newUrl.searchParams.delete('bldg');
    window.history.replaceState({}, '', newUrl.toString());
  };

  const handleClearTarget = () => {
    setActiveZoneLetter('');
    setActiveBuildingNumber('');
    if (onZoneChange) onZoneChange('all');
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('zone');
    newUrl.searchParams.delete('bldg');
    window.history.replaceState({}, '', newUrl.toString());
  };

  return (
    <div className="relative w-full h-full flex-1 min-h-0 overflow-hidden flex flex-col bg-slate-100 select-none font-['Cairo',sans-serif]" dir="rtl">
      {/* 🗺️ Screen-Integrated Map Canvas */}
      <div className="relative w-full h-full flex-1 min-h-0 overflow-hidden z-0">
        <InteractiveMap
          businesses={businesses}
          mode="view"
          lat={lat}
          lng={lng}
          initialShowBusinesses={false}
          categoryFilter={categoryFilter}
          onCategoryChange={onCategoryChange}
          targetBuilding={targetBuilding}
          showHadayekGates={true}
          selectedZone={activeZoneLetter}
          onSelectZone={handleSelectZoneJump}
          onSelectBusiness={(biz) => {
            setSelectedMapBiz(biz);
          }}
          heightClass="h-full"
          defaultExpanded={false}
          onExploreDirectory={() => onNavigate('/search')}
          onOpenGatesGuide={() => setIsGatesModalOpen(true)}
          quickCategories={quickCategories}
        />

        {/* 🏢 Target Building Highlight Banner (if active) */}
        {targetBuilding && (
          <div className="absolute top-20 right-4 left-4 z-[890] pointer-events-none flex justify-center">
            <div className="pointer-events-auto bg-white/98 backdrop-blur-md border-2 border-amber-400/80 shadow-xl rounded-2xl p-2 sm:p-2.5 px-3 flex items-center justify-between gap-3 animate-fade-in max-w-md w-full text-slate-900">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                  <Building2 className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="truncate">
                  <span className="text-xs font-black text-slate-900">
                    {targetBuilding.buildingNumber
                      ? `عمارة ${targetBuilding.buildingNumber} - ${targetBuilding.zone.nameAr}`
                      : targetBuilding.zone.nameAr}
                  </span>
                  {gateInfo && (
                    <span className="text-[10px] font-bold text-amber-700 mr-2">
                      🚪 أقرب بوابة: {gateInfo.primaryGate.popularNameAr}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearTarget}
                className="text-[10px] font-black text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                إلغاء ✕
              </button>
            </div>
          </div>
        )}

        {/* 📋 Floating Selected Business Card Overlay on Pin Click */}
        {selectedMapBiz && (() => {
          const { effectiveUrl, isOfficial } = getBusinessMapDetails(selectedMapBiz);
          return (
            <div className="absolute bottom-20 md:bottom-6 right-3 left-3 sm:right-auto sm:left-6 sm:w-96 z-[1000] animate-slide-up">
              <div className="bg-white/98 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3.5 shadow-2xl space-y-2.5 text-right text-slate-900">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                      {selectedMapBiz.category}
                    </span>
                    <h4 className="font-black text-sm text-slate-900 mt-1 truncate">
                      {selectedMapBiz.nameAr}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {[selectedMapBiz.street, selectedMapBiz.city, selectedMapBiz.governorate].filter(Boolean).join('، ')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedMapBiz(null)}
                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                    title="إغلاق"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onOpenBusiness(selectedMapBiz)}
                    className="py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs text-center cursor-pointer transition-colors flex items-center justify-center gap-1 shadow-xs"
                  >
                    <span>التفاصيل</span>
                  </button>

                  {effectiveUrl ? (
                    <a
                      href={effectiveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                      title={isOfficial ? 'فتح خرائط Google' : 'الموقع والملاحة'}
                    >
                      <Navigation className="w-3.5 h-3.5 text-blue-600" />
                      <span>اتجاهات</span>
                    </a>
                  ) : (
                    <div className="py-1.5 px-2 rounded-xl bg-slate-50 text-slate-400 font-bold text-xs flex items-center justify-center gap-1 opacity-50 cursor-not-allowed border border-slate-200">
                      <Navigation className="w-3.5 h-3.5 text-slate-400" />
                      <span>اتجاهات</span>
                    </div>
                  )}

                  {selectedMapBiz.phone ? (
                    <a
                      href={`tel:${selectedMapBiz.phone}`}
                      className="py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs border border-slate-200"
                      title="اتصال هاتفي"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-600" />
                      <span>اتصال</span>
                    </a>
                  ) : (
                    <div className="py-1.5 px-2 rounded-xl bg-slate-50 text-slate-400 font-bold text-xs flex items-center justify-center gap-1 opacity-50 cursor-not-allowed border border-slate-200">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>اتصال</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Proximity Radar for Selected Target Building */}
      {targetBuilding && (
        <ProximityRadarDrawer
          target={targetBuilding}
          businesses={businesses}
          onOpenBusiness={onOpenBusiness}
        />
      )}

      {/* Gates Modal */}
      <HadayekGatesModal
        isOpen={isGatesModalOpen}
        onClose={() => setIsGatesModalOpen(false)}
        onSelectZone={(z) => handleSelectZoneJump(z)}
      />
    </div>
  );
};
