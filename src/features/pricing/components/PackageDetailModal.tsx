import React from 'react';
import { MessageCircle } from 'lucide-react';
import { GoogleStylePackage } from '../model/pricingPackages';
import { Modal } from '../../../shared/ui/Modal';
import { Button, ButtonLink } from '../../../shared/ui/Button';

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
          <span className="text-caption font-extrabold text-amber-700 bg-[var(--input-bg)] px-2 py-0.5 rounded-pill border border-amber-500/20">
            {pkg.badge || 'تفاصيل الباقة'}
          </span>
          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 mt-1">
            {pkg.name}
          </h3>
          <p className="text-xs text-slate-600 font-bold">
            التكلفة: <span className="text-amber-700">{pkg.priceText}</span> ({pkg.billingCadence}) | مدة التنفيذ: {pkg.deliveryTime}
          </p>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-color)]">
          <span className="font-extrabold text-amber-700 block mb-0.5">الفئة المستهدفة:</span>
          <p className="text-caption text-slate-700 font-medium leading-relaxed">{pkg.forWhom}</p>
        </div>

        <div className="space-y-2">
          <span className="font-extrabold text-slate-900 block text-xs">الخدمات والمخرجات التنفيذية المشمولة:</span>
          <div className="space-y-2">
            {pkg.fullFeatures.map((feat, idx) => (
              <div key={idx} className="p-2.5 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-color)] space-y-0.5">
                <span className="font-extrabold text-slate-900 block">✓ {feat.title}</span>
                <p className="text-caption text-slate-700 font-medium leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between gap-2">
          <ButtonLink
            href={`https://wa.me/201556221141?text=${encodeURIComponent(`مرحباً دليلك، أود الاستفسار والاشتراك في «${pkg.name}» (${pkg.priceText}).`)}`}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            className="flex-1"
            leadingIcon={<MessageCircle />}
          >
            طلب الباقة عبر واتساب
          </ButtonLink>
          <Button variant="secondary" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>
    </Modal>
  );
};
