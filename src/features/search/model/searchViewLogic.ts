import { Business } from '../../../types';

export interface SearchViewProps {
  filteredBusinesses: Business[];
  allBusinesses: Business[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedGov: string;
  onGovChange: (g: string) => void;
  selectedCity: string;
  onCityChange: (c: string) => void;
  selectedZone: string;
  onZoneChange: (z: string) => void;
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  subcategoryFilter: string;
  onSubcategoryChange: (cat: string) => void;
  sortBy: 'default' | 'nearest' | 'newest' | 'has_video' | 'open_now' | 'alpha';
  onSortChange: (s: any) => void;
  openNowOnly: boolean;
  onToggleOpenNow: () => void;
  hasRatingOnly: boolean;
  onToggleHasRating: () => void;
  hasVideoOnly: boolean;
  onToggleHasVideo: () => void;
  userCoords: { lat: number; lng: number } | null;
  isLocatingUser: boolean;
  onRequestLocation: () => void;
  onOpenBusiness: (biz: Business) => void;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
  onResetAllFilters: () => void;
  hasActiveFilters: boolean;
  onOpenVideoModal?: (biz: Business) => void;
  onNavigate: (path: string) => void;
  onReshuffle?: () => void;
}

export function computeFeaturedBusinesses(allBusinesses: Business[]): Business[] {
  const verified = allBusinesses.filter((b) => b.verificationStatus === 'verified' && !b.isDeleted);
  const withMedia = verified.filter((b) => (b.photos && b.photos.length > 0) || b.coverPhoto);
  const pool = withMedia.length >= 6 ? withMedia : verified.length >= 6 ? verified : allBusinesses;
  return pool.slice(0, 6);
}

export function handleLocationSelection(
  val: string,
  onGovChange: (g: string) => void,
  onCityChange: (c: string) => void
): void {
  if (val === 'all') {
    onGovChange('all');
    onCityChange('all');
  } else if (val === 'حدائق الأهرام') {
    onGovChange('الجيزة');
    onCityChange('حدائق الأهرام');
  } else if (['مدينة 6 أكتوبر', 'مدينة الشيخ زايد', 'الهرم', 'فيصل', 'الدقي', 'المهندسين'].includes(val)) {
    onGovChange('الجيزة');
    onCityChange(val);
  } else {
    onGovChange(val);
    onCityChange('all');
  }
}
