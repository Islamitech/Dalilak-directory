import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { CORPORATE_PACKAGE, GoogleStylePackage } from '../model/pricingPackages';

interface CorporateCustomSectionProps {
  mode?: 'admin' | 'public';
  isCorporateExpanded: boolean;
  onToggleCorporate: () => void;
  onOpenModal: (pkg: GoogleStylePackage) => void;
}

export const CorporateCustomSection: React.FC<CorporateCustomSectionProps> = ({
  mode = 'public',
  isCorporateExpanded,
  onToggleCorporate,
  onOpenModal,
}) => {
  return (
    <div className="pt-6 border-t border-[var(--border-color)]">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-start space-y-1">
            <span className="text-[10.5px] font-black text-amber-700 uppercase">
              حلول الشركات والمشاريع الكبرى
            </span>
            <h4 className="font-black text-sm sm:text-base text-slate-900">
              الهوية المؤسسية الكاملة وتأسيس سلاسل الفروع
            </h4>
            <p className="text-xs text-slate-600 font-medium">
              دراسة مخصصة للشركات والمجمعات والمصانع وسلاسل الفروع تحت الإنشاء والتوسع.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleCorporate}
              className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-slate-700 font-bold text-xs border border-[var(--border-color)] cursor-pointer inline-flex items-center gap-1 transition-all"
            >
              <span>{isCorporateExpanded ? 'عرض أقل' : 'المخرجات والتفاصيل'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCorporateExpanded ? 'rotate-180 text-amber-500' : ''}`} />
            </button>

            {mode === 'public' ? (
              <a
                href="https://wa.me/201556221141?text=مرحباً%20دليلك،%20نود%20الاستفسار%20عن%20باقة%20الشركات%20والمشاريع%20الكبرى."
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm transition-all"
              >
                طلب استشارة وعرض سعر
              </a>
            ) : (
              <button
                type="button"
                onClick={() => onOpenModal(CORPORATE_PACKAGE)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm transition-all cursor-pointer"
              >
                تفاصيل حلول الشركات
              </button>
            )}
          </div>
        </div>

        {isCorporateExpanded && (
          <div className="pt-4 border-t border-[var(--border-color)] space-y-3 animate-fade-in text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CORPORATE_PACKAGE.deliverables.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-700 font-medium">
                  <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 stroke-[2.5]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
