import React, { useState, useRef } from 'react';
import { Logo } from '../Logo';
import {
  MoreHorizontal,
  Compass,
  Navigation,
  Maximize2,
  Moon,
  Sun,
  Store,
} from 'lucide-react';
import { ViewSegmentedSwitch, DirectoryViewMode } from './ViewSegmentedSwitch';
import { NavbarMobileDrawer } from './NavbarMobileDrawer';
import { SearchField } from '../../shared/ui/SearchField';
import { useTheme } from '../../contexts/ThemeContext';

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
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);
  const { theme, toggleTheme } = useTheme();
  const cleanRoute = currentPath.toLowerCase().split('?')[0];
  const isMapRoute = cleanRoute === '/' || cleanRoute === '/map';
  const activeViewMode: DirectoryViewMode = isMapRoute ? 'map' : 'list';

  const handleSwitchView = (view: DirectoryViewMode) => {
    if (view === 'map') {
      onNavigate('/map');
    } else {
      onNavigate('/search');
    }
  };

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
      className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs pt-[env(safe-area-inset-top)] transition-colors duration-200"
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
              <Logo size="sm" className="w-8 h-8 sm:w-9 sm:h-9" />
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-amber-600 transition-colors">
                  دليلك
                </span>
                <span className="hidden min-[480px]:inline text-[9px] text-slate-500 dark:text-slate-400 font-bold leading-none mt-0.5">
                  دليل الخدمات الذكي
                </span>
              </div>
            </a>
          </div>

          {/* 2. Top-Row Icon-Only Segmented Switch (order-2 on mobile, hidden on desktop lg:hidden) */}
          <div className="order-2 lg:hidden flex items-center justify-center shrink-0">
            <ViewSegmentedSwitch
              activeView={activeViewMode}
              onViewChange={handleSwitchView}
            />
          </div>

          {/* 3. Left (RTL End): Standardized Mini Buttons & More Menu (order-3 on mobile, order-4 on desktop) */}
          <div className="order-3 lg:order-4 flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Desktop Map Actions (>= 1024px ALWAYS visible per E1) */}
            {onLocateMe && (
              <button
                type="button"
                onClick={onLocateMe}
                className="hidden lg:flex w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-400 items-center justify-center cursor-pointer transition-all"
                aria-label="تحديد موقعي على الخريطة"
                title="موقعي"
              >
                <Navigation className="w-4 h-4 stroke-[2.2]" />
              </button>
            )}

            {onFitAll && (
              <button
                type="button"
                onClick={onFitAll}
                className="hidden lg:flex w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-400 items-center justify-center cursor-pointer transition-all"
                aria-label="عرض جميع الأنشطة على الخريطة"
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
                className="hidden min-[480px]:flex w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-400 items-center justify-center cursor-pointer transition-all"
                aria-label="أطلس بوابات ومناطق حدائق الأهرام"
                title="أطلس الحدائق"
              >
                <Compass className="w-4 h-4 stroke-[2.2]" />
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-400 flex items-center justify-center cursor-pointer transition-all"
              aria-label={theme === 'dark' ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
              title={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 stroke-[2.2]" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 stroke-[2.2]" />
              )}
            </button>

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
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-400 flex items-center justify-center cursor-pointer transition-all"
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
                placeholder="ابحث عن نشاط أو خدمة أو عمارة أو شارع..."
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
