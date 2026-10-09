import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { Chip, Pressable } from '../../../shared/ui';

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
  compact?: boolean;
}

const MENU_WIDTH = 208;
const MENU_MARGIN = 8;

function placeMenu(trigger: HTMLElement): { top: number; left: number; width: number } {
  const rect = trigger.getBoundingClientRect();
  const width = Math.min(MENU_WIDTH, window.innerWidth - MENU_MARGIN * 2);
  let left = rect.right - width;
  left = Math.max(MENU_MARGIN, Math.min(left, window.innerWidth - MENU_MARGIN - width));
  let top = rect.bottom + 6;
  if (top + 256 > window.innerHeight - MENU_MARGIN) {
    top = Math.max(MENU_MARGIN, rect.top - 6 - 256);
  }
  return { top, left, width };
}

export const FilterDropdownMenu: React.FC<FilterDropdownMenuProps> = ({
  displayValue,
  options,
  selectedValue,
  isOpen,
  onToggle,
  onSelect,
  ariaLabel,
  maxLabelWidthClass = 'max-w-[120px]',
  compact = false,
}) => {
  const isSelected = selectedValue !== 'all';
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!isOpen) {
      setBox(null);
      return;
    }
    const update = () => {
      if (triggerRef.current) setBox(placeMenu(triggerRef.current));
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <Chip
        ref={triggerRef}
        active={isSelected}
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={compact ? 'px-3! gap-1! text-caption!' : 'px-3!'}
        trailing={
          <ChevronDown
            size={compact ? 12 : 14}
            aria-hidden="true"
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--brand)]' : 'text-slate-400'}`}
          />
        }
      >
        <span className={`block truncate ${maxLabelWidthClass}`}>{displayValue}</span>
      </Chip>

      {isOpen && box && createPortal(
        <div
          role="listbox"
          aria-label={ariaLabel}
          onPointerDown={(event) => event.stopPropagation()}
          style={{ top: box.top, left: box.left, width: box.width }}
          className="fixed z-[1300] max-h-64 overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white/98 py-1.5 shadow-xl backdrop-blur-md divide-y divide-slate-50"
        >
          {options.map((opt) => {
            const isOptSelected = selectedValue === opt.id;
            return (
              <Pressable
                key={opt.id}
                type="button"
                role="option"
                aria-selected={isOptSelected}
                onClick={() => onSelect(opt.id)}
                className={`flex min-h-11 w-full cursor-pointer items-center justify-between px-3.5 py-2 text-start text-caption font-bold transition-colors ${
                  isOptSelected
                    ? 'bg-amber-500/15 font-extrabold text-amber-950'
                    : 'text-slate-700 hover:bg-amber-50 hover:text-amber-900'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isOptSelected && <Check size={14} className="shrink-0 text-amber-600" />}
              </Pressable>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
};
