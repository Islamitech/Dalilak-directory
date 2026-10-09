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
    <footer className="border-t border-[var(--logo-ink-0)] bg-[var(--logo-ink-1)] text-[var(--logo-silver-1)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md space-y-2">
            <Logo size="md" showSubtitle={false} />
            <p className="text-sm font-medium leading-relaxed">
              دليل حدائق الأهرام: أنشطة موثقة، ومناطق، وبوابات على الخريطة نفسها.
            </p>
          </div>
          <nav aria-label="روابط الدليل" className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold">
            <a href="/map" onClick={(event) => go(event, '/map')} className="text-[var(--logo-silver-0)] hover:text-[var(--logo-gold-1)]">الخريطة</a>
            <a href="/search" onClick={(event) => go(event, '/search')} className="text-[var(--logo-silver-0)] hover:text-[var(--logo-gold-1)]">الأنشطة</a>
            <a href="/favorites" onClick={(event) => go(event, '/favorites')} className="text-[var(--logo-silver-0)] hover:text-[var(--logo-gold-1)]">المفضلة</a>
            <a href="/for-business" onClick={(event) => go(event, '/for-business')} className="text-[var(--logo-silver-0)] hover:text-[var(--logo-gold-1)]">أضف نشاطك</a>
            <a href="/pricing" onClick={(event) => go(event, '/pricing')} className="text-[var(--logo-silver-0)] hover:text-[var(--logo-gold-1)]">الباقات</a>
            <a href="/about" onClick={(event) => go(event, '/about')} className="text-[var(--logo-silver-0)] hover:text-[var(--logo-gold-1)]">عن دليلك</a>
          </nav>
        </div>
        <div className="flex flex-wrap gap-2">
          {FOOTER_CATEGORIES.map((category) => (
            <a
              key={category.id}
              href={`/search?cat=${encodeURIComponent(category.id)}`}
              onClick={(event) => go(event, `/search?cat=${encodeURIComponent(category.id)}`)}
              className="rounded-pill border border-[var(--logo-silver-3)] bg-[var(--logo-ink-0)] px-3 py-1 text-xs font-bold text-[var(--logo-silver-0)] hover:border-[var(--logo-gold-1)] hover:text-[var(--logo-gold-0)]"
            >
              {category.name}
            </a>
          ))}
        </div>
        <p className="text-xs font-medium text-[var(--logo-silver-2)]">© {new Date().getFullYear()} منصة دليلك. حدائق الأهرام.</p>
      </div>
    </footer>
  );
};
