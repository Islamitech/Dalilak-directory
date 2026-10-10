import React, { useLayoutEffect, useState, useRef } from 'react';
import { Logo } from '../Logo';
import {
  MoreHorizontal,
  Store,
  Heart,
} from 'lucide-react';
import { NavbarMobileDrawer } from './NavbarMobileDrawer';
import { UnifiedMapSearch } from './UnifiedMapSearch';
import { Button, ButtonLink } from '../../shared/ui';
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
  const headerRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const apply = () => {
      document.documentElement.style.setProperty('--app-header-h', `${header.getBoundingClientRect().height}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
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
      ref={headerRef}
      className="app-chrome-header sticky top-0 z-40 bg-[var(--logo-silver-0)] pt-[env(safe-area-inset-top)]"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-2.5 min-[360px]:px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        <div className="flex flex-nowrap items-center gap-x-1.5 sm:gap-x-3">
          {/* 1. Right (RTL Start): Brand Logo & Name (order-1) */}
          <div className="order-1 flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <a
              href="/"
              onClick={(e) => handleAnchorClick(e, '/')}
              className="inline-flex items-center rounded-lg p-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              aria-label="الرئيسية - منصة دليلك"
            >
              <Logo variant="full" size="sm" showSubtitle={false} />
            </a>
          </div>

          {/* 2. Left (RTL End): ONLY 3 items (Favorites, Add Business, More Menu ⋯) */}
          <div className="order-2 lg:order-4 flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Favorites stay in the side drawer on phones; desktop keeps the icon. */}
            <div className="hidden lg:block">
            <Button
              variant="icon"
              onClick={() => onNavigate('/favorites')}
              className={`relative ${cleanRoute === '/favorites' ? 'text-[var(--brand-ink)]! border-[var(--brand-strong)]!' : ''}`}
              aria-label={`المفضلة${favoritesCount > 0 ? ` (${favoritesCount})` : ''}`}
              aria-current={cleanRoute === '/favorites' ? 'page' : undefined}
              title="المفضلة"
            >
              <Heart className="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -start-1 min-w-[18px] h-[18px] px-1 rounded-pill bg-rose-500 text-white text-caption font-extrabold flex items-center justify-center">
                  {favoritesCount > 99 ? '+99' : favoritesCount}
                </span>
              )}
            </Button>
            </div>

            <div className="hidden sm:block">
            <ButtonLink
              href="/for-business"
              onClick={(e) => handleAnchorClick(e, '/for-business')}
              variant="primary"
              size="sm"
              leadingIcon={<Store />}
              className="min-h-11!"
              aria-label="أضف نشاطك مجاناً"
              title="أضف نشاطك"
            >
              أضف نشاطك
            </ButtonLink>
            </div>

            <Button
              ref={moreButtonRef}
              variant="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="المزيد من الخيارات والقائمة"
              title="المزيد"
              aria-expanded={mobileMenuOpen}
            >
              <MoreHorizontal className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
            </Button>
          </div>

          {/* 3. Single Unified SearchField for all modes (order-4 w-full on mobile, order-3 flex-1 on desktop) */}
          {onSearchChange && (
            <div className="order-3 min-w-0 flex-1 lg:max-w-xl lg:mx-4">
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
