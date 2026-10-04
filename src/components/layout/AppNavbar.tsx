import React, { useState } from 'react';
import { Logo } from '../Logo';
import {
  Search,
  Map as MapIcon,
  Heart,
  Store,
  Menu,
  X,
  BadgeDollarSign,
} from 'lucide-react';
import { NavbarLocationDropdown } from './NavbarLocationDropdown';
import { NavbarMobileDrawer } from './NavbarMobileDrawer';

export interface AppNavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  favoritesCount?: number;
  activeLocation?: string;
  onLocationChange?: (locationName: string, coords?: { lat: number; lng: number }, gov?: string) => void;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  currentPath,
  onNavigate,
  favoritesCount = 0,
  activeLocation = 'حدائق الأهرام',
  onLocationChange,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cleanRoute = currentPath.toLowerCase().split('?')[0];

  const navLinks = [
    { path: '/', label: 'الخريطة والملاحة', icon: MapIcon },
    { path: '/search', label: 'استكشف الأنشطة', icon: Search },
    { path: '/favorites', label: 'المفضلة', icon: Heart, badge: favoritesCount > 0 ? favoritesCount : undefined },
  ];

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

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs pt-[env(safe-area-inset-top)]" dir="rtl">
      <div className="max-w-7xl mx-auto px-2.5 min-[380px]:px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Right (RTL Start): Brand Logo & Location Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <a
            href="/"
            onClick={(e) => handleAnchorClick(e, '/')}
            className="flex items-center gap-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg p-0.5"
            aria-label="الرئيسية - دليلك"
          >
            <Logo className="w-8 h-8 sm:w-9 sm:h-9" />
            <div className="hidden min-[420px]:flex flex-col">
              <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none group-hover:text-amber-600 transition-colors">
                دليلك
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold leading-none mt-0.5">
                دليل الخدمات الذكي
              </span>
            </div>
          </a>

          <div className="h-5 w-px bg-slate-200 mx-0.5 sm:mx-1 shrink-0" />
          <NavbarLocationDropdown activeLocation={activeLocation} onLocationChange={onLocationChange} />
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-3 text-xs font-black text-slate-600">
          {navLinks.map((link) => {
            const isActive =
              link.path === '/'
                ? cleanRoute === '/' || cleanRoute === '/map'
                : cleanRoute === link.path || cleanRoute.startsWith(link.path);
            const Icon = link.icon;
            return (
              <a
                key={link.path}
                href={link.path}
                onClick={(e) => handleAnchorClick(e, link.path)}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-800 font-black'
                    : 'hover:bg-slate-100 hover:text-slate-900 text-slate-600'
                }`}
              >
                {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />}
                <span>{link.label}</span>
                {link.badge !== undefined && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                    {link.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Left (RTL End): Business Owner CTA & Mobile Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <a
            href="/pricing"
            onClick={(e) => handleAnchorClick(e, '/pricing')}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-all cursor-pointer"
          >
            <BadgeDollarSign className="w-4 h-4 text-amber-600" />
            <span>باقات النمو</span>
          </a>

          <a
            href="/for-business"
            onClick={(e) => handleAnchorClick(e, '/for-business')}
            className="w-11 min-[400px]:w-auto min-h-11 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs px-0 min-[400px]:px-3 sm:px-4 py-2.5 rounded-xl shadow-xs hover:shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            aria-label="أضف نشاطك مجاناً"
          >
            <Store className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">هل تملك نشاطاً؟ أضفه مجاناً</span>
            <span className="hidden min-[400px]:inline sm:hidden">أضف نشاطك</span>
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
            aria-label="القائمة الرئيسية"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <NavbarMobileDrawer
          navLinks={navLinks}
          cleanRoute={cleanRoute}
          onLinkClick={handleLinkClick}
          onAnchorClick={handleAnchorClick}
        />
      )}
    </header>
  );
};
