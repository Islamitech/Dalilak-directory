import React, { useState, useMemo } from 'react';
import {
  HADAYEK_ZONES,
  HadayekZone,
  getHadayekZone,
  getRecommendedGateForZone,
  searchBuildingCoordinatesExact,
} from '../../data/hadayekAtlasData';
import {
  Compass,
  MapPin,
  Navigation,
  Search,
  Building2,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { AtlasGateBanner } from '../../features/atlas';

export interface HadayekAtlasNavigatorProps {
  onSelectTarget: (target: {
    zone: HadayekZone;
    buildingNumber: string;
    coords: { lat: number; lng: number };
  }) => void;
  onOpenGatesGuide?: () => void;
  className?: string;
}

export const HadayekAtlasNavigator: React.FC<HadayekAtlasNavigatorProps> = ({
  onSelectTarget,
  onOpenGatesGuide,
  className = '',
}) => {
  // 1. Local State
  const [selectedZoneLetter, setSelectedZoneLetter] = useState<string>('ل');
  const [buildingInput, setBuildingInput] = useState<string>('');
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [bldgNotFound, setBldgNotFound] = useState<boolean>(false);

  // 2. Active Zone & Gate Inference
  const currentZone = useMemo(() => {
    return getHadayekZone(selectedZoneLetter) || HADAYEK_ZONES[0];
  }, [selectedZoneLetter]);

  const { primaryGate } = useMemo(() => {
    return getRecommendedGateForZone(selectedZoneLetter);
  }, [selectedZoneLetter]);

  // Handle Search Submission
  const handleExecuteNavigation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsNavigating(true);
    setBldgNotFound(false);

    const bldg = buildingInput.trim();
    let coords: { lat: number; lng: number } | null = null;
    if (bldg) {
      coords = await searchBuildingCoordinatesExact(selectedZoneLetter, bldg);
      if (!coords) {
        setIsNavigating(false);
        setBldgNotFound(true);
        return;
      }
    } else {
      coords = { lat: currentZone.centerLat, lng: currentZone.centerLng };
    }

    onSelectTarget({
      zone: currentZone,
      buildingNumber: bldg,
      coords,
    });

    setTimeout(() => {
      setIsNavigating(false);
    }, 400);
  };

  // Direct Google Maps Route
  const handleOpenGoogleMapsRoute = async () => {
    const bldg = buildingInput.trim();
    let coords: { lat: number; lng: number } | null = null;
    if (bldg) {
      coords = await searchBuildingCoordinatesExact(selectedZoneLetter, bldg);
    }
    const finalCoords = coords || { lat: currentZone.centerLat, lng: currentZone.centerLng };
    const query = bldg
      ? `عمارة ${bldg} منطقة ${currentZone.letterAr} حدائق الأهرام`
      : `${currentZone.nameAr} حدائق الأهرام`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${finalCoords.lat},${finalCoords.lng}&query=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Quick Zone selector buttons
  const popularZoneLetters = ['ل', 'هـ', 'أ', 'ك', 'ح', 'و'];

  return (
    <div
      className={`bg-[var(--bg-card)]/90 backdrop-blur-xl border border-amber-500/25 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden transition-all ${className}`}
      dir="rtl"
    >
      {/* Decorative Brand Accent Gradient */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

      {/* Header: Identity & Gates Guide Link */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 shadow-xs">
            <Compass className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                أطلس حدائق الأهرام الذكي
              </h2>
              <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                محدد العمارات
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] font-medium mt-0.5">
              حدد أي عمارة بالحدائق وتعرّف فوراً على أقرب بوابة والخدمات المحيطة
            </p>
          </div>
        </div>

        {onOpenGatesGuide && (
          <button
            type="button"
            onClick={onOpenGatesGuide}
            className="hidden sm:flex items-center gap-1.5 text-xs font-black text-amber-700 dark:text-amber-400 hover:text-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100/70 px-3 py-1.5 rounded-xl border border-amber-500/20 transition-all cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>دليل البوابات الأربع</span>
          </button>
        )}
      </div>

      {/* Form: Zone Selector + Building Number + Action Button */}
      <form onSubmit={handleExecuteNavigation} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3">
          {/* 1. Zone Selector */}
          <div className="sm:col-span-5 relative">
            <label className="block text-[11px] font-black text-[var(--text-secondary)] mb-1">
              اختر المنطقة
            </label>
            <div className="relative">
              <select
                value={selectedZoneLetter}
                onChange={(e) => setSelectedZoneLetter(e.target.value)}
                className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-[var(--border-color)] focus:border-amber-500 rounded-2xl px-4 py-2 text-sm font-black text-[var(--text-primary)] appearance-none cursor-pointer outline-none transition-all"
              >
                {HADAYEK_ZONES.map((zone) => (
                  <option key={zone.id} value={zone.letterAr}>
                    {zone.nameAr} ({zone.letterAr}) — {zone.famousLandmarksAr[0] || 'الحدائق'}
                  </option>
                ))}
              </select>
              <div className="absolute end-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 2. Building Number Input */}
          <div className="sm:col-span-4 relative">
            <label className="block text-[11px] font-black text-[var(--text-secondary)] mb-1">
              رقم العمارة (اختياري)
            </label>
            <div className="relative">
              <input
                type="text"
                value={buildingInput}
                onChange={(e) => setBuildingInput(e.target.value)}
                placeholder="مثال: 240 أو 185"
                className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-[var(--border-color)] focus:border-amber-500 rounded-2xl px-4 py-2 text-sm font-black text-[var(--text-primary)] placeholder:text-slate-400 outline-none transition-all font-mono"
              />
              <div className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 3. Execute Navigation Button */}
          <div className="sm:col-span-3 flex items-end">
            <button
              type="submit"
              disabled={isNavigating}
              className="w-full h-12 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>{isNavigating ? 'جاري الرصد...' : 'انتقال ومسح المحيط'}</span>
            </button>
          </div>
        </div>

        {/* Popular Zone Chips for 1-Click Jumping */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[11px] font-bold text-[var(--text-secondary)] me-1">
            مناطق شائعة:
          </span>
          {popularZoneLetters.map((letter) => {
            const isSelected = selectedZoneLetter === letter;
            return (
              <button
                key={letter}
                type="button"
                onClick={() => setSelectedZoneLetter(letter)}
                className={`text-[11px] font-black px-2.5 py-1 rounded-xl transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-transparent hover:border-slate-300'
                }`}
              >
                منطقة ({letter})
              </button>
            );
          })}
        </div>

        {/* 🚪 Smart Gate Recommendation & Route Banner */}
        <AtlasGateBanner
          primaryGate={primaryGate}
          currentZone={currentZone}
          onOpenGoogleMapsRoute={handleOpenGoogleMapsRoute}
          onOpenGatesGuide={onOpenGatesGuide}
        />
      </form>
    </div>
  );
};
