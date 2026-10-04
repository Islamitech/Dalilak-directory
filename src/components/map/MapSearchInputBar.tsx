import React, { RefObject } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

export interface MapSearchInputBarProps {
  inputRef: RefObject<HTMLInputElement | null>;
  searchQuery: string;
  onSearchQueryChange?: (q: string) => void;
  onFocus: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isExecutingSearch: boolean;
}

export const MapSearchInputBar: React.FC<MapSearchInputBarProps> = ({
  inputRef,
  searchQuery,
  onSearchQueryChange,
  onFocus,
  onSubmit,
  isExecutingSearch,
}) => {
  return (
    <form onSubmit={onSubmit} className="flex-1 min-w-0 flex items-center gap-1.5 px-2">
      <input
        ref={inputRef as any}
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchQueryChange?.(e.target.value)}
        onFocus={onFocus}
        placeholder="على ماذا تبحث ..."
        aria-label="البحث عن نشاط أو مبنى"
        className="w-full bg-transparent border-none outline-none text-base sm:text-sm font-bold text-slate-800 placeholder-slate-400 h-11"
        enterKeyHint="search"
        autoComplete="off"
      />
      {searchQuery.trim() && (
        <button
          type="button"
          onClick={() => onSearchQueryChange?.('')}
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
        {isExecutingSearch ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} strokeWidth={2.5} />}
      </button>
    </form>
  );
};
