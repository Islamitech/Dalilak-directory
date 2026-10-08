import React from 'react';
import { Compass, Sparkles, Store } from 'lucide-react';

export interface HomeCalloutsSectionProps {
  onNavigate: (path: string) => void;
}

export const HomeCalloutsSection: React.FC<HomeCalloutsSectionProps> = ({ onNavigate }) => {
  return (
    <>
      {/* Live Map Quick Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="space-y-2 text-center md:text-start max-w-xl">
            <span className="text-amber-200 text-xs font-extrabold bg-white/15 px-3 py-1 rounded-full inline-block">
              خريطة حدائق الأهرام المباشرة
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold">
              استكشف حدائق الأهرام بالخريطة التفاعلية الحية
            </h3>
            <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed font-medium">
              تجوّل بين المناطق، حدد البوابات، وشاهد أماكن الصيدليات والسوبرماركت والخدمات بنقرة زر واحدة.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/map')}
            className="bg-white text-slate-950 hover:bg-amber-100 font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-lg transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-95"
          >
            <Compass className="w-4 h-4 text-amber-700" />
            <span>افتح ماب حدائق الأهرام</span>
          </button>
        </div>
      </section>

      {/* Business Owner Free Registration Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-start max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مجاناً 100% لأصحاب الأنشطة والخدمات</span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)]">
              هل تدير محلاً أو عيادة أو نشاطاً في حدائق الأهرام؟ سجله الآن
            </h3>
            <p className="text-xs text-[var(--text-secondary)] font-medium">
              أضف نشاطك ووصل لآلاف السكان والعملاء يومياً عبر تطبيق وخريطة دليلك. توثيق سريع وفوري مجاناً.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/for-business')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-xs"
          >
            <Store className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>إضافة نشاط مجاناً (0 ج)</span>
          </button>
        </div>
      </section>
    </>
  );
};
