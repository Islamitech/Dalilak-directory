import React from 'react';

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
      'aria-label': ariaLabel = 'حقل البحث في الدليل',
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
      <div className={`relative flex items-center w-full ${className}`}>
        {/* Search Icon */}
        <span
          aria-hidden="true"
          className="absolute start-3.5 text-slate-400 pointer-events-none select-none text-sm flex items-center justify-center"
        >
          {icon || '🔍'}
        </span>

        {/* Input */}
        <input
          ref={ref}
          type="search"
          role="searchbox"
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
          className={`w-full h-11 pe-10 ps-10 rounded-2xl bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 placeholder-slate-400 text-sm font-medium border border-slate-200/80 focus:border-amber-400 focus:outline-none focus:ring-3 focus:ring-amber-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${inputClassName}`}
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
            className="absolute end-2 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer text-xs"
          >
            ✕
          </button>
        )}
      </div>
    );
  }
);

SearchField.displayName = 'SearchField';
