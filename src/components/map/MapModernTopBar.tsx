import React, { useEffect, useRef, useState, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { Search, SlidersHorizontal, X, Loader2, Building2, Store, ChevronLeft, MapPin } from 'lucide-react';
import { HADAYEK_OFFICIAL_DISTRICTS, getDistrictByLetter } from '../../data/hadayekDistrictsGeoData';
import { MAP_QUICK_CATEGORIES } from './constants/mapConstants';
import { Business } from '../../types';
import { parseHadayekBuildingAddress } from '../../utils/hadayekBuildingSearch';
import { searchBuildingCoordinatesExact, estimateBuildingCoordinates, getRecommendedGateForZone } from '../../data/hadayekAtlasData';

export interface MapModernTopBarProps {
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  selectedZone?: string;
  onSelectZone?: (zone: string) => void;
  categoryFilter?: string;
  onCategoryChange?: (category: string) => void;
  quickCategories?: Array<{ id: string; name: string; icon: string; count?: number }>;
  filteredBusinessesCount?: number;
  searchMode: 'browse' | 'building';
  onSearchModeChange: (mode: 'browse' | 'building') => void;
  children?: React.ReactNode;
  buildingNumber?: string;
  businesses?: Business[];
  onSelectBuilding?: (building: { buildingNumber: string; zoneLetter: string; lat: number; lng: number }) => void;
  onSelectBusiness?: (business: Business) => void;
}

export const MapModernTopBar: React.FC<MapModernTopBarProps> = ({
  searchQuery = '',
  onSearchQueryChange,
  selectedZone = '',
  onSelectZone,
  categoryFilter = 'all',
  onCategoryChange,
  quickCategories,
  filteredBusinessesCount,
  searchMode,
  onSearchModeChange,
  children,
  buildingNumber,
  businesses = [],
  onSelectBuilding,
  onSelectBusiness,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isExecutingSearch, setIsExecutingSearch] = useState(false);

  const barContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const regionRef = useRef<HTMLSelectElement>(null);

  const categories = quickCategories?.length ? quickCategories : MAP_QUICK_CATEGORIES;

  const open = () => {
    flushSync(() => setExpanded(true));
    regionRef.current?.focus();
    try {
      regionRef.current?.showPicker?.();
    } catch {
      /* Keep the focused select available in browsers without showPicker. */
    }
  };

  // 1. Detect building match in current query (e.g. "222 ح" or "عمارة 222 ح")
  const buildingMatch = useMemo(() => {
    return parseHadayekBuildingAddress(searchQuery, selectedZone);
  }, [searchQuery, selectedZone]);

  // 2. Candidate buildings if user typed digits only without zone (e.g. "222")
  const digitOnlyMatches = useMemo(() => {
    const q = searchQuery.trim();
    if (!buildingMatch && /^\d+$/.test(q)) {
      const topZones = ['أ', 'ب', 'ج', 'ح', 'ع', 'ك', 'ل'];
      return topZones.map((z) => ({
        buildingNumber: q,
        zoneLetter: z,
        gate: getRecommendedGateForZone(z).primaryGate.popularNameAr,
      }));
    }
    return [];
  }, [searchQuery, buildingMatch]);

  // 3. Candidate businesses matching search
  const matchingBusinesses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !businesses || buildingMatch) return [];
    return businesses
      .filter((b) => {
        const name = (b.nameAr || '').toLowerCase();
        const cat = (b.category || '').toLowerCase();
        const street = (b.street || '').toLowerCase();
        return name.includes(q) || cat.includes(q) || street.includes(q);
      })
      .slice(0, 5);
  }, [searchQuery, businesses, buildingMatch]);

  // 3b. Candidate categories matching search query (City-wide scope)
  const matchingCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2 || buildingMatch) return [];
    return categories.filter((c) => c.id !== 'all' && (c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)));
  }, [searchQuery, categories, buildingMatch]);

  // 4. Candidate zone matching
  const matchingZone = useMemo(() => {
    const q = searchQuery.trim();
    if (!q || buildingMatch) return null;
    return getDistrictByLetter(q);
  }, [searchQuery, buildingMatch]);

  // Execute selecting a building
  const handleSelectBuildingItem = async (zoneLetter: string, bldgNum: string) => {
    setIsExecutingSearch(true);
    setShowSuggestions(false);
    try {
      const coords =
        (await searchBuildingCoordinatesExact(zoneLetter, bldgNum)) ||
        estimateBuildingCoordinates(zoneLetter, bldgNum);

      if (coords && onSelectBuilding) {
        onSelectBuilding({
          buildingNumber: bldgNum,
          zoneLetter,
          lat: coords.lat,
          lng: coords.lng,
        });
      }
    } finally {
      setIsExecutingSearch(false);
    }
  };

  // Execute selecting a business
  const handleSelectBusinessItem = (biz: Business) => {
    setShowSuggestions(false);
    if (onSelectBusiness) {
      onSelectBusiness(biz);
    }
  };

  // Form submit handler
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    if (buildingMatch) {
      await handleSelectBuildingItem(buildingMatch.zoneLetter, buildingMatch.buildingNumber);
      return;
    }

    if (digitOnlyMatches.length > 0) {
      const first = digitOnlyMatches[0];
      await handleSelectBuildingItem(first.zoneLetter, first.buildingNumber);
      return;
    }

    if (matchingCategories.length > 0) {
      const matchedCat = matchingCategories[0];
      onCategoryChange?.(matchedCat.id);
      onSearchModeChange('browse');
      onSearchQueryChange?.('');
      setShowSuggestions(false);
      return;
    }

    if (matchingBusinesses.length > 0) {
      handleSelectBusinessItem(matchingBusinesses[0]);
      return;
    }

    if (matchingZone && onSelectZone) {
      onSelectZone(matchingZone.letterAr);
      setShowSuggestions(false);
      return;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (barContainerRef.current && !barContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return (
    <div dir="rtl" className="absolute top-3 inset-x-3 sm:inset-x-5 z-[900] pointer-events-none">
      <div ref={barContainerRef} className="relative max-w-2xl mx-auto pointer-events-auto">
        <div className="flex items-center gap-1 min-h-12 px-1.5 bg-white/95 border border-slate-200 rounded-full shadow-sm">
          <button
            type="button"
            aria-label={expanded ? 'إغلاق أدوات البحث' : 'فتح البحث والفلاتر'}
            onClick={() => (expanded ? setExpanded(false) : open())}
            className="shrink-0 w-9 h-11 flex items-center justify-center text-amber-600 cursor-pointer"
          >
            <SlidersHorizontal size={20} />
          </button>

          {expanded ? (
            <>
              <select
                ref={regionRef}
                aria-label="اختر المنطقة"
                value={selectedZone === 'all' ? '' : selectedZone}
                onChange={(e) => onSelectZone?.(e.target.value)}
                className="min-w-0 w-[27%] max-w-32 shrink-0 h-10 rounded-xl border border-slate-200 bg-white px-1 text-xs text-slate-800"
              >
                <option value="">كل المدينة</option>
                {HADAYEK_OFFICIAL_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.letterAr}>
                    منطقة {d.letterAr}
                  </option>
                ))}
              </select>
              <select
                aria-label="نوع البحث"
                value={searchMode === 'building' ? 'building' : categoryFilter}
                onChange={(e) => {
                  const building = e.target.value === 'building';
                  onSearchModeChange(building ? 'building' : 'browse');
                  onCategoryChange?.(building ? 'all' : e.target.value);
                }}
                className="min-w-0 w-[23%] max-w-36 shrink-0 h-10 rounded-xl border border-slate-200 bg-white px-1 text-xs text-slate-800"
              >
                <option value="all">كل الأنشطة</option>
                <option value="building" disabled={!selectedZone || selectedZone === 'all'}>
                  مبنى
                </option>
                {categories
                  .filter((c) => c.id !== 'all')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              <div className="min-w-0 flex-1">
                {searchMode === 'building' && selectedZone ? (
                  children
                ) : (
                  <span className="block truncate px-1 text-xs text-slate-600 font-bold">
                    {categoryFilter !== 'all'
                      ? (selectedZone && selectedZone !== 'all' ? `أنشطة منطقة ${selectedZone}` : 'نطاق المدينة كاملة')
                      : (selectedZone && selectedZone !== 'all' ? `منطقة ${selectedZone}` : 'المدينة كاملة')}
                  </span>
                )}
              </div>
              <button
                type="button"
                aria-label="مسح البحث والفلاتر"
                onClick={() => {
                  onSelectZone?.('');
                  onCategoryChange?.('all');
                  onSearchModeChange('browse');
                  setExpanded(false);
                }}
                className="w-7 h-11 shrink-0 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <form onSubmit={handleSearchSubmit} className="flex-1 min-w-0 flex items-center gap-1.5 px-2">
              <input
                ref={inputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  onSearchQueryChange?.(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="ابحث برقم العمارة (مثل: 222 ح) أو اسم النشاط…"
                className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-800 placeholder-slate-400 h-11"
                enterKeyHint="search"
                autoComplete="off"
              />
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchQueryChange?.('');
                    setShowSuggestions(false);
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0"
                  title="مسح"
                >
                  <X size={15} />
                </button>
              )}
              <button
                type="submit"
                disabled={isExecutingSearch || !searchQuery.trim()}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shrink-0 shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="بحث وتحديد"
                aria-label="تنفيذ البحث"
              >
                {isExecutingSearch ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Search size={17} strokeWidth={2.5} />
                )}
              </button>
            </form>
          )}
        </div>

        {/* 📋 Live Search Results Dropdown */}
        {showSuggestions && searchQuery.trim() && !expanded && (
          <div className="absolute top-full inset-x-0 mt-2 bg-white/98 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-[1000] max-h-80 overflow-y-auto divide-y divide-slate-100 font-['Cairo',sans-serif]">
            {/* 1. Exact Building Match (e.g. 222 ح) */}
            {buildingMatch && (
              <button
                type="button"
                onClick={() => handleSelectBuildingItem(buildingMatch.zoneLetter, buildingMatch.buildingNumber)}
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
                onClick={() => handleSelectBuildingItem(dm.zoneLetter, dm.buildingNumber)}
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
                    <span className="text-slate-400 text-[11px] mr-2">({dm.gate})</span>
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
                onClick={() => handleSelectBusinessItem(biz)}
                className="w-full text-right p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <Store size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {biz.nameAr}
                    </div>
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

            {/* 4. Matching Zone */}
            {matchingZone && (
              <button
                type="button"
                onClick={() => {
                  onSelectZone?.(matchingZone.letterAr);
                  setShowSuggestions(false);
                }}
                className="w-full text-right p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900">
                      {matchingZone.nameAr}
                    </div>
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
                onClick={() => {
                  onCategoryChange?.(mc.id);
                  onSearchModeChange('browse');
                  onSearchQueryChange?.('');
                  setShowSuggestions(false);
                }}
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
                        {selectedZone && selectedZone !== 'all' ? `منطقة ${selectedZone}` : 'المدينة كاملة'}
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
        )}

        {/* 🚀 Active Filter Indicator Pill */}
        {((selectedZone && selectedZone !== 'all') || (categoryFilter && categoryFilter !== 'all')) && !expanded && (
          <div className="mt-2 flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-900/90 text-white rounded-full text-xs font-bold shadow-lg backdrop-blur-md border border-slate-700 max-w-fit mx-auto animate-fade-in">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400">📍</span>
              <span>
                {categoryFilter !== 'all' ? categoryFilter : 'كافة الأنشطة'}
                {' • '}
                {selectedZone && selectedZone !== 'all' ? `منطقة ${selectedZone}` : 'نطاق المدينة كاملة'}
              </span>
              {typeof filteredBusinessesCount === 'number' && (
                <span className="text-[10px] bg-amber-500/25 text-amber-300 px-2 py-0.5 rounded-full mr-1 font-mono">
                  {filteredBusinessesCount} نشاط
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                onSelectZone?.('');
                onCategoryChange?.('all');
                onSearchModeChange('browse');
              }}
              className="w-4 h-4 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer mr-1"
              title="إلغاء الفلتر وعرض الخريطة كاملة"
              aria-label="إلغاء الفلتر"
            >
              <X size={10} />
            </button>
          </div>
        )}

        {/* 🏷️ Quick Category Horizontal Scrollable Chips (Instant City-Wide / Zone Discovery) */}
        {!expanded && !showSuggestions && !buildingNumber && (
          <div className="mt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5 max-w-full">
            {categories.slice(0, 8).map((cat) => {
              const isActive = (cat.id === 'all' && (!categoryFilter || categoryFilter === 'all')) || categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onCategoryChange?.(cat.id === categoryFilter ? 'all' : cat.id);
                    onSearchModeChange('browse');
                  }}
                  className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 border border-amber-400 shadow-amber-500/20'
                      : 'bg-white/95 backdrop-blur-md text-slate-700 hover:bg-white hover:text-slate-950 border border-slate-200'
                  }`}
                >
                  <span className="text-xs">{cat.icon || '📍'}</span>
                  <span>{cat.name.split(' ')[0]}</span>
                  {typeof (cat as any).count === 'number' && (cat as any).count > 0 && (
                    <span className={`text-[10px] px-1 rounded-full ${isActive ? 'bg-slate-950/15 text-slate-950' : 'bg-slate-100 text-slate-500'}`}>
                      {(cat as any).count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {buildingNumber && (
          <div aria-label="موقع المبنى" className="mt-2 w-fit rounded-full bg-white/95 border border-slate-200 px-3 py-1.5 text-xs text-slate-700 shadow-sm font-bold">
            منطقة {selectedZone} ← مبنى {buildingNumber}
          </div>
        )}
      </div>
    </div>
  );
};
