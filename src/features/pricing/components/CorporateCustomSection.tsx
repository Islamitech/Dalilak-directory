import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { CORPORATE_PACKAGE, GoogleStylePackage } from '../model/pricingPackages';
import { Button, ButtonLink } from '../../../shared/ui';

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
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-start space-y-1">
            <span className="text-caption font-extrabold text-amber-700 uppercase">
              حلول الشركات والمشاريع الكبرى
            </span>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
              الهوية المؤسسية الكاملة وتأسيس سلاسل الفروع
            </h4>
            <p className="text-xs text-slate-600 font-medium">
              دراسة مخصصة للشركات والمجمعات والمصانع وسلاسل الفروع تحت الإنشاء والتوسع.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              onClick={onToggleCorporate}
              aria-expanded={isCorporateExpanded}
              trailing={<ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCorporateExpanded ? 'rotate-180' : ''}`} />}
            >
              {isCorporateExpanded ? 'عرض أقل' : 'المخرجات والتفاصيل'}
            </Button>

            {mode === 'public' ? (
              <ButtonLink
                href="https://wa.me/201556221141?text=مرحباً%20دليلك،%20نود%20الاستفسار%20عن%20باقة%20الشركات%20والمشاريع%20الكبرى."
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
              >
                طلب استشارة وعرض سعر
              </ButtonLink>
            ) : (
              <Button variant="primary" onClick={() => onOpenModal(CORPORATE_PACKAGE)}>
                تفاصيل حلول الشركات
              </Button>
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
