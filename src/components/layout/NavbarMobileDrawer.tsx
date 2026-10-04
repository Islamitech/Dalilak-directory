import React, { useRef } from 'react';
import {
  X,
  Store,
  BadgeDollarSign,
  Compass,
  MapPin,
  ListFilter,
  Heart,
  Info,
  WifiOff,
} from 'lucide-react';
import { useDrawerFocusTrap } from './hooks/useDrawerFocusTrap';

export interface NavbarMobileDrawerProps {
  navLinks: Array<{
    path: string;
    label: string;
    icon?: any;
    badge?: number;
  }>;
  cleanRoute: string;
  onLinkClick: (path: string) => void;
  onAnchorClick: (e: React.MouseEvent<HTMLAnchorElement>, path: string) => void;
  onClose: () => void;
  onOpenAtlas?: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export const NavbarMobileDrawer: React.FC<NavbarMobileDrawerProps> = ({
  navLinks,
  cleanRoute,
  onAnchorClick,
  onClose,
  onOpenAtlas,
  triggerRef,
}) => {
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useDrawerFocusTrap(drawerRef, closeBtnRef, onClose, triggerRef);

  const getLinkIcon = (path: string) => {
    if (path === '/map') return MapPin;
    if (path === '/search') return ListFilter;
    if (path === '/favorites') return Heart;
    return Compass;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="navbar-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      dir="rtl"
    >
      <div
        ref={drawerRef}
        className="w-full max-w-sm h-full bg-white dark:bg-slate-900 border-s border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto overscroll-contain transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-sm">
              ✨
            </span>
            <h2 id="navbar-drawer-title" className="text-base font-black text-slate-900 dark:text-white">
              القائمة والمزيد
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="إغلاق القائمة"
            className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Links Body */}
        <div className="p-4 space-y-4 flex-1">
          {/* Main Navigation */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
              التصفح الأساسي
            </span>
            {navLinks.map((link) => {
              const isActive =
                link.path === '/'
                  ? cleanRoute === '/' || cleanRoute === '/map'
                  : cleanRoute === link.path || cleanRoute.startsWith(link.path);
              const Icon = link.icon || getLinkIcon(link.path);
              return (
                <a
                  key={link.path}
                  href={link.path}
                  onClick={(e) => {
                    onAnchorClick(e, link.path);
                    onClose();
                  }}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center justify-between text-xs font-black transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{link.label}</span>
                  </div>
                  {link.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono">
                      {link.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </div>

          {/* Business & Growth */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
              خدمات الأعمال والنمو
            </span>
            <a
              href="/for-business"
              onClick={(e) => {
                onAnchorClick(e, '/for-business');
                onClose();
              }}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-between transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <Store className="w-4 h-4 stroke-[2.2]" />
                <span>إدراج نشاطك مجاناً</span>
              </div>
              <span className="text-[10px] bg-slate-950 text-white px-2 py-0.5 rounded-md font-bold">مجاني</span>
            </a>

            <a
              href="/pricing"
              onClick={(e) => {
                onAnchorClick(e, '/pricing');
                onClose();
              }}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 text-xs font-black flex items-center justify-between transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-2.5">
                <BadgeDollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400 stroke-[2.2]" />
                <span>باقات النمو والتوثيق الميداني</span>
              </div>
            </a>
          </div>

          {/* Tools & City Atlas */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
              أدوات حدائق الأهرام
            </span>
            {onOpenAtlas && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAtlas();
                }}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 text-xs font-black flex items-center gap-2.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400 stroke-[2.2]" />
                <span>أطلس البوابات والمناطق</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer info links */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2">
          <a
            href="/about"
            onClick={(e) => {
              onAnchorClick(e, '/about');
              onClose();
            }}
            className="flex-1 min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 hover:text-amber-600 transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>عن دليلك</span>
          </a>
          <a
            href="/offline.html"
            className="flex-1 min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 hover:text-amber-600 transition-colors"
          >
            <WifiOff className="w-3.5 h-3.5 text-slate-400" />
            <span>دليل الأوفلاين</span>
          </a>
        </div>
      </div>
    </div>
  );
};
