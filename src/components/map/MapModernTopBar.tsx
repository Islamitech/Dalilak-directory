import React, { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Business } from '../../types';
import { searchBuildingCoordinatesExact } from '../../data/hadayekAtlasData';
import { MapSearchInputBar } from './MapSearchInputBar';
import { MapSearchSuggestionsDropdown } from './MapSearchSuggestionsDropdown';
import { MapFilterPanel } from './MapFilterPanel';
import { useMapSearchMatches } from '../../features/map';

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
  searchQuery = '', onSearchQueryChange, selectedZone = '', onSelectZone,
  categoryFilter = 'all', onCategoryChange, quickCategories, filteredBusinessesCount,
  onSearchModeChange, children, buildingNumber, businesses = [], searchableBusinesses,
  onSelectBuilding, onSelectBusiness,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isExecutingSearch, setIsExecutingSearch] = useState(false);

  const barContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const regionRef = useRef<HTMLSelectElement>(null);

  const {
    categories,
    buildingMatch,
    digitOnlyMatches,
    matchingBusinesses,
    outsideSelectedZoneBusinesses,
    activityIntent,
    matchingCategories,
    matchingZone,
  } = useMapSearchMatches({
    searchQuery,
    selectedZone,
    businesses,
    searchableBusinesses,
    quickCategories,
  });

  const hasFilters = categoryFilter !== 'all' || Boolean(selectedZone && selectedZone !== 'all');

  const [bldgError, setBldgError] = useState<string | null>(null);

  const handleSelectBuildingItem = async (zoneLetter: string, bldgNum: string) => {
    setIsExecutingSearch(true);
    setShowSuggestions(false);
    setBldgError(null);
    try {
      const coords = await searchBuildingCoordinatesExact(zoneLetter, bldgNum);
      if (coords && onSelectBuilding) {
        onSelectBuilding({ buildingNumber: bldgNum, zoneLetter, lat: coords.lat, lng: coords.lng });
      } else if (!coords) {
        setBldgError(`عمارة ${bldgNum} بمنطقة (${zoneLetter}) غير مسجلة في قاعدة البيانات المساحية`);
      }
    } finally {
      setIsExecutingSearch(false);
    }
  };

  const handleSelectBusinessItem = (biz: Business) => {
    setShowSuggestions(false);
    if (onSelectBusiness) onSelectBusiness(biz);
  };

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

  return (
    <div dir="rtl" className="absolute top-3 inset-x-3 sm:inset-x-5 z-[1000] pointer-events-none map-top-safe-area">
      <div
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setExpanded(false);
            setShowSuggestions(false);
          }
        }}
        ref={barContainerRef}
        className="relative max-w-2xl mx-auto pointer-events-auto"
      >
        <div className="flex items-center gap-1 min-h-12 px-1.5 bg-white/95 border border-slate-200 rounded-full shadow-sm">
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls="map-filter-panel"
            aria-label={expanded ? 'إغلاق أدوات البحث' : 'فتح البحث والفلاتر'}
            onClick={() => {
              if (expanded) setExpanded(false);
              else {
                setExpanded(true);
                setShowSuggestions(false);
              }
            }}
            className="relative shrink-0 min-w-11 min-h-11 flex items-center justify-center text-amber-600 cursor-pointer"
          >
            <SlidersHorizontal size={20} />
            {hasFilters && <span className="absolute top-2 end-2 w-2 h-2 rounded-full bg-amber-500" />}
          </button>

          <MapSearchInputBar
            inputRef={inputRef}
            searchQuery={searchQuery}
            onSearchQueryChange={onSearchQueryChange}
            onFocus={() => {
              setShowSuggestions(true);
              setExpanded(false);
            }}
            onSubmit={handleSearchSubmit}
            isExecutingSearch={isExecutingSearch}
          />
        </div>

        {expanded && (
          <MapFilterPanel
            regionRef={regionRef}
            selectedZone={selectedZone}
            onSelectZone={onSelectZone}
            categoryFilter={categoryFilter}
            onCategoryChange={onCategoryChange}
            onSearchModeChange={onSearchModeChange}
            categories={categories}
            filteredBusinessesCount={filteredBusinessesCount}
            onClearFilters={() => {
              onSelectZone?.('');
              onCategoryChange?.('all');
              onSearchQueryChange?.('');
              onSearchModeChange('browse');
            }}
            onClose={() => setExpanded(false)}
          >
            {children}
          </MapFilterPanel>
        )}

        {showSuggestions && searchQuery.trim() && !expanded && (
          <MapSearchSuggestionsDropdown
            searchQuery={searchQuery}
            buildingMatch={buildingMatch}
            digitOnlyMatches={digitOnlyMatches}
            matchingBusinesses={matchingBusinesses}
            outsideSelectedZoneBusinesses={outsideSelectedZoneBusinesses}
            matchingZone={matchingZone}
            matchingCategories={matchingCategories}
            activityIntent={activityIntent}
            onSelectBuildingItem={handleSelectBuildingItem}
            onSelectBusinessItem={handleSelectBusinessItem}
            onSelectZone={onSelectZone}
            onSelectOutsideZoneBusiness={(biz) => { onSelectZone?.(''); onSelectBusiness?.(biz); setShowSuggestions(false); }}
            onSelectCategoryItem={(catId, zone) => {
              onSelectZone?.(zone || '');
              onCategoryChange?.(catId);
              onSearchModeChange('browse');
              onSearchQueryChange?.('');
              setShowSuggestions(false);
            }}
          />
        )}

        {bldgError && (
          <div role="alert" className="mt-2 w-full rounded-xl bg-slate-900/90 text-white border border-slate-700 px-3.5 py-2 text-xs shadow-lg flex items-center justify-between gap-2 backdrop-blur-md">
            <span>{bldgError}</span>
            <button type="button" onClick={() => setBldgError(null)} className="text-slate-400 hover:text-white font-bold px-1.5 py-0.5 cursor-pointer">✕</button>
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
