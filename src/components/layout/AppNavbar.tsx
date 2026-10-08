import React, { useState, useRef } from 'react';
import { Logo } from '../Logo';
import {
  MoreHorizontal,
  Store,
  Heart,
} from 'lucide-react';
import { NavbarMobileDrawer } from './NavbarMobileDrawer';
import { UnifiedMapSearch } from './UnifiedMapSearch';
import { Business } from '../../types';

export interface AppNavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  favoritesCount?: number;
  buildingSearchZone?: string;
  businesses?: Business[];
  onSelectBusiness?: (business: Business) => void;
}

/**
 * 🧭 AppNavbar — Simplified top bar
 *
 * Header contains ONLY:
 * 1. Brand Logo & Name
 * 2. Search field
 * 3. Top action items:
 *    - Favorites (المفضلة) with live counter badge
 *    - Add Business (أضف نشاطك)
 *    - More menu (المزيد ⋯) which opens the Drawer
 *
 * Relocated items:
 * - Packages & Atlas moved to Drawer
 * - Locate Me & Fit All moved to map floating controls
 */
export const AppNavbar: React.FC<AppNavbarProps> = ({
  currentPath,
  onNavigate,
  searchQuery = '',
  onSearchChange,
  favoritesCount = 0,
  buildingSearchZone,
  businesses = [],
  onSelectBusiness,
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
                <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-none group-hover:text-amber-600 transition-colors">
                  دليلك
                </span>
                <span className="hidden min-[480px]:inline text-caption text-slate-500 font-bold leading-none mt-0.5">
                  دليل الخدمات الذكي
                </span>
              </div>
            </a>
          </div>

          {/* 2. Left (RTL End): ONLY 3 items (Favorites, Add Business, More Menu ⋯) */}
          <div className="order-2 lg:order-4 flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Favorites (المفضلة) */}
            <button
              type="button"
              onClick={() => onNavigate('/favorites')}
              className={`relative w-10 h-10 rounded-xl border flex items-center justify-center cursor-pointer transition-all active:scale-95 ${
                cleanRoute === '/favorites'
                  ? 'bg-amber-50 border-amber-400 text-amber-600'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-amber-600 hover:border-amber-400'
              }`}
              aria-label={`المفضلة${favoritesCount > 0 ? ` (${favoritesCount})` : ''}`}
              title="المفضلة"
            >
              <Heart className="w-4 h-4 stroke-[2.2]" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -start-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-caption font-extrabold flex items-center justify-center">
                  {favoritesCount > 99 ? '+99' : favoritesCount}
                </span>
              )}
            </button>

            {/* Add Activity CTA (أضف نشاطك) */}
            <a
              href="/for-business"
              onClick={(e) => handleAnchorClick(e, '/for-business')}
              className="h-10 px-2.5 sm:px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-extrabold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              aria-label="أضف نشاطك مجاناً"
              title="أضف نشاطك"
            >
              <Store className="w-4 h-4 stroke-[2.2]" />
              <span className="hidden min-[480px]:inline">أضف نشاطك</span>
            </a>

            {/* More Menu (...) Button */}
            <button
              ref={moreButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-amber-600 hover:border-amber-400 flex items-center justify-center cursor-pointer transition-all active:scale-95"
              aria-label="المزيد من الخيارات والقائمة"
              title="المزيد"
              aria-expanded={mobileMenuOpen}
            >
              <MoreHorizontal className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          {/* 3. Single Unified SearchField for all modes (order-4 w-full on mobile, order-3 flex-1 on desktop) */}
          {onSearchChange && (
            <div className="order-4 lg:order-3 w-full lg:w-auto lg:flex-1 lg:max-w-xl lg:mx-4">
              <UnifiedMapSearch
                value={searchQuery}
                onChange={onSearchChange}
                zone={buildingSearchZone}
                businesses={businesses}
                onSelectBusiness={onSelectBusiness}
                onSelectBuilding={(building) => {
                  const path = window.location.pathname;
                  const onMap = path === '/' || path === '/map';
                  if (!onMap) {
                    onNavigate(`/map?zone=${encodeURIComponent(building.zoneLetter)}&bldg=${encodeURIComponent(building.buildingNumber)}`);
                    return;
                  }
                  window.dispatchEvent(new CustomEvent('map:searchBuilding', { detail: building }));
                }}
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
          triggerRef={moreButtonRef}
        />
      )}
    </header>
  );
};
