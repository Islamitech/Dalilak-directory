import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Store,
  BadgeDollarSign,
  Compass,
  MapPin,
  ListFilter,
  Heart,
  Info,
} from 'lucide-react';
import { useDrawerFocusTrap } from './hooks/useDrawerFocusTrap';
import { Button, ButtonLink } from '../../shared/ui';

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
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export const NavbarMobileDrawer: React.FC<NavbarMobileDrawerProps> = ({
  navLinks,
  cleanRoute,
  onAnchorClick,
  onClose,
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

  const drawer = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="navbar-drawer-title"
      className="fixed inset-0 z-[80] flex h-dvh w-full justify-end bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      dir="rtl"
    >
      <div
        ref={drawerRef}
        className="flex h-full min-h-0 w-full max-w-sm flex-col bg-white border-s border-slate-200 shadow-2xl overscroll-contain"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-md bg-amber-500/15 text-amber-600 flex items-center justify-center font-extrabold text-sm">
              ✨
            </span>
            <h2 id="navbar-drawer-title" className="text-base font-extrabold text-slate-900">
              القائمة والمزيد
            </h2>
          </div>
          <Button ref={closeBtnRef} variant="icon" onClick={onClose} aria-label="إغلاق القائمة">
            <X className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
          </Button>
        </div>

        {/* Links Body */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {/* Main Navigation */}
          <div className="space-y-1">
            <span className="text-caption font-bold text-slate-400 px-2">
              الاستكشاف
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
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-pill flex items-center justify-between text-xs font-extrabold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-800 border-s-2 border-s-[var(--brand)]'
                      : 'text-slate-700 hover:bg-slate-100 border-s-2 border-s-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                  </div>
                  {link.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-pill bg-rose-500 text-white text-caption font-bold font-mono">
                      {link.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </div>

          {/* Business & Growth */}
          <div role="separator" className="h-px bg-slate-200" />
          <div className="space-y-1.5">
            <span className="text-caption font-bold text-slate-400 px-2">
              للأعمال
            </span>
            <ButtonLink
              href="/for-business"
              onClick={(e) => {
                onAnchorClick(e, '/for-business');
                onClose();
              }}
              variant="primary"
              size="lg"
              fullWidth
              leadingIcon={<Store />}
              trailing="مجاني"
            >
              إدراج نشاطك مجاناً
            </ButtonLink>

            <ButtonLink
              href="/pricing"
              onClick={(e) => {
                onAnchorClick(e, '/pricing');
                onClose();
              }}
              variant="secondary"
              size="lg"
              fullWidth
              leadingIcon={<BadgeDollarSign className="text-[var(--brand)]" />}
            >
              باقات النمو والتوثيق الميداني
            </ButtonLink>
          </div>
        </div>

        {/* Footer info links */}
        <div className="shrink-0 space-y-1.5 border-t border-slate-200 bg-slate-50/50 p-4">
          <span className="text-caption font-bold text-slate-400 px-2">المنصة</span>
          <ButtonLink
            href="/about"
            onClick={(e) => {
              onAnchorClick(e, '/about');
              onClose();
            }}
            variant="secondary"
            fullWidth
            leadingIcon={<Info className="text-slate-400" />}
          >
            عن دليلك
          </ButtonLink>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return drawer;
  return createPortal(drawer, document.body);
};
