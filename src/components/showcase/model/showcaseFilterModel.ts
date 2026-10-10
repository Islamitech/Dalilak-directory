import { Business } from '../../../types';
import {
  calculateDistanceKm,
  getBusinessOpenStatus,
  shuffleBusinessesWithSeed,
} from '../../../utils/directoryEnhancements';
import { filterDirectoryBusinesses } from '../../../utils/directoryFiltering';
import { orderUnfilteredPreview } from './previewOrder';

export interface FilterBusinessesParams {
  publicBusinesses: Business[];
  activityIntent: any;
  deferredSearchQuery: string;
  categoryFilter: string;
  subcategoryFilter: string;
  effectiveSearchZone: string;
  govFilter: string;
  cityFilter: string;
  openNowOnly: boolean;
  verifiedOnly?: boolean;
  hasRatingOnly: boolean;
  hasVideoOnly: boolean;
  sortBy: 'default' | 'nearest' | 'newest' | 'has_video' | 'open_now' | 'alpha' | 'rating' | 'reviews' | 'name';
  userCoords: { lat: number; lng: number } | null;
  shuffleSeed: number;
  pinnedDirectBizId: string | null;
  /** False while a cold catalog sync is still paging in. */
  catalogSettled?: boolean;
}

export function computeFilteredBusinesses({
  publicBusinesses,
  activityIntent,
  deferredSearchQuery,
  categoryFilter,
  subcategoryFilter,
  effectiveSearchZone,
  govFilter,
  cityFilter,
  openNowOnly,
  verifiedOnly,
  hasRatingOnly,
  hasVideoOnly,
  sortBy,
  userCoords,
  shuffleSeed,
  pinnedDirectBizId,
  catalogSettled = true,
}: FilterBusinessesParams): Business[] {
  const list = filterDirectoryBusinesses(publicBusinesses, {
    activityIntent,
    deferredSearchQuery,
    categoryFilter,
    subcategoryFilter,
    effectiveSearchZone,
    govFilter,
    cityFilter,
    openNowOnly,
    verifiedOnly,
    hasRatingOnly,
    hasVideoOnly,
  });

  if (sortBy === 'nearest' && userCoords) {
    return [...list].sort((a, b) => {
      const distA = calculateDistanceKm(userCoords.lat, userCoords.lng, a.lat, a.lng);
      const distB = calculateDistanceKm(userCoords.lat, userCoords.lng, b.lat, b.lng);
      return distA - distB;
    });
  } else if (sortBy === 'rating') {
    return [...list].sort((a, b) => (b.googleRating || 0) - (a.googleRating || 0));
  } else if (sortBy === 'reviews') {
    return [...list].sort((a, b) => (b.googleReviewsCount || 0) - (a.googleReviewsCount || 0));
  } else if (sortBy === 'name' || sortBy === 'alpha') {
    return [...list].sort((a, b) => (a.nameAr || '').localeCompare(b.nameAr || '', 'ar'));
  } else if (sortBy === 'newest') {
    return [...list].sort(
      (a, b) => new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime()
    );
  } else if (sortBy === 'has_video') {
    return [...list].sort((a, b) => (b.videos?.length || 0) - (a.videos?.length || 0));
  } else if (sortBy === 'open_now') {
    return [...list].sort((a, b) => {
      const aOpen = getBusinessOpenStatus(a.workingHours).isOpen ? 1 : 0;
      const bOpen = getBusinessOpenStatus(b.workingHours).isOpen ? 1 : 0;
      return bOpen - aOpen;
    });
  }

  if (pinnedDirectBizId && sortBy === 'default') {
    const pinnedBiz = list.find((b) => b.id === pinnedDirectBizId);
    if (pinnedBiz) {
      const rest = list.filter((b) => b.id !== pinnedDirectBizId);
      const sameCategoryAndCity: Business[] = [];
      const sameCategoryOtherCity: Business[] = [];
      const otherBusinesses: Business[] = [];

      rest.forEach((b) => {
        const isSameCat = b.category && pinnedBiz.category && b.category.trim() === pinnedBiz.category.trim();
        const isSameCity = b.city && pinnedBiz.city && b.city.trim().toLowerCase() === pinnedBiz.city.trim().toLowerCase();
        if (isSameCat && isSameCity) {
          sameCategoryAndCity.push(b);
        } else if (isSameCat) {
          sameCategoryOtherCity.push(b);
        } else {
          otherBusinesses.push(b);
        }
      });

      const shuffledSameCatCity = shuffleBusinessesWithSeed(sameCategoryAndCity, shuffleSeed);
      const shuffledSameCatOther = shuffleBusinessesWithSeed(sameCategoryOtherCity, shuffleSeed + 1);
      const shuffledOther = shuffleBusinessesWithSeed(otherBusinesses, shuffleSeed + 2);

      return [pinnedBiz, ...shuffledSameCatCity, ...shuffledSameCatOther, ...shuffledOther];
    }
  }

  const hasUserFilters =
    deferredSearchQuery.trim() !== '' ||
    govFilter !== 'all' ||
    cityFilter !== 'all' ||
    effectiveSearchZone !== 'all' ||
    categoryFilter !== 'all' ||
    subcategoryFilter !== 'all' ||
    openNowOnly ||
    verifiedOnly ||
    hasRatingOnly ||
    hasVideoOnly;

  if (!hasUserFilters) {
    return orderUnfilteredPreview(list, shuffleSeed, catalogSettled);
  }

  return [...list].sort((a, b) => {
    const aFeatured = a.isFeatured || a.partnerStatus === 'certified' ? 1 : 0;
    const bFeatured = b.isFeatured || b.partnerStatus === 'certified' ? 1 : 0;
    if (bFeatured !== aFeatured) return bFeatured - aFeatured;

    const aHasPhoto = (a.photos?.length || 0) > 0 || !!a.coverPhoto ? 1 : 0;
    const bHasPhoto = (b.photos?.length || 0) > 0 || !!b.coverPhoto ? 1 : 0;
    if (bHasPhoto !== aHasPhoto) return bHasPhoto - aHasPhoto;

    const timeA = new Date(a.createdDate || 0).getTime();
    const timeB = new Date(b.createdDate || 0).getTime();
    if (timeA !== timeB) return timeB - timeA;

    return (a.id || '').localeCompare(b.id || '');
  });
}
