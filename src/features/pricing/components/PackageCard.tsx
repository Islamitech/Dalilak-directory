import React from 'react';
import { Check, MessageCircle, Sparkles, ChevronDown } from 'lucide-react';
import { GoogleStylePackage } from '../model/pricingPackages';

interface PackageCardProps {
  pkg: GoogleStylePackage;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ pkg, isExpanded, onToggleExpand }) => {
  const isPro = pkg.isPopular;

  return (
    <div
      className={`bg-[var(--bg-card)] rounded-2xl p-5 sm:p-6 border flex flex-col justify-between transition-all duration-200 ${
        isPro
          ? 'border-amber-400 ring-1 ring-amber-400/40 shadow-md'
          : 'border-[var(--border-color)] hover:border-slate-300 shadow-xs'
      }`}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[var(--input-bg)] text-amber-700 border border-amber-400/30">
              {pkg.badge}
            </span>
            {isPro && (
              <span className="text-[10.5px] font-black text-amber-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>الأكثر طلباً</span>
              </span>
            )}
          </div>
          <h3 className="font-black text-base sm:text-lg text-slate-900 leading-snug">
            {pkg.name}
          </h3>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            {pkg.shortDesc}
          </p>
        </div>

        <div className="pt-2 pb-1 border-t border-[var(--border-color)]">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
              {pkg.priceText}
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 block mt-0.5">
            {pkg.billingCadence}
          </span>
        </div>

        <div className="pt-1">
          <a
            href={`https://wa.me/201556221141?text=${encodeURIComponent(`مرحباً دليلك، أود الاستفسار والاشتراك في «${pkg.name}» (${pkg.priceText}).`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer ${
              isPro
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <MessageCircle className={`w-4 h-4 ${isPro ? 'text-slate-950' : 'text-emerald-400'}`} />
            <span>طلب الباقة عبر واتساب</span>
          </a>
        </div>

        <div className="space-y-2 pt-2 border-t border-[var(--border-color)] text-xs text-slate-700 font-medium">
          {pkg.deliverables.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 leading-relaxed">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 stroke-[2.5]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {isExpanded && (
        <div className="pt-3.5 mt-2 border-t border-[var(--border-color)] space-y-3 animate-fade-in text-xs">
          <div className="p-3 bg-[var(--input-bg)] rounded-xl border border-[var(--border-color)]">
            <span className="font-black text-amber-700 block mb-1 text-[11px]">
              الفئة المستهدفة:
            </span>
            <p className="text-[11.5px] text-slate-700 font-medium leading-relaxed">
              {pkg.forWhom}
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-black text-slate-900 block text-[11.5px]">
              تفاصيل الخدمات والمخرجات المشمولة:
            </span>
            <div className="space-y-1.5">
              {pkg.fullFeatures.map((feat, idx) => (
                <div key={idx} className="p-2.5 bg-[var(--input-bg)] rounded-xl border border-[var(--border-color)] space-y-0.5">
                  <span className="font-bold text-slate-900 block text-xs">✓ {feat.title}</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-[var(--input-bg)] rounded-xl border border-[var(--border-color)] text-[11px]">
            <span className="font-bold text-slate-500">مدة التنفيذ والتسليم:</span>
            <span className="font-black text-amber-600">{pkg.deliveryTime}</span>
          </div>
        </div>
      )}

      <div className="pt-3 mt-3 border-t border-[var(--border-color)] text-center">
        <button
          type="button"
          onClick={onToggleExpand}
          className="text-xs font-bold text-amber-600 hover:text-amber-500 cursor-pointer inline-flex items-center gap-1.5 transition-all active:scale-95"
        >
          <span>{isExpanded ? 'عرض تفاصيل أقل' : 'عرض التفاصيل الكاملة والمخرجات'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-amber-500' : ''}`} />
        </button>
      </div>
    </div>
  );
};
