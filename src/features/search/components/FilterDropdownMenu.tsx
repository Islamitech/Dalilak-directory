import React from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface FilterDropdownOption {
  id: string;
  label: string;
}

export interface FilterDropdownMenuProps {
  label: string;
  displayValue: string;
  options: FilterDropdownOption[];
  selectedValue: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  ariaLabel: string;
  menuWidthClass?: string;
  maxLabelWidthClass?: string;
}

export const FilterDropdownMenu: React.FC<FilterDropdownMenuProps> = ({
  displayValue,
  options,
  selectedValue,
  isOpen,
  onToggle,
  onSelect,
  ariaLabel,
  menuWidthClass = 'w-52 sm:w-60',
  maxLabelWidthClass = 'max-w-[120px]',
}) => {
  const isSelected = selectedValue !== 'all';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={`h-10 px-3 sm:px-3.5 rounded-full border border-transparent flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95 ${
          isSelected
            ? 'bg-amber-500/15 text-amber-900 font-extrabold'
            : 'bg-transparent text-slate-700 hover:bg-white/20 hover:text-amber-800'
        }`}
      >
        <span className={`truncate ${maxLabelWidthClass}`}>{displayValue}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-600' : 'text-slate-400'}`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute top-full start-0 mt-1.5 ${menuWidthClass} bg-white/98 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 py-1.5 z-[1100] max-h-64 overflow-y-auto overscroll-contain animate-fade-in divide-y divide-slate-50`}
        >
          {options.map((opt) => {
            const isOptSelected = selectedValue === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={isOptSelected}
                onClick={() => onSelect(opt.id)}
                className={`w-full px-3.5 py-2 text-start text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                  isOptSelected
                    ? 'bg-amber-500/15 text-amber-950 font-extrabold'
                    : 'text-slate-700 hover:bg-amber-50 hover:text-amber-900'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isOptSelected && <Check size={14} className="text-amber-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
