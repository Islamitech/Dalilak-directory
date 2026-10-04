import React from 'react';
import { Store, BadgeDollarSign } from 'lucide-react';

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
}

export const NavbarMobileDrawer: React.FC<NavbarMobileDrawerProps> = ({
  navLinks,
  cleanRoute,
  onAnchorClick,
}) => {
  return (
    <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-2 animate-fade-in shadow-xl max-h-[calc(100dvh-4rem-env(safe-area-inset-top))] overflow-y-auto overscroll-contain">
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
            onClick={(e) => onAnchorClick(e, link.path)}
            className={`w-full px-4 py-3 rounded-xl flex items-center justify-between text-xs font-black transition-all cursor-pointer ${
              isActive
                ? 'bg-amber-500/15 text-amber-800'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />}
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

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <a
          href="/for-business"
          onClick={(e) => onAnchorClick(e, '/for-business')}
          className="w-full px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-between transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            <span>إدراج نشاطك مجاناً</span>
          </div>
          <span className="text-[10px] bg-slate-950 text-white px-2 py-0.5 rounded-md">مجاني</span>
        </a>

        <a
          href="/pricing"
          onClick={(e) => onAnchorClick(e, '/pricing')}
          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 text-xs font-black flex items-center justify-between transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>باقات النمو والتوثيق</span>
          </div>
        </a>

        <div className="flex items-center gap-2 pt-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
          <a
            href="/about"
            onClick={(e) => onAnchorClick(e, '/about')}
            className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-center hover:text-amber-600 transition-colors"
          >
            عن دليلك
          </a>
          <a
            href="/offline.html"
            className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-center hover:text-amber-600 transition-colors"
          >
            دليل الأوفلاين
          </a>
        </div>
      </div>
    </div>
  );
};
