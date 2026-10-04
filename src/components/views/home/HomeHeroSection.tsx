import React, { useState } from 'react';
import { Compass, Search, Navigation } from 'lucide-react';
import { Business } from '../../../types';
import { HadayekZone } from '../../../data/hadayekAtlasData';
import { HadayekAtlasNavigator } from '../../atlas/HadayekAtlasNavigator';
import { HadayekLifelineBar } from '../../atlas/HadayekLifelineBar';
import { SmartSearchBar } from '../../search/SmartSearchBar';

export interface HomeHeroSectionProps {
  businesses: Business[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedGov: string;
  onGovChange: (g: string) => void;
  selectedCity: string;
  onCityChange: (c: string) => void;
  userCoords: { lat: number; lng: number } | null;
  isLocatingUser: boolean;
  onRequestLocation: () => void;
  onNavigate: (path: string) => void;
  activeTarget: {
    zone: HadayekZone;
    buildingNumber: string;
    coords: { lat: number; lng: number };
  } | null;
  onSelectTarget: (target: {
    zone: HadayekZone;
    buildingNumber: string;
    coords: { lat: number; lng: number };
  }) => void;
  onOpenGatesGuide: () => void;
}

export const HomeHeroSection: React.FC<HomeHeroSectionProps> = ({
  businesses,
  searchQuery,
  onSearchChange,
  selectedGov,
  onGovChange,
  selectedCity,
  onCityChange,
  userCoords,
  isLocatingUser,
  onRequestLocation,
  onNavigate,
  activeTarget,
  onSelectTarget,
  onOpenGatesGuide,
}) => {
  const [heroMode, setHeroMode] = useState<'atlas' | 'search'>('atlas');

  const handleLifelineCategorySelect = (categoryQuery: string) => {
    onNavigate(`/search?cat=${encodeURIComponent(categoryQuery)}`);
  };

  return (
    <section className="relative pt-6 pb-8 sm:pt-10 sm:pb-12 overflow-hidden border-b border-[var(--border-color)] bg-gradient-to-b from-amber-500/10 via-slate-50/50 dark:via-slate-900/40 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Hero Heading & Value Proposition */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-black shadow-xs">
            <Compass className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>أطلس حدائق الأهرام التفاعلي الذكي</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight leading-tight">
            دليلك الذكي لكل عمارة ونشاط وخدمة في حدائق الأهرام
          </h1>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed max-w-2xl mx-auto">
            حدد أي رقم عمارة من منطقة (أ) إلى (ن) واعرف أقرب بوابة والأنشطة المحيطة والاتجاهات المباشرة فوراً.
          </p>

          {/* Mode Switcher Pills: Atlas vs Traditional Search */}
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setHeroMode('atlas')}
              className={`text-xs font-black px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                heroMode === 'atlas'
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                  : 'bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>أطلس العمارات والملاحة</span>
            </button>

            <button
              type="button"
              onClick={() => setHeroMode('search')}
              className={`text-xs font-black px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                heroMode === 'search'
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                  : 'bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>البحث المباشر (اسم / نشاط)</span>
            </button>
          </div>
        </div>

        {/* Hero Primary Tool */}
        <div className="max-w-4xl mx-auto">
          {heroMode === 'atlas' ? (
            <HadayekAtlasNavigator
              onSelectTarget={onSelectTarget}
              onOpenGatesGuide={onOpenGatesGuide}
            />
          ) : (
            <div className="bg-[var(--bg-card)]/90 backdrop-blur-xl border border-[var(--border-color)] rounded-3xl p-4 sm:p-6 shadow-xl">
              <SmartSearchBar
                businesses={businesses}
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                selectedGov={selectedGov}
                onGovChange={onGovChange}
                selectedCity={selectedCity}
                onCityChange={onCityChange}
                userCoords={userCoords}
                isLocatingUser={isLocatingUser}
                onRequestLocation={onRequestLocation}
                onSearchSubmit={() => onNavigate('/search')}
              />
            </div>
          )}
        </div>

        {/* Hadayek Daily & Emergency Lifelines Bar */}
        <div className="max-w-4xl mx-auto">
          <HadayekLifelineBar
            onSelectCategory={handleLifelineCategorySelect}
            onOpenGatesGuide={onOpenGatesGuide}
          />
        </div>

        {/* Action: Open the selected building on the Full Interactive Map */}
        {activeTarget && (
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                const zoneParam = encodeURIComponent(activeTarget.zone.letterAr);
                const bldgParam = encodeURIComponent(activeTarget.buildingNumber || '');
                onNavigate(`/map?zone=${zoneParam}&bldg=${bldgParam}`);
              }}
              className="bg-slate-950 hover:bg-slate-800 text-white dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 font-black text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Navigation className="w-4 h-4" />
              <span>
                فتح {activeTarget.buildingNumber ? `عمارة ${activeTarget.buildingNumber} ` : ''}({activeTarget.zone.nameAr}) على الخريطة التفاعلية الكاملة الآن
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
