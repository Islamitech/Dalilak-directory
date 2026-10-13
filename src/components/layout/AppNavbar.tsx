import React, { useState, useRef } from 'react';
import { Logo } from '../Logo';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '../../shared/ui';
import type { Business } from '../../types';

const NavbarMobileDrawer = React.lazy(() =>
  import('./NavbarMobileDrawer').then((m) => ({ default: m.NavbarMobileDrawer }))
);

export interface AppNavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  favoritesCount?: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  buildingSearchZone?: string;
  confineToHadayek?: boolean;
  businesses?: Business[];
  onSelectBusiness?: (business: Business) => void;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({ currentPath, onNavigate, favoritesCount = 0 }) => {
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
    <header className="fixed top-0 inset-x-0 z-[1000] pointer-events-none p-3 sm:p-4 flex items-center justify-between" dir="rtl">
      <a
        href="/"
        onClick={(e) => handleAnchorClick(e, '/')}
        className="optical-aura pointer-events-auto inline-flex items-center rounded-lg p-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        aria-label="الرئيسية - منصة دليلك"
      >
        <Logo variant="full" size="sm" showSubtitle={false} />
      </a>

      <Button
        ref={moreButtonRef}
        variant="icon"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="المزيد من الخيارات والقائمة"
        title="المزيد"
        aria-expanded={mobileMenuOpen}
        className="relative optical-aura pointer-events-auto w-11 h-11 bg-transparent! border-transparent! text-slate-800 hover:bg-black/5"
      >
        <MoreHorizontal className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
        {favoritesCount > 0 && (
          <span className="absolute -top-1 -start-1 min-w-[18px] h-[18px] px-1 rounded-pill bg-rose-500 text-white text-caption font-extrabold flex items-center justify-center pointer-events-none">
            {favoritesCount > 99 ? '+99' : favoritesCount}
          </span>
        )}
      </Button>

      {mobileMenuOpen && (
        <React.Suspense fallback={null}>
          <NavbarMobileDrawer
            navLinks={navLinks}
            cleanRoute={cleanRoute}
            onLinkClick={handleLinkClick}
            onAnchorClick={handleAnchorClick}
            onClose={() => setMobileMenuOpen(false)}
            triggerRef={moreButtonRef}
          />
        </React.Suspense>
      )}
    </header>
  );
};
