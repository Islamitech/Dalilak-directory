import React, { useMemo } from 'react';
import { Pressable } from '../../../shared/ui';
import { Building2, ChevronLeft, Store } from 'lucide-react';
import { Business } from '../../../types';
import { getHadayekZone } from '../../../shared/data/hadayek/hadayekGeo';
import { isBusinessAssociatedWithBuilding } from '../../../utils/hadayekBuildingSearch';
import { isBusinessInHadayekZone } from '../../../utils/hadayekZoneHelper';
import { formatNearbyActivityCount } from '../../../shared/lib/format';

interface MapBuildingPreviewCardProps {
  building: {
    buildingNumber: string;
    zoneLetter: string;
    lat: number;
    lng: number;
  };
  businesses: Business[];
  onOpenDetails: () => void;
}

export const MapBuildingPreviewCard: React.FC<MapBuildingPreviewCardProps> = ({
  building,
  businesses,
  onOpenDetails,
}) => {
  const zone = getHadayekZone(building.zoneLetter);
  const associatedBusinessesCount = useMemo(
    () =>
      businesses.filter(
        (business) =>
          isBusinessInHadayekZone(business, building.zoneLetter) &&
          isBusinessAssociatedWithBuilding(
            business,
            building.buildingNumber,
            building.zoneLetter,
            building
          )
      ).length,
    [businesses, building]
  );

  return (
    <div className="flex items-center gap-3 p-3" dir="rtl">
        <div className="dl-msh-ic">
          <Building2 className="h-6 w-6 stroke-[2.5]" />
        </div>

        <Pressable
          type="button"
          onClick={onOpenDetails}
          className="min-w-0 flex-1 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          aria-label={`تفاصيل عمارة ${building.buildingNumber}`}
        >
          <div className="mb-1 flex items-center gap-1.5">
            <span className="dl-msh-chip">
              مبنى
            </span>
            <span className="dl-msh-chip dl-blue truncate">
              {zone?.nameAr || `منطقة ${building.zoneLetter}`}
            </span>
          </div>
          <div className="truncate text-sm font-extrabold text-slate-900">
            عمارة رقم {building.buildingNumber}
          </div>
          <div className="mt-1 flex items-center gap-1 text-caption font-bold text-slate-500">
            <Store className="h-3.5 w-3.5 text-[var(--brand-ink)]" />
            <span>{formatNearbyActivityCount(associatedBusinessesCount)}</span>
            <span className="ms-auto inline-flex items-center gap-0.5 text-amber-700">
              التفاصيل <ChevronLeft className="h-3.5 w-3.5" />
            </span>
          </div>
        </Pressable>
      </div>
  );
};
