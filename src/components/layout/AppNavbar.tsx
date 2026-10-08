import React, { useState, useRef } from 'react';
import { Logo } from '../Logo';
import {
  MoreHorizontal,
  Compass,
  Navigation,
  Maximize2,
  Store,
  Heart,
  Package,
  SlidersHorizontal,
} from 'lucide-react';
import { NavbarMobileDrawer } from './NavbarMobileDrawer';
import { SearchField } from '../../shared/ui/SearchField';

export interface AppNavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  favoritesCount?: number;
  activeLocation?: string;
  onLocationChange?: (locationName: string, coords?: { lat: number; lng: number }, gov?: string) => void;
  onLocateMe?: () => void;
  onFitAll?: () => void;
  onOpenAtlas?: () => void;
  showFilterButton?: boolean;
  hasActiveFilters?: boolean;
  onToggleFilters?: () => void;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  currentPath,
  onNavigate,
  searchQuery = '',
  onSearchChange,
  favoritesCount = 0,
  onLocateMe,
  onFitAll,
  onOpenAtlas,
  showFilterButton = false,
  hasActiveFilters = false,
  onToggleFilters,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);
  const cleanRoute = currentPath.toLowerCase().split('?')[0];

  const handleLinkClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && e.button === 0) {
      e.preventDefault();
      handleLinkClick(path);
    }
  };

  const navLinks = [
    { path: '/map', label: 'الخريطة التفاعلية' },
    { path: '/search', label: 'قائمة الأنشطة' },
    { path: '/favorites', label: 'المفضلة', badge: favoritesCount > 0 ? favoritesCount : undefined },
  ];

  return (
    <header
      className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs pt-[env(safe-area-inset-top)]"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-2.5 min-[360px]:px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-y-2 gap-x-1.5 sm:gap-x-3">
          {/* 1. Right (RTL Start): Brand Logo & Name (order-1) */}
          <div className="order-1 flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <a
              href="/"
              onClick={(e) => handleAnchorClick(e, '/')}
              className="flex items-center gap-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg p-0.5"
              aria-label="الرئيسية - منصة دليلك"
            >
              <Logo variant="icon" size="sm" className="w-8 h-8 sm:w-9 sm:h-9" />
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none group-hover:text-amber-600 transition-colors">
                  دليلك
                </span>
                <span className="hidden min-[480px]:inline text-[9px] text-slate-500 font-bold leading-none mt-0.5">
                  دليل الخدمات الذكي
                </span>
              </div>
            </a>
          </div>

          {/* 2. Left (RTL End): Standardized Mini Buttons & More Menu (order-2 on mobile, order-3 on desktop) */}
          <div className="order-2 lg:order-4 flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Desktop Map Actions (>= 1024px ALWAYS visible per E1) */}
            {onLocateMe && (
              <button
                type="button"
                onClick={onLocateMe}
                className="hidden lg:flex w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-amber-600 hover:border-amber-400 items-center justify-center cursor-pointer transition-all"
                aria-label="تحديد موقعي"
                title="موقعي"
              >
                <Navigation className="w-4 h-4 stroke-[2.2]" />
              </button>
            )}

            {onFitAll && (
              <button
                type="button"
                onClick={onFitAll}
                className="hidden lg:flex w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-amber-600 hover:border-amber-400 items-center justify-center cursor-pointer transition-all"
                aria-label="عرض جميع الأنشطة"
                title="عرض الكل"
              >
                <Maximize2 className="w-4 h-4 stroke-[2.2]" />
              </button>
            )}

            {/* Hadayek Atlas Button */}
            {onOpenAtlas && (
              <button
                type="button"
                onClick={onOpenAtlas}
                className="hidden min-[480px]:flex w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-amber-600 hover:border-amber-400 items-center justify-center cursor-pointer transition-all"
                aria-label="أطلس بوابات ومناطق حدائق الأهرام"
                title="أطلس الحدائق"
              >
                <Compass className="w-4 h-4 stroke-[2.2]" />
              </button>
            )}

            {/* Favorites — always visible (mobile + desktop) */}
            <button
              type="button"
              onClick={() => onNavigate('/favorites')}
              className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 border items-center justify-center cursor-pointer transition-all ${
                cleanRoute === '/favorites'
                  ? 'bg-amber-50 border-amber-400 text-amber-600'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-amber-600 hover:border-amber-400'
              } flex`}
              aria-label={`المفضلة${favoritesCount > 0 ? ` (${favoritesCount})` : ''}`}
              title="المفضلة"
            >
              <Heart className="w-4 h-4 stroke-[2.2]" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -start-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                  {favoritesCount > 99 ? '+99' : favoritesCount}
                </span>
              )}
            </button>

            {/* Packages / pricing — always visible (mobile + desktop) */}
            <button
              type="button"
              onClick={() => onNavigate('/pricing')}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 border items-center justify-center cursor-pointer transition-all ${
                cleanRoute === '/pricing'
                  ? 'bg-amber-50 border-amber-400 text-amber-600'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-amber-600 hover:border-amber-400'
              } flex`}
              aria-label="الباقات والأسعار"
              title="الباقات"
            >
              <Package className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Filter trigger — visible on both /map and /search */}
            {showFilterButton && onToggleFilters && (
              <button
                type="button"
                onClick={onToggleFilters}
                aria-haspopup="dialog"
                aria-label="تصفية الأنشطة"
                title="التصفية"
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-amber-600 hover:border-amber-400 flex items-center justify-center cursor-pointer transition-all"
              >
                <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
                {hasActiveFilters && (
                  <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>
            )}

            {/* For Business CTA (Desktop >= 1024px) */}
            <a
              href="/for-business"
              onClick={(e) => handleAnchorClick(e, '/for-business')}
              className="hidden xl:flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs transition-all shadow-xs"
              aria-label="أضف نشاطك مجاناً"
            >
              <Store className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>أضف نشاطك</span>
            </a>

            {/* More Menu (...) Button (D3) */}
            <button
              ref={moreButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-amber-600 hover:border-amber-400 flex items-center justify-center cursor-pointer transition-all"
              aria-label="المزيد من الخيارات والقائمة"
              title="المزيد"
              aria-expanded={mobileMenuOpen}
            >
              <MoreHorizontal className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          {/* 4. Single SearchField! (order-4 w-full on mobile, order-3 flex-1 on desktop) */}
          {onSearchChange && (
            <div className="order-4 lg:order-3 w-full lg:w-auto lg:flex-1 lg:max-w-xl lg:mx-4">
              <SearchField
                value={searchQuery}
                onChange={onSearchChange}
                placeholder="ابحث عن مطعم، صيدلية، أو خدمة..."
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <NavbarMobileDrawer
          navLinks={navLinks}
          cleanRoute={cleanRoute}
          onLinkClick={handleLinkClick}
          onAnchorClick={handleAnchorClick}
          onClose={() => setMobileMenuOpen(false)}
          onOpenAtlas={onOpenAtlas}
          triggerRef={moreButtonRef}
        />
      )}
    </header>
  );
};
