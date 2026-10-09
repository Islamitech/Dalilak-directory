import React from 'react';
import { Check, MessageCircle, Sparkles, ChevronDown } from 'lucide-react';
import { GoogleStylePackage } from '../model/pricingPackages';
import { Button, ButtonLink } from '../../../shared/ui';

interface PackageCardProps {
  pkg: GoogleStylePackage;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ pkg, isExpanded, onToggleExpand }) => {
  const isPro = pkg.isPopular;

  return (
    <div
      className={`bg-[var(--bg-card)] rounded-lg p-5 sm:p-6 border flex flex-col justify-between transition-all duration-200 ${
        isPro
          ? 'border-amber-400 ring-1 ring-amber-400/40 shadow-md'
          : 'border-[var(--border-color)] hover:border-slate-300 shadow-xs'
      }`}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-caption font-extrabold px-2.5 py-0.5 rounded-pill bg-[var(--input-bg)] text-amber-700 border border-amber-400/30">
              {pkg.badge}
            </span>
            {isPro && !pkg.badge.includes('الأكثر طلب') && (
              <span className="text-caption font-extrabold text-amber-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>الأكثر طلباً</span>
              </span>
            )}
          </div>
          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">
            {pkg.name}
          </h3>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            {pkg.shortDesc}
          </p>
        </div>

        <div className="pt-2 pb-1 border-t border-[var(--border-color)]">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold tabular-nums text-slate-900">
              {pkg.priceText}
            </span>
          </div>
          <span className="text-caption font-bold text-slate-500 block mt-0.5">
            {pkg.billingCadence}
          </span>
        </div>

        <div className="pt-1">
          <ButtonLink
            href={`https://wa.me/201556221141?text=${encodeURIComponent(`مرحباً دليلك، أود الاستفسار والاشتراك في «${pkg.name}» (${pkg.priceText}).`)}`}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            size="lg"
            fullWidth
            leadingIcon={<MessageCircle />}
          >
            طلب الباقة عبر واتساب
          </ButtonLink>
        </div>

        <div className="space-y-2 pt-2 border-t border-[var(--border-color)] text-xs text-slate-700 font-medium">
          {pkg.deliverables.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 leading-relaxed">
              <Check className="w-4 h-4 text-[var(--brand)] shrink-0 mt-0.5 stroke-[2.5]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {isExpanded && (
        <div className="pt-3.5 mt-2 border-t border-[var(--border-color)] space-y-3 animate-fade-in text-xs">
          <div className="p-3 bg-[var(--input-bg)] rounded-lg border border-[var(--border-color)]">
            <span className="font-extrabold text-amber-700 block mb-1 text-caption">
              الفئة المستهدفة:
            </span>
            <p className="text-caption text-slate-700 font-medium leading-relaxed">
              {pkg.forWhom}
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-extrabold text-slate-900 block text-caption">
              تفاصيل الخدمات والمخرجات المشمولة:
            </span>
            <div className="space-y-1.5">
              {pkg.fullFeatures.map((feat, idx) => (
                <div key={idx} className="p-2.5 bg-[var(--input-bg)] rounded-lg border border-[var(--border-color)] space-y-0.5">
                  <span className="font-bold text-slate-900 block text-xs">✓ {feat.title}</span>
                  <p className="text-caption text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-[var(--input-bg)] rounded-lg border border-[var(--border-color)] text-caption">
            <span className="font-bold text-slate-500">مدة التنفيذ والتسليم:</span>
            <span className="font-extrabold text-amber-700">{pkg.deliveryTime}</span>
          </div>
        </div>
      )}

      <div className="pt-3 mt-3 border-t border-[var(--border-color)] text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
          className="text-amber-700!"
          trailing={<ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />}
        >
          {isExpanded ? 'عرض تفاصيل أقل' : 'عرض التفاصيل الكاملة والمخرجات'}
        </Button>
      </div>
    </div>
  );
};
