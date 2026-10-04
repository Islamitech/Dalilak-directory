import { parseActivitySearchIntent } from '../../utils/activitySearchIntent';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { resolveCategorySelection } from '../../utils/categoryMatcher';
import { getBusinessHadayekZoneLetter, isBusinessInHadayekZone } from '../../utils/hadayekZoneHelper';
import { getMapBusinessSearchMatches } from '../../utils/mapSearch';
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
  searchableBusinesses?: Business[];
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
  searchableBusinesses,
  onSelectBuilding,
  onSelectBusiness,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isExecutingSearch, setIsExecutingSearch] = useState(false);

  const barContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const regionRef = useRef<HTMLSelectElement>(null);

  const categories: Array<{id: string; name: string; icon: string; count?: number}> = (quickCategories?.length ? quickCategories : MAP_QUICK_CATEGORIES).map(category => {
    const selection = resolveCategorySelection(category.id);
    return { ...category, id: selection.subcategoryId !== 'all' ? selection.subcategoryId : selection.mainCategoryId };
  });

  const hasFilters = categoryFilter !== 'all' || Boolean(selectedZone && selectedZone !== 'all');
  const open = () => { setExpanded(true); setShowSuggestions(false); };

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
    if (!searchQuery.trim() || buildingMatch) return [];
    return getMapBusinessSearchMatches(searchableBusinesses || businesses, searchQuery, 5);
  }, [searchQuery, businesses, searchableBusinesses, buildingMatch]);

  const outsideSelectedZoneBusinesses = useMemo(() => {
    if (!selectedZone || selectedZone === 'all') return [];
    return matchingBusinesses.filter((biz) => !isBusinessInHadayekZone(biz, selectedZone));
  }, [matchingBusinesses, selectedZone]);

  const activityIntent = useMemo(() => parseActivitySearchIntent(searchQuery), [searchQuery]);

  // 3b. Candidate categories matching search query (City-wide scope)
  const matchingCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2 || buildingMatch) return [];
    if (activityIntent) return [{ id: activityIntent.category, name: searchQuery.trim(), icon: '🔎' }];
    return categories.filter((c) => c.id !== 'all' && (c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)));
  }, [searchQuery, categories, buildingMatch, activityIntent]);

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
      onSelectZone?.(activityIntent?.zone === 'all' || !activityIntent ? '' : activityIntent.zone);
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
        setExpanded(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport || !barContainerRef.current) return;
    const updateKeyboardInset = () => {
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      barContainerRef.current?.style.setProperty('--map-keyboard-height', `${inset}px`);
    };
    updateKeyboardInset();
    viewport.addEventListener('resize', updateKeyboardInset);
    viewport.addEventListener('scroll', updateKeyboardInset);
    return () => {
      viewport.removeEventListener('resize', updateKeyboardInset);
      viewport.removeEventListener('scroll', updateKeyboardInset);
    };
  }, []);

  return (
    <div dir="rtl" className="absolute top-3 inset-x-3 sm:inset-x-5 z-[1000] pointer-events-none map-top-safe-area">
      <div onKeyDown={(e) => { if (e.key === 'Escape') { setExpanded(false); setShowSuggestions(false); } }} ref={barContainerRef} className="relative max-w-2xl mx-auto pointer-events-auto">
        <div className="flex items-center gap-1 min-h-12 px-1.5 bg-white/95 border border-slate-200 rounded-full shadow-sm">
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls="map-filter-panel"
            aria-label={expanded ? 'إغلاق أدوات البحث' : 'فتح البحث والفلاتر'}
            onClick={() => (expanded ? setExpanded(false) : open())}
            className="relative shrink-0 min-w-11 min-h-11 flex items-center justify-center text-amber-600 cursor-pointer"
          >
            <SlidersHorizontal size={20} />
            {hasFilters && <span className="absolute top-2 end-2 w-2 h-2 rounded-full bg-amber-500" />}
          </button>

            <form onSubmit={handleSearchSubmit} className="flex-1 min-w-0 flex items-center gap-1.5 px-2">
              <input
                ref={inputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  onSearchQueryChange?.(e.target.value);
                  setShowSuggestions(true); setExpanded(false);
                }}
                onFocus={() => { setShowSuggestions(true); setExpanded(false); }}
                placeholder="على ماذا تبحث ..."
                aria-label="البحث عن نشاط أو مبنى"
                className="w-full bg-transparent border-none outline-none text-base sm:text-sm font-bold text-slate-800 placeholder-slate-400 h-11"
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
                  className="min-w-11 min-h-11 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0"
                  title="مسح"
                >
                  <X size={15} />
                </button>
              )}
              <button
                type="submit"
                disabled={isExecutingSearch || !searchQuery.trim()}
                className="min-w-11 min-h-11 flex items-center justify-center rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shrink-0 shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>

        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="group" aria-label="فلاتر سريعة لنوع النشاط">
          {categories.filter(c => c.id !== 'all').slice(0, 8).map(cat => (
            <button
              key={cat.id}
              type="button"
              aria-pressed={categoryFilter === cat.id}
              onClick={() => { onCategoryChange?.(categoryFilter === cat.id ? 'all' : cat.id); onSearchModeChange('browse'); }}
              className={`min-h-11 shrink-0 rounded-full border px-3 text-xs font-bold shadow-sm ${categoryFilter === cat.id ? 'border-amber-500 bg-amber-500 text-slate-950' : 'border-slate-200 bg-white/95 text-slate-700'}`}
            >{cat.icon} {cat.name}</button>
          ))}
        </div>

        {expanded && (
          <section id="map-filter-panel" aria-label="فلاتر الخريطة" className="mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl max-h-[60dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3"><h2 className="font-bold text-slate-900">فلاتر الخريطة</h2><button type="button" aria-label="إغلاق الفلاتر" onClick={() => setExpanded(false)} className="p-2"><X size={18}/></button></div>
            <label className="block text-sm font-bold text-slate-700">المنطقة
              <select ref={regionRef} value={selectedZone === 'all' ? '' : selectedZone} onChange={(e) => onSelectZone?.(e.target.value)} className="block w-full mt-2 mb-4 border border-slate-200 rounded-xl p-2 bg-white">
                <option value="">كل المدينة</option>
                {HADAYEK_OFFICIAL_DISTRICTS.map(d => <option key={d.id} value={d.letterAr}>منطقة {d.letterAr}</option>)}
              </select>
            </label>
            <p className="text-sm font-bold text-slate-700 mb-2">نوع النشاط</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="group" aria-label="نوع النشاط">
              {categories.filter(c => c.id !== 'all').map(cat => <button key={cat.id} type="button" aria-pressed={categoryFilter === cat.id} onClick={() => { onCategoryChange?.(categoryFilter === cat.id ? 'all' : cat.id); onSearchModeChange('browse'); }} className={`min-h-11 text-sm rounded-xl border px-3 py-2 text-right ${categoryFilter === cat.id ? 'bg-amber-50 border-amber-500 text-amber-900' : 'bg-white border-slate-200 text-slate-700'}`}>{cat.icon} {cat.name}{typeof cat.count === 'number' && <span className="text-xs me-1">({cat.count})</span>}</button>)}
            </div>
            <p className="text-xs text-slate-500 mt-3" role="status">{categoryFilter === 'all' ? 'اختر نوع النشاط لعرض مواقعه على الخريطة' : `${filteredBusinessesCount ?? 0} نشاط مطابق`}</p>
            <div className="flex items-center justify-between gap-2 mt-4">
              <button type="button" onClick={() => { onSelectZone?.(''); onCategoryChange?.('all'); onSearchQueryChange?.(''); onSearchModeChange('browse'); }} className="text-sm p-2 text-slate-600">مسح الفلاتر</button>
              <button type="button" onClick={() => setExpanded(false)} className="rounded-xl bg-amber-500 px-4 py-2 font-bold text-slate-950">عرض الخريطة</button>
            </div>
            {selectedZone && selectedZone !== 'all' && <details className="mt-3 text-sm"><summary className="cursor-pointer p-2">البحث عن مبنى في المنطقة</summary>{children}</details>}
          </section>
        )}

        {/* 📋 Live Search Results Dropdown */}
        {showSuggestions && searchQuery.trim() && !expanded && (
          <div className="absolute top-full inset-x-0 mt-2 bg-white/98 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-[1000] max-h-[calc(100dvh-var(--map-keyboard-height,0px)-6rem)] overflow-y-auto divide-y divide-slate-100 font-['Cairo',sans-serif]">
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

            {outsideSelectedZoneBusinesses.map((biz) => {
              const zoneLetter = getBusinessHadayekZoneLetter(biz);
              return (
                <button
                  key={`all-zones-${biz.id}`}
                  type="button"
                  onClick={() => {
                    onSelectZone?.('');
                    onSelectBusiness?.(biz);
                    setShowSuggestions(false);
                  }}
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
                  onSelectZone?.(activityIntent?.zone === 'all' || !activityIntent ? '' : activityIntent.zone);
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
