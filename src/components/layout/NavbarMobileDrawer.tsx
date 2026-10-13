import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Store, BadgeDollarSign, Compass, MapPin, ListFilter, Heart, Info, MessageCircle,
} from 'lucide-react';
import { useDrawerFocusTrap } from './hooks/useDrawerFocusTrap';
import { Button, ButtonLink } from '../../shared/ui';

export interface NavbarMobileDrawerProps {
  navLinks: Array<{ path: string; label: string; icon?: any; badge?: number }>;
  cleanRoute: string;
  onLinkClick: (path: string) => void;
  onAnchorClick: (e: React.MouseEvent<HTMLAnchorElement>, path: string) => void;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

const HADAYEK_GATE_LINKS = [
  { name: 'بوابة 1 (خوفو)', path: `/search?zone=${encodeURIComponent('البوابة الأولى (خوفو)')}` },
  { name: 'بوابة 2 (خفرع)', path: `/search?zone=${encodeURIComponent('البوابة الثانية (خفرع)')}` },
  { name: 'بوابة 3 (منقرع)', path: `/search?zone=${encodeURIComponent('البوابة الثالثة (منقرع)')}` },
  { name: 'بوابة 4 (مينا)', path: `/search?zone=${encodeURIComponent('البوابة الرابعة (مينا)')}` },
];

const HADAYEK_DISTRICTS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ك', 'ل', 'م', 'ن', 'س', 'ص', 'ع'];

export const NavbarMobileDrawer: React.FC<NavbarMobileDrawerProps> = ({
  navLinks, cleanRoute, onAnchorClick, onClose, triggerRef,
}) => {
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  useDrawerFocusTrap(drawerRef, closeBtnRef, onClose, triggerRef);

  const getLinkIcon = (p: string) => (p === '/map' ? MapPin : p === '/search' ? ListFilter : p === '/favorites' ? Heart : Compass);

  const drawer = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="navbar-drawer-title"
      className="fixed inset-0 z-[80] flex h-dvh w-full justify-end bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      dir="rtl"
    >
      <div ref={drawerRef} className="flex h-full min-h-0 w-full max-w-sm flex-col bg-white border-s border-slate-200 shadow-2xl overscroll-contain">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-md bg-amber-500/15 text-amber-600 flex items-center justify-center font-extrabold text-sm" aria-hidden="true">✨</span>
            <h2 id="navbar-drawer-title" className="text-base font-extrabold text-slate-900">القائمة والمزيد</h2>
          </div>
          <Button ref={closeBtnRef} variant="icon" onClick={onClose} aria-label="إغلاق القائمة">
            <X className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
          </Button>
        </div>

        {/* Links Body */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {/* Main Navigation */}
          <div className="space-y-1">
            <span className="text-caption font-bold text-slate-400 px-2">الاستكشاف والتنقل</span>
            {navLinks.map((link) => {
              const isActive = link.path === '/'
                ? cleanRoute === '/' || cleanRoute === '/map'
                : cleanRoute === link.path || cleanRoute.startsWith(link.path);
              const Icon = link.icon || getLinkIcon(link.path);
              const isFavorites = link.path === '/favorites';
              return (
                <a
                  key={link.path}
                  href={link.path}
                  onClick={(e) => { onAnchorClick(e, link.path); onClose(); }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-pill flex items-center justify-between text-xs font-extrabold transition-all cursor-pointer ${
                    isActive ? 'bg-amber-500/10 text-amber-800 border-s-2 border-s-[var(--brand-strong)]' : 'text-slate-700 hover:bg-slate-100 border-s-2 border-s-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                  </div>
                  {isFavorites ? (
                    <span
                      aria-label={`${link.badge || 0} في المفضلة`}
                      className={`px-2 py-0.5 rounded-pill text-caption font-extrabold font-mono transition-colors ${
                        link.badge && link.badge > 0 ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {link.badge ?? 0}
                    </span>
                  ) : link.badge !== undefined ? (
                    <span className="px-2 py-0.5 rounded-pill bg-rose-500 text-white text-caption font-extrabold font-mono">{link.badge}</span>
                  ) : null}
                </a>
              );
            })}
          </div>

          {/* Business & Growth Featured Card */}
          <div role="separator" className="h-px bg-slate-200" />
          <div className="rounded-xl border border-amber-500/20 bg-amber-50/60 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-700 flex items-center justify-center"><Store className="w-3.5 h-3.5" /></span>
                <span className="text-xs font-extrabold text-amber-950">للأعمال والأنشطة</span>
              </div>
              <span className="px-2 py-0.5 rounded-pill bg-amber-500/20 text-amber-800 text-caption font-extrabold">مجاناً</span>
            </div>
            <p className="text-caption font-medium text-slate-600 leading-relaxed">
              أدرج محلك في دليل حدائق الأهرام مجاناً أو اختر باقة توثيق ميداني معتمدة.
            </p>
            <div className="space-y-1.5">
              <ButtonLink
                href="/for-business"
                onClick={(e) => { onAnchorClick(e, '/for-business'); onClose(); }}
                variant="primary"
                size="md"
                fullWidth
                leadingIcon={<Store />}
                trailing="مجاني"
              >
                إدراج نشاطك مجاناً
              </ButtonLink>
              <ButtonLink
                href="/pricing"
                onClick={(e) => { onAnchorClick(e, '/pricing'); onClose(); }}
                variant="secondary"
                size="md"
                fullWidth
                leadingIcon={<BadgeDollarSign className="text-[var(--brand-ink)]" />}
              >
                باقات النمو والتوثيق الميداني
              </ButtonLink>
            </div>
          </div>

          {/* Atlas of Hadayek Al-Ahram (Gates & Districts) */}
          <div role="separator" className="h-px bg-slate-200" />
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 px-1">
              <Compass className="w-4 h-4 text-amber-600" />
              <span className="text-caption font-extrabold text-slate-700">أطلس حدائق الأهرام (البوابات والأحياء)</span>
            </div>

            {/* Gates 1 to 4 */}
            <div className="grid grid-cols-2 gap-1.5">
              {HADAYEK_GATE_LINKS.map((gate) => (
                <a
                  key={gate.name}
                  href={gate.path}
                  onClick={(e) => { onAnchorClick(e, gate.path); onClose(); }}
                  className="min-h-9 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-amber-500/10 hover:border-amber-500/30 text-caption font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">{gate.name}</span>
                </a>
              ))}
            </div>

            {/* Districts (Zones أ to ع) */}
            <div className="space-y-1">
              <span className="text-caption font-bold text-slate-400 px-1">المناطق:</span>
              <div className="flex flex-wrap gap-1">
                {HADAYEK_DISTRICTS.map((zone) => (
                  <a
                    key={zone}
                    href={`/search?zone=${encodeURIComponent(zone)}`}
                    onClick={(e) => { onAnchorClick(e, `/search?zone=${encodeURIComponent(zone)}`); onClose(); }}
                    className="w-7 h-7 rounded-md border border-slate-200 bg-white hover:bg-amber-500/15 hover:border-amber-500/40 text-caption font-extrabold text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                    title={`منطقة ${zone}`}
                    aria-label={`تصفية حسب منطقة ${zone}`}
                  >
                    {zone}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer: About & WhatsApp Direct Support */}
        <div className="shrink-0 space-y-2 border-t border-slate-200 bg-slate-50/70 p-4">
          <span className="text-caption font-bold text-slate-400 px-1">المنصة والدعم</span>
          <div className="grid grid-cols-2 gap-2">
            <ButtonLink
              href="/about"
              onClick={(e) => { onAnchorClick(e, '/about'); onClose(); }}
              variant="secondary"
              size="sm"
              leadingIcon={<Info className="text-slate-400" />}
            >
              عن دليلك
            </ButtonLink>
            <a
              href="https://wa.me/201556221141?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%AF%D9%84%D9%8A%D9%84%D9%83%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D9%88%D8%A7%D9%84%D8%AF%D8%B9%D9%85"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-pill border border-emerald-200 bg-emerald-50 px-3 text-caption font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
              aria-label="الدعم المباشر عبر واتساب"
            >
              <MessageCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>دعم واتساب</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return drawer;
  return createPortal(drawer, document.body);
};
