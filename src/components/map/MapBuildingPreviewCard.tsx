import React, { useMemo } from 'react';
import { Building2, ChevronLeft, Store, X } from 'lucide-react';
import { Business } from '../../types';
import { getHadayekZone } from '../../data/hadayekAtlasData';
import { isBusinessAssociatedWithBuilding } from '../../utils/hadayekBuildingSearch';
import { isBusinessInHadayekZone } from '../../utils/hadayekZoneHelper';
import { formatNearbyActivityCount } from '../../shared/lib/format';

interface MapBuildingPreviewCardProps {
  building: {
    buildingNumber: string;
    zoneLetter: string;
    lat: number;
    lng: number;
  };
  businesses: Business[];
  onOpenDetails: () => void;
  onClose: () => void;
}

export const MapBuildingPreviewCard: React.FC<MapBuildingPreviewCardProps> = ({
  building,
  businesses,
  onOpenDetails,
  onClose,
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
    <section
      aria-label={`معاينة عمارة ${building.buildingNumber}`}
      data-map-sheet dir="rtl" className="dl-msheet dl-msheet-preview pointer-events-auto"
    >
      <div className="flex items-center gap-3 p-3">
        <div className="dl-msh-ic">
          <Building2 className="h-6 w-6 stroke-[2.5]" />
        </div>

        <button
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
            <Store className="h-3.5 w-3.5 text-emerald-600" />
            <span>{formatNearbyActivityCount(associatedBusinessesCount)}</span>
            <span className="ms-auto inline-flex items-center gap-0.5 text-amber-700">
              التفاصيل <ChevronLeft className="h-3.5 w-3.5" />
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق معاينة المبنى"
          className="dl-msx"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};
