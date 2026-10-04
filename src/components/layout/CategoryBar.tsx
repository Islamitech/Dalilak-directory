import React, { useRef, useState, useEffect } from 'react';
import { CATEGORY_GROUPS } from '../../shared/data/categories';

export interface CategoryBarProps {
  activeCategory: string;
  onSelectCategory: (categoryId: string) => void;
  className?: string;
}

/**
 * 🏷️ CategoryBar (Phase 2 - Prototype Specification)
 *
 * Horizontal scrollable category filter navigation with:
 * - Direction-agnostic scroll tracking (Chromium/WebKit/Firefox verified)
 * - Snap-scrolling filter chips with aria-pressed state
 * - Smooth start and end gradient edge fades using valid direction-safe utilities
 * - Full Arabic category group labels without truncation
 */
export const CategoryBar: React.FC<CategoryBarProps> = ({
  activeCategory,
  onSelectCategory,
  className = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) {
      setCanScrollStart(false);
      setCanScrollEnd(false);
      return;
    }

    // Direction-agnostic detection from computed style
    const computedDir = window.getComputedStyle(el).direction;
    const isRtl = computedDir === 'rtl';
    const absScroll = Math.abs(scrollLeft);

    if (isRtl) {
      setCanScrollStart(absScroll > 4);
      setCanScrollEnd(absScroll < maxScroll - 4);
    } else {
      setCanScrollStart(scrollLeft > 4);
      setCanScrollEnd(scrollLeft < maxScroll - 4);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const items = [
    { id: 'all', label: 'كافة الأنشطة', icon: '✨' },
    ...CATEGORY_GROUPS.map((g) => ({
      id: g.group,
      label: g.group,
      icon: g.icon,
    })),
  ];

  return (
    <nav
      aria-label="تصنيفات الأنشطة والخدمات"
      className={`relative w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200 ${className}`}
    >
      {/* Start Edge Fade (Start side: right in RTL, left in LTR) */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute start-0 top-0 bottom-0 w-8 z-10 transition-opacity duration-200 bg-gradient-to-r rtl:bg-gradient-to-l from-white dark:from-slate-900 to-transparent ${
          canScrollStart ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* End Edge Fade (End side: left in RTL, right in LTR) */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute end-0 top-0 bottom-0 w-8 z-10 transition-opacity duration-200 bg-gradient-to-l rtl:bg-gradient-to-r from-white dark:from-slate-900 to-transparent ${
          canScrollEnd ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Scrollable Chips Track */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 px-3 min-[380px]:px-4 sm:px-6 lg:px-8 py-2.5 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth"
      >
        {items.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelectCategory(cat.id)}
              className={`snap-start shrink-0 h-9 sm:h-9.5 px-3.5 sm:px-4 rounded-full border text-xs sm:text-[13px] font-bold inline-flex items-center gap-1.5 transition-all duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 ${
                isActive
                  ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-slate-950 dark:border-white shadow-xs scale-[1.02]'
                  : 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400'
              }`}
            >
              <span className="text-sm leading-none">{cat.icon}</span>
              <span className="whitespace-nowrap">{cat.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
