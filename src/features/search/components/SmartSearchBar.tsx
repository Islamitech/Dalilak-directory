import React, { useState, useRef } from 'react';
import { Compass } from 'lucide-react';
import { Business } from '../../../types';
import { EGYPT_GOVERNORATES } from '../../../data/mockData';
import { SearchField } from '../../../shared/ui';
import { useUnifiedSearch } from '../hooks/useUnifiedSearch';
import { SearchSuggestionsDropdown } from './SearchSuggestionsDropdown';

export interface SmartSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedGov: string;
  onGovChange: (gov: string) => void;
  selectedCity?: string;
  onCityChange?: (city: string) => void;
  userCoords: { lat: number; lng: number } | null;
  isLocatingUser: boolean;
  onRequestLocation: () => void;
  businesses: Business[];
  onSelectBusiness?: (business: Business) => void;
  onSearchSubmit?: () => void;
  compact?: boolean;
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedGov,
  onGovChange,
  selectedCity,
  onCityChange = () => {},
  userCoords,
  isLocatingUser,
  onRequestLocation,
  businesses,
  onSelectBusiness,
  onSearchSubmit,
  compact = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useUnifiedSearch<Business>({
    initialQuery: searchQuery,
    onQueryChange: onSearchChange,
    items: businesses,
    getItemSearchText: (b) => `${b.nameAr || ''} ${b.nameEn || ''} ${b.category || ''} ${b.description || ''}`,
  });

  const suggestions = search.query.trim().length >= 2 ? search.searchResults.slice(0, 5) : [];

  const handleSubmit = (e?: React.FormEvent, term = search.query) => {
    if (e) e.preventDefault();
    if (term.trim()) search.saveRecent(term.trim());
    setIsFocused(false);
    if (onSearchSubmit) onSearchSubmit();
  };

  const handleSelectQuery = (term: string) => {
    search.setQuery(term);
    handleSubmit(undefined, term);
  };

  return (
    <div
      className={`relative w-full ${compact ? 'max-w-3xl' : 'max-w-4xl'} mx-auto`}
      ref={containerRef}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsFocused(false);
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--bg-card)] border-2 border-amber-500/30 hover:border-amber-500/60 focus-within:border-amber-500 rounded-2xl p-1.5 sm:p-2 shadow-lg shadow-amber-500/5 backdrop-blur-md transition-all flex flex-col md:flex-row items-stretch md:items-center gap-1.5"
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <SearchField
            aria-label="ابحث عن نشاط أو خدمة"
            placeholder="ابحث عن مطعم، طبيب، صيدلية، خدمة..."
            value={search.query}
            onChange={(val) => search.setQuery(val)}
            onFocus={() => setIsFocused(true)}
            onClear={() => search.clearQuery()}
            className="flex-1"
          />
        </div>

        {/* Location selectors and GPS trigger */}
        <div className="flex items-center gap-1.5 border-t md:border-t-0 md:border-s border-[var(--border-color)] pt-1.5 md:pt-0 md:ps-1.5">
          <div className="relative flex-1 md:w-36">
            <select
              aria-label="اختر المحافظة"
              value={selectedGov}
              onChange={(e) => {
                onGovChange(e.target.value);
                const firstCity = EGYPT_GOVERNORATES[e.target.value]?.[0] || 'all';
                onCityChange(firstCity);
              }}
              className="w-full bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)] text-[var(--text-primary)] font-bold text-xs py-2.5 px-3 rounded-xl border border-transparent hover:border-[var(--border-color)] transition-all cursor-pointer truncate"
            >
              <option value="all">كل المحافظات</option>
              {Object.keys(EGYPT_GOVERNORATES).map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
          </div>

          {selectedGov !== 'all' && EGYPT_GOVERNORATES[selectedGov] && (
            <div className="relative flex-1 md:w-36">
              <select
                aria-label="اختر المدينة أو المنطقة"
                value={selectedCity || 'all'}
                onChange={(e) => onCityChange(e.target.value)}
                className="w-full bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)] text-[var(--text-primary)] font-bold text-xs py-2.5 px-3 rounded-xl border border-transparent hover:border-[var(--border-color)] transition-all cursor-pointer truncate"
              >
                <option value="all">كل المناطق</option>
                {EGYPT_GOVERNORATES[selectedGov].map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={onRequestLocation}
            disabled={isLocatingUser}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
              userCoords
                ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent'
            }`}
            title="تحديد موقعي لترتيب الأنشطة حسب الأقرب"
            aria-label="تحديد موقعي"
          >
            <Compass className={`w-4 h-4 ${isLocatingUser ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          <button
            type="submit"
            className="hidden sm:inline-flex bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
          >
            بحث
          </button>
        </div>
      </form>

      {isFocused && (
        <SearchSuggestionsDropdown
          searchQuery={search.query}
          recentSearches={search.recentSearches}
          suggestions={suggestions}
          onSelectQuery={handleSelectQuery}
          onSelectBusiness={(biz) => {
            setIsFocused(false);
            search.saveRecent(biz.nameAr);
            if (onSelectBusiness) onSelectBusiness(biz);
          }}
          onClearRecent={search.clearRecent}
        />
      )}
    </div>
  );
};
