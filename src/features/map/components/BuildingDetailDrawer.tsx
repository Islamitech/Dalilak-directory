import React, { useState } from 'react';
import { Building2, Navigation, ExternalLink, Compass, Store, ChevronDown, ChevronUp } from 'lucide-react';
import { Business } from '../../../types';
import { getHadayekZone, getRecommendedGateForZone } from '../../../shared/data/hadayek/hadayekGeo';
import { isBusinessAssociatedWithBuilding } from '../../../utils/hadayekBuildingSearch';
import { isBusinessInHadayekZone } from '../../../utils/hadayekZoneHelper';
import { getFirstStrongDirection } from '../../../shared/lib/textDirection';
import { Button, Pressable } from '../../../shared/ui';

export interface BuildingDetailData {
  buildingNumber: string;
  zoneLetter: string;
  lat: number;
  lng: number;
}

export interface BuildingDetailDrawerProps {
  building: BuildingDetailData | null;
  onClose: () => void;
  businesses?: Business[];
  onSelectBusiness?: (biz: Business) => void;
  onStartNavigation?: (target: { title: string; lat: number; lng: number; type: 'building' | 'business'; details?: string }) => void;
}

export const BuildingDetailDrawer: React.FC<BuildingDetailDrawerProps> = ({
  building,
  onClose,
  businesses = [],
  onSelectBusiness,
  onStartNavigation,
}) => {
  const [isBusinessesOpen, setIsBusinessesOpen] = useState<boolean>(false);

  if (!building) return null;

  const zone = getHadayekZone(building.zoneLetter);
  const zoneName = zone ? zone.nameAr : `منطقة ${building.zoneLetter}`;
  const gateInfo = getRecommendedGateForZone(building.zoneLetter);

  const matchingBusinesses = businesses.filter((b) =>
    isBusinessInHadayekZone(b, building.zoneLetter) &&
    isBusinessAssociatedWithBuilding(b, building.buildingNumber, building.zoneLetter, building)
  );

  const handleStartNav = () => {
    if (onStartNavigation) {
      onStartNavigation({
        title: `عمارة ${building.buildingNumber} - ${zoneName}`,
        lat: building.lat,
        lng: building.lng,
        type: 'building',
        details: `أقرب بوابة: ${gateInfo.primaryGate.popularNameAr}`,
      });
    }
  };

  const handleOpenGoogleMaps = () => {
    const query = `عمارة ${building.buildingNumber} منطقة ${building.zoneLetter} حدائق الأهرام`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${building.lat},${building.lng}&query=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="dl-msh">
        <span className="dl-msh-ic" aria-hidden="true">
          <Building2 className="w-6 h-6 stroke-[2.2]" />
        </span>
        <div className="dl-msh-t">
          <div className="dl-msh-chips">
            <span className="dl-msh-chip">حدائق الأهرام</span>
            <span className="dl-msh-chip dl-blue">{zoneName}</span>
          </div>
          <h3>عمارة رقم {building.buildingNumber}</h3>
        </div>
      </header>
      <div className="dl-msb">
      {/* Best entry gate */}
      <div className="dl-ir">
        <span className="dl-ico">
          <Compass className="w-4 h-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="dl-il">أفضل مسار دخول</div>
          <div className="dl-iv" dir="auto">
            <span className="min-w-0 break-words">{gateInfo.primaryGate.nameAr}</span>
          </div>
          {gateInfo.primaryGate.accessRoadAr && (
            <div className="dl-il" style={{ fontWeight: 600 }}>{gateInfo.primaryGate.accessRoadAr}</div>
          )}
        </div>
      </div>

      {/* Activities in / near the building */}
      {matchingBusinesses.length > 0 && (
        <>
          <Pressable
            type="button"
            onClick={() => setIsBusinessesOpen((open) => !open)}
            aria-expanded={isBusinessesOpen}
            className="dl-ir"
          >
            <span className="dl-ico dl-gr">
              <Store className="w-4 h-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="dl-il">الأنشطة في نفس المبنى أو قربه</div>
              <div className="dl-iv">
                <span>{matchingBusinesses.length} أنشطة مسجلة</span>
              </div>
            </div>
            <span className="dl-ir-end">
              <span>{isBusinessesOpen ? 'إخفاء' : 'عرض'}</span>
              {isBusinessesOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </Pressable>

          {isBusinessesOpen && (
            <div className="dl-sm">
              <div className="dl-g">
                {matchingBusinesses.map((biz) => (
                  <Pressable
                    key={biz.id}
                    type="button"
                    onClick={() => onSelectBusiness && onSelectBusiness(biz)}
                  >
                    <div className="dl-w">
                      <b dir={getFirstStrongDirection(biz.nameAr)}>
                        <bdi dir="auto">{biz.nameAr}</bdi>
                      </b>
                      <small>{biz.category}</small>
                    </div>
                  </Pressable>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      </div>
      <div className="dl-dbar">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="primary" size="lg" onClick={handleStartNav} leadingIcon={<Navigation />}>
            ابدأ الملاحة
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleOpenGoogleMaps}
            leadingIcon={<ExternalLink className="text-blue-600" />}
          >
            خرائط Google
          </Button>
        </div>
      </div>
    </div>
  );
};
