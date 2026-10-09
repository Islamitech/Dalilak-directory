import React from 'react';
import { Logo } from '../Logo';
import { INTEGRATED_FILTER_CATEGORIES } from '../../features/search';

export interface AppFooterProps {
  onNavigate: (path: string) => void;
}

const FOOTER_CATEGORIES = ['food', 'health', 'grocery']
  .map((id) => INTEGRATED_FILTER_CATEGORIES.find((item) => item.id === id))
  .filter((item): item is NonNullable<typeof item> => Boolean(item));

export const AppFooter: React.FC<AppFooterProps> = ({ onNavigate }) => {
  const go = (event: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (!event.ctrlKey && !event.metaKey && event.button === 0) {
      event.preventDefault();
      onNavigate(path);
    }
  };

  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-600">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md space-y-2">
            <Logo size="md" showSubtitle={false} />
            <p className="text-sm font-medium leading-relaxed">
              دليل حدائق الأهرام: أنشطة موثقة، ومناطق، وبوابات على الخريطة نفسها.
            </p>
          </div>
          <nav aria-label="روابط الدليل" className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold">
            <a href="/map" onClick={(event) => go(event, '/map')} className="hover:text-amber-800">الخريطة</a>
            <a href="/search" onClick={(event) => go(event, '/search')} className="hover:text-amber-800">الأنشطة</a>
            <a href="/favorites" onClick={(event) => go(event, '/favorites')} className="hover:text-amber-800">المفضلة</a>
            <a href="/for-business" onClick={(event) => go(event, '/for-business')} className="hover:text-amber-800">أضف نشاطك</a>
            <a href="/pricing" onClick={(event) => go(event, '/pricing')} className="hover:text-amber-800">الباقات</a>
            <a href="/about" onClick={(event) => go(event, '/about')} className="hover:text-amber-800">عن دليلك</a>
          </nav>
        </div>
        <div className="flex flex-wrap gap-2">
          {FOOTER_CATEGORIES.map((category) => (
            <a
              key={category.id}
              href={`/search?cat=${encodeURIComponent(category.id)}`}
              onClick={(event) => go(event, `/search?cat=${encodeURIComponent(category.id)}`)}
              className="rounded-pill border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:border-amber-300"
            >
              {category.name}
            </a>
          ))}
        </div>
        <p className="text-xs font-medium text-slate-500">© {new Date().getFullYear()} منصة دليلك. حدائق الأهرام.</p>
      </div>
    </footer>
  );
};
