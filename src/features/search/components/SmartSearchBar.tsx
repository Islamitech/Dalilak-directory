import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Compass } from 'lucide-react';
import { Business } from '../../../types';
import { EGYPT_GOVERNORATES } from '../../../data/mockData';
import { matchesBusinessSearch } from '../../../utils/arabicSearch';
import { SearchField } from '../../../shared/ui';
import {
  getRecentSearches,
  saveRecentSearchTerm,
  clearRecentSearchesList,
} from '../model/recentSearches';
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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  const addRecent = (term: string) => {
    setRecentSearches((prev) => saveRecentSearchTerm(term, prev));
  };

  const handleClear = () => {
    clearRecentSearchesList();
    setRecentSearches([]);
  };

  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return [];
    const q = searchQuery.toLowerCase().trim();
    return businesses.filter((b) => matchesBusinessSearch(b, q)).slice(0, 5);
  }, [searchQuery, businesses]);

  const handleSubmit = (e?: React.FormEvent, term = searchQuery) => {
    if (e) e.preventDefault();
    if (term.trim()) addRecent(term.trim());
    setIsFocused(false);
    if (onSearchSubmit) onSearchSubmit();
  };

  const handleSelectQuery = (term: string) => {
    onSearchChange(term);
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
            value={searchQuery}
            onChange={(val) => onSearchChange(val)}
            onFocus={() => setIsFocused(true)}
            onClear={() => onSearchChange('')}
            className="flex-1"
          />

          <button
            type="submit"
            className="md:hidden bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black min-h-11 px-3.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center shrink-0"
            aria-label="تنفيذ البحث"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 md:w-auto shrink-0 pt-1 md:pt-0 border-t md:border-t-0 md:border-inline-start border-slate-200/60 md:ps-1.5">
          <select
            value={selectedCity && selectedCity !== 'all' ? selectedCity : selectedGov}
            onChange={(e) => {
              const val = e.target.value;
              if (['حدائق الأهرام', 'مدينة 6 أكتوبر', 'مدينة الشيخ زايد', 'الهرم', 'فيصل'].includes(val)) {
                onGovChange('الجيزة');
                onCityChange(val);
              } else {
                onGovChange(val);
                onCityChange('all');
              }
            }}
            className="min-h-11 flex-1 md:w-44 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
            aria-label="اختر النطاق الجغرافي"
            style={{ colorScheme: 'light' }}
          >
            <option value="حدائق الأهرام" className="bg-white text-slate-900 font-bold">حدائق الأهرام (الافتراضي)</option>
            <option value="all" className="bg-white text-slate-900 font-bold">كل محافظات مصر</option>
            <option value="الجيزة" className="bg-white text-slate-900 font-bold">محافظة الجيزة (الكل)</option>
            <option value="مدينة 6 أكتوبر" className="bg-white text-slate-900 font-bold">مدينة 6 أكتوبر</option>
            <option value="مدينة الشيخ زايد" className="bg-white text-slate-900 font-bold">مدينة الشيخ زايد</option>
            <option value="الهرم" className="bg-white text-slate-900 font-bold">شارع الهرم</option>
            <option value="فيصل" className="bg-white text-slate-900 font-bold">شارع فيصل</option>
            <option value="القاهرة" className="bg-white text-slate-900 font-bold">محافظة القاهرة</option>
            <option value="الإسكندرية" className="bg-white text-slate-900 font-bold">محافظة الإسكندرية</option>
            {EGYPT_GOVERNORATES.filter((g) => g !== 'الجيزة' && g !== 'القاهرة' && g !== 'الإسكندرية').map((gov) => (
              <option key={gov} value={gov} className="bg-white text-slate-900 font-bold">{gov}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={onRequestLocation}
            disabled={isLocatingUser}
            className={`min-h-11 px-2.5 py-1 rounded-lg text-[10.5px] font-black flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
              userCoords
                ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                : 'bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200'
            }`}
            title="تحديد مكاني الحالي عبر GPS"
            aria-label="تحديد مكاني الحالي"
          >
            <Compass className={`w-3 h-3 ${isLocatingUser ? 'animate-spin text-amber-600' : userCoords ? 'text-emerald-600' : 'text-slate-500'}`} />
            <span>{userCoords ? 'موقعي نشط' : 'قربي'}</span>
          </button>
        </div>

        <button
          type="submit"
          className="hidden md:flex bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer items-center justify-center gap-1.5 shrink-0"
        >
          <Search className="w-4 h-4" />
          <span>بحث</span>
        </button>
      </form>

      {isFocused && (
        <SearchSuggestionsDropdown
          suggestions={suggestions}
          recentSearches={recentSearches}
          searchQuery={searchQuery}
          onSelectBusiness={onSelectBusiness}
          onSelectQuery={handleSelectQuery}
          onClearRecent={handleClear}
        />
      )}
    </div>
  );
};
