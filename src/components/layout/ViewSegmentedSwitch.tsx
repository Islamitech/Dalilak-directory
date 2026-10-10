import React, { useRef } from 'react';
import { Pressable } from '../../shared/ui';
import { Map as MapIcon, List as ListIcon } from 'lucide-react';

export type DirectoryViewMode = 'map' | 'list';

export interface ViewSegmentedSwitchProps {
  activeView: DirectoryViewMode;
  onViewChange: (view: DirectoryViewMode) => void;
  className?: string;
  size?: 'sm' | 'md';
}

const OPTIONS: Array<{ view: DirectoryViewMode; label: string; ariaLabel: string; Icon: typeof MapIcon }> = [
  { view: 'map', label: 'خريطة', ariaLabel: 'الخريطة التفاعلية', Icon: MapIcon },
  { view: 'list', label: 'قائمة', ariaLabel: 'قائمة الأنشطة', Icon: ListIcon },
];

/**
 * 🎛️ ViewSegmentedSwitch
 *
 * Map/list segmented control. The compact size is a tight pair of radios,
 * visually separate from the filter chips.
 */
export const ViewSegmentedSwitch: React.FC<ViewSegmentedSwitchProps> = ({
  activeView,
  onViewChange,
  className = '',
  size = 'md',
}) => {
  const isSm = size === 'sm';
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = OPTIONS.findIndex((o) => o.view === activeView);
    let next = current;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      next = (current + 1) % OPTIONS.length;
    } else if (e.key === 'Home') {
      next = 0;
    } else if (e.key === 'End') {
      next = OPTIONS.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    onViewChange(OPTIONS[next].view);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label="طريقة العرض"
      data-view-switch=""
      onKeyDown={handleKeyDown}
      className={`relative inline-flex items-center p-0.5 rounded-pill select-none bg-[var(--logo-silver-2)] ${className}`}
    >
      <div
        aria-hidden="true"
        className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-pill bg-[var(--logo-ink-0)] transition-[inset-inline-start] duration-300 ease-out pointer-events-none ${
          activeView === 'map' ? 'start-0.5' : 'start-[50%]'
        }`}
      />

      {OPTIONS.map(({ view, label, ariaLabel, Icon }, i) => {
        const checked = activeView === view;
        return (
          <Pressable
            key={view}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={ariaLabel}
            tabIndex={checked ? 0 : -1}
            onClick={() => onViewChange(view)}
            className={`relative z-10 inline-flex items-center justify-center rounded-pill cursor-pointer font-extrabold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] min-h-11 ${
              isSm ? 'w-[4.6rem] gap-1 px-2 text-caption' : 'w-[6.2rem] gap-1.5 text-label'
            } ${checked ? 'text-[var(--logo-gold-1)]' : 'text-[var(--logo-ink-0)] hover:text-[var(--logo-ink-2)]'}`}
          >
            <Icon className={isSm ? 'w-3 h-3 stroke-[2.4]' : 'w-4 h-4 stroke-[2.2]'} aria-hidden="true" />
            <span>{label}</span>
          </Pressable>
        );
      })}
    </div>
  );
};
