import React, { useState } from 'react';
import { Business } from '../types';
import {
  GoogleStylePackage,
  PRICING_TRACKS,
  PRICING_PACKAGES,
  PackageCard,
  CorporateCustomSection,
  PackageDetailModal,
} from '../features/pricing';
import { Button } from '../shared/ui';

export interface PackagesHubProps {
  initialPackageId?: string;
  onSelectPackage?: (packageTitle: string) => void;
  onClose?: () => void;
  mode?: 'admin' | 'public';
  businesses?: Business[];
  onSendPackageBiz?: (biz: Business, packageId?: string) => void;
}

export type { GoogleStylePackage } from '../features/pricing';

export const PackagesHub: React.FC<PackagesHubProps> = ({
  mode = 'public',
}) => {
  const [activeTrack, setActiveTrack] = useState<'foundational' | 'growth' | 'digital'>('foundational');
  const [detailModalPkg, setDetailModalPkg] = useState<GoogleStylePackage | null>(null);
  const [expandedPkgIds, setExpandedPkgIds] = useState<Record<string, boolean>>({});
  const [isCorporateExpanded, setIsCorporateExpanded] = useState<boolean>(false);

  const toggleExpand = (pkgId: string) => {
    setExpandedPkgIds((prev) => ({
      ...prev,
      [pkgId]: !prev[pkgId],
    }));
  };

  const currentTrackPackages = PRICING_PACKAGES.filter((p) => p.track === activeTrack);

  return (
    <div className="space-y-6 font-['Cairo',sans-serif] text-[var(--text-primary)] max-w-6xl mx-auto py-2">
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          باقات وحلول منصة دليلك
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          اختر المسار المناسب لاحتياج منشأتكم بأسعار معتمدة وتنفيذ فوري
        </p>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex p-1 rounded-pill bg-white border border-slate-200 gap-1">
          {PRICING_TRACKS.map((t) => {
            const isActive = activeTrack === t.id;
            return (
              <Button
                key={t.id}
                variant={isActive ? 'primary' : 'ghost'}
                size="sm"
                aria-pressed={isActive}
                onClick={() => setActiveTrack(t.id)}
              >
                {t.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch pt-2">
        {currentTrackPackages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            isExpanded={!!expandedPkgIds[pkg.id]}
            onToggleExpand={() => toggleExpand(pkg.id)}
          />
        ))}
      </div>

      <CorporateCustomSection
        mode={mode}
        isCorporateExpanded={isCorporateExpanded}
        onToggleCorporate={() => setIsCorporateExpanded(!isCorporateExpanded)}
        onOpenModal={(pkg) => setDetailModalPkg(pkg)}
      />

      <PackageDetailModal
        pkg={detailModalPkg}
        onClose={() => setDetailModalPkg(null)}
      />
    </div>
  );
};
