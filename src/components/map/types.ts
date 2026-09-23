import { Business } from '../../types';
import { LocationAddressData } from '../../utils/geocoding';

export interface InteractiveMapProps {
  mode?: 'picker' | 'view';
  lat?: number;
  lng?: number;
  onLocationSelect?: (lat: number, lng: number, addressDetails?: LocationAddressData) => void;
  businesses?: Business[];
  onSelectBusiness?: (biz: Business) => void;
  onEditBusiness?: (biz: Business) => void;
  heightClass?: string;
  targetBuilding?: {
    zoneLetter?: string;
    buildingNumber?: string;
    lat?: number;
    lng?: number;
  } | null;
  showHadayekGates?: boolean;
  selectedZone?: string;
  onSelectZone?: (zoneLetter: string) => void;
  categoryFilter?: string;
  onCategoryChange?: (category: string) => void;
  initialShowBusinesses?: boolean;
  onToggleBusinessesVisibility?: (visible: boolean) => void;
  defaultExpanded?: boolean;
  onExploreDirectory?: () => void;
  onOpenGatesGuide?: () => void;
  quickCategories?: Array<{ id: string; name: string; icon: string; count?: number }>;
}
