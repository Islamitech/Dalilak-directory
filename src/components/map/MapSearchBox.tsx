import React from 'react';
import { Search, Loader2, X, MapPin } from 'lucide-react';
import { PlaceSearchResult } from '../../utils/geocoding';

export interface MapSearchBoxProps {
  searchQuery: string;
  isSearching: boolean;
  searchResults: PlaceSearchResult[];
  showSearchResults: boolean;
  setShowSearchResults: (show: boolean) => void;
  handleSearchChange: (text: string) => void;
  handleSelectSearchResult: (res: PlaceSearchResult) => void;
  handleClearSearch: () => void;
}

export const MapSearchBox: React.FC<MapSearchBoxProps> = ({
  searchQuery,
  isSearching,
  searchResults,
  showSearchResults,
  setShowSearchResults,
  handleSearchChange,
  handleSelectSearchResult,
  handleClearSearch,
}) => {
  return (
    <div
      dir="rtl"
      className="relative bg-white/95 backdrop-blur-md px-3 py-2 border-b border-slate-200 z-30"
    >
      <div className="relative flex items-center">
        <Search className="absolute start-3 w-4 h-4 text-amber-500 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => {
            if (searchResults.length > 0) setShowSearchResults(true);
          }}
          placeholder="🔍 ابحث عن اسم شارع أو ميدان، أو الصق إحداثيات أو رابط جوجل ماب مباشرة..."
          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl ps-9 pe-8 py-2 focus:outline-none focus:border-amber-500 focus:bg-white shadow-inner transition-colors"
        />
        {isSearching && (
          <Loader2 className="absolute end-8 w-4 h-4 text-amber-500 animate-spin" />
        )}
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute end-2.5 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer rounded-full hover:bg-slate-100 transition-colors"
            aria-label="مسح البحث"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSearchResults && searchResults.length > 0 && (
        <div className="absolute top-full inset-x-3 mt-1 bg-white/98 border border-slate-200 rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden z-40 max-h-60 overflow-y-auto divide-y divide-slate-100">
          {searchResults.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSearchResult(item)}
              className="w-full text-start p-3 hover:bg-amber-50 text-xs text-slate-800 transition-colors flex items-start gap-2 cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900">{item.displayName.split(',')[0]}</div>
                <div className="text-caption text-slate-500 line-clamp-1">{item.displayName}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
