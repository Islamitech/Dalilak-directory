import React from 'react';
import { Search } from 'lucide-react';

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onSubmit?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  'aria-label'?: string;
  icon?: React.ReactNode;
  inputMode?: 'search' | 'text' | 'numeric' | 'tel' | 'url' | 'email' | 'decimal';
  disabled?: boolean;
}

export const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  (
    {
      value,
      onChange,
      placeholder = 'ابحث عن نشاط أو خدمة أو شارع...',
      onClear,
      onSubmit,
      onKeyDown,
      onFocus,
      onBlur,
      className = '',
      inputClassName = '',
      autoFocus = false,
      'aria-label': ariaLabel = 'البحث في الدليل',
      icon,
      inputMode = 'search',
      disabled = false,
    },
    ref
  ) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e);
      if (e.key === 'Enter') {
        onSubmit?.();
      }
    };

    return (
      <div className={`relative flex items-center w-full search-field group ${className}`}>
        {/* Search Icon */}
        <span
          aria-hidden="true"
          className="s-icon absolute start-3.5 text-slate-400 group-focus-within:text-amber-500 pointer-events-none select-none flex items-center justify-center transition-colors"
        >
          {icon || <Search className="w-4 h-4 stroke-[2.2]" />}
        </span>

        {/* Input */}
        <input
          ref={ref}
          type="search"
          role="searchbox"
          id="searchInput"
          aria-label={ariaLabel}
          dir="auto"
          autoFocus={autoFocus}
          disabled={disabled}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`search-input w-full h-12 pe-11 ps-11 rounded-[14px] bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-slate-900 placeholder-slate-400 text-sm font-medium border border-transparent focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${inputClassName}`}
        />

        {/* Clear Button (44px touch target with 24px inner circular icon) */}
        {value.trim().length > 0 && (
          <button
            type="button"
            id="searchClear"
            aria-label="مسح نص البحث"
            onClick={() => {
              onChange('');
              onClear?.();
            }}
            className="search-clear show absolute end-1 w-11 h-11 flex items-center justify-center cursor-pointer transition-transform active:scale-95"
          >
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 hover:bg-rose-500 hover:text-white flex items-center justify-center text-xs font-bold transition-colors">
              ✕
            </span>
          </button>
        )}
      </div>
    );
  }
);

SearchField.displayName = 'SearchField';
