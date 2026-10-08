import React from 'react';
import { MessageCircle } from 'lucide-react';
import { GoogleStylePackage } from '../model/pricingPackages';
import { Modal } from '../../../shared/ui/Modal';

interface PackageDetailModalProps {
  pkg: GoogleStylePackage | null;
  onClose: () => void;
}

export const PackageDetailModal: React.FC<PackageDetailModalProps> = ({ pkg, onClose }) => {
  if (!pkg) return null;

  return (
    <Modal
      isOpen={!!pkg}
      onClose={onClose}
      maxWidth="2xl"
      title={pkg.name}
      headerContent={
        <div>
          <span className="text-[10px] font-black text-amber-700 bg-[var(--input-bg)] px-2 py-0.5 rounded border border-amber-500/20">
            {pkg.badge || 'تفاصيل الباقة'}
          </span>
          <h3 className="font-black text-base sm:text-lg text-slate-900 mt-1">
            {pkg.name}
          </h3>
          <p className="text-xs text-slate-600 font-bold">
            التكلفة: <span className="text-amber-700">{pkg.priceText}</span> ({pkg.billingCadence}) | مدة التنفيذ: {pkg.deliveryTime}
          </p>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)]">
          <span className="font-black text-amber-700 block mb-0.5">الفئة المستهدفة:</span>
          <p className="text-[11.5px] text-slate-700 font-medium leading-relaxed">{pkg.forWhom}</p>
        </div>

        <div className="space-y-2">
          <span className="font-black text-slate-900 block text-xs">الخدمات والمخرجات التنفيذية المشمولة:</span>
          <div className="space-y-2">
            {pkg.fullFeatures.map((feat, idx) => (
              <div key={idx} className="p-2.5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)] space-y-0.5">
                <span className="font-black text-slate-900 block">✓ {feat.title}</span>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between gap-2">
          <a
            href={`https://wa.me/201556221141?text=${encodeURIComponent(`مرحباً دليلك، أود الاستفسار والاشتراك في «${pkg.name}» (${pkg.priceText}).`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>طلب الباقة عبر واتساب</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-xs cursor-pointer border border-[var(--border-color)]"
          >
            إغلاق
          </button>
        </div>
      </div>
    </Modal>
  );
};
