import React from 'react';

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  className?: string;
  autoFocus?: boolean;
  'aria-label'?: string;
}

export const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  (
    {
      value,
      onChange,
      placeholder = 'ابحث عن نشاط أو خدمة أو شارع...',
      onClear,
      className = '',
      autoFocus = false,
      'aria-label': ariaLabel = 'حقل البحث في الدليل',
    },
    ref
  ) => {
    return (
      <div className={`relative flex items-center w-full ${className}`}>
        {/* Search Icon */}
        <span
          aria-hidden="true"
          className="absolute start-4 text-slate-400 pointer-events-none select-none text-base"
        >
          🔍
        </span>

        {/* Input */}
        <input
          ref={ref}
          type="search"
          role="searchbox"
          aria-label={ariaLabel}
          dir="auto"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 pe-11 ps-11 rounded-2xl bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 placeholder-slate-400 text-sm font-medium border border-slate-200/80 focus:border-amber-400 focus:outline-none focus:ring-3 focus:ring-amber-500/20 transition-all duration-200"
        />

        {/* Clear Button */}
        {value.trim().length > 0 && (
          <button
            type="button"
            aria-label="مسح نص البحث"
            onClick={() => {
              onChange('');
              onClear?.();
            }}
            className="absolute end-2.5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    );
  }
);

SearchField.displayName = 'SearchField';
