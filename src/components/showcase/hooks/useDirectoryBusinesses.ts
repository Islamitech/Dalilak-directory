import { useMemo } from 'react';
import { Business } from '../../../types';
import { parseActivitySearchIntent } from '../../../utils/activitySearchIntent';
import { filterBusinessesForMap } from '../../../utils/hadayekZoneHelper';
import { computeFilteredBusinesses } from '../model/showcaseFilterModel';
import type { ShowcaseSort } from '../model/showcaseFilterQuery';

type ActivityIntent = ReturnType<typeof parseActivitySearchIntent>;

interface DirectoryBusinessesInput {
  publicBusinesses: Business[];
  activityIntent: ActivityIntent;
  deferredSearchQuery: string;
  categoryFilter: string;
  subcategoryFilter: string;
  effectiveSearchZone: string;
  openNowOnly: boolean;
  verifiedOnly: boolean;
  hasRatingOnly: boolean;
  hasVideoOnly: boolean;
  sortBy: ShowcaseSort;
  userCoords: { lat: number; lng: number } | null;
  shuffleSeed: number;
  pinnedDirectBizId: string | null;
}

/** One Hadayek result set for the map and the activity list. */
export function useDirectoryBusinesses(input: DirectoryBusinessesInput): Business[] {
  const {
    publicBusinesses,
    activityIntent,
    deferredSearchQuery,
    categoryFilter,
    subcategoryFilter,
    effectiveSearchZone,
    openNowOnly,
    verifiedOnly,
    hasRatingOnly,
    hasVideoOnly,
    sortBy,
    userCoords,
    shuffleSeed,
    pinnedDirectBizId,
  } = input;

  return useMemo(() => {
    const listed = computeFilteredBusinesses({
      publicBusinesses,
      activityIntent,
      deferredSearchQuery,
      categoryFilter: activityIntent ? 'all' : categoryFilter,
      subcategoryFilter: activityIntent ? 'all' : subcategoryFilter,
      effectiveSearchZone,
      govFilter: 'all',
      cityFilter: 'all',
      openNowOnly,
      verifiedOnly,
      hasRatingOnly,
      hasVideoOnly,
      sortBy,
      userCoords,
      shuffleSeed,
      pinnedDirectBizId,
    });
    return filterBusinessesForMap(listed, effectiveSearchZone || 'all', 'all', false);
  }, [
    publicBusinesses,
    activityIntent,
    deferredSearchQuery,
    categoryFilter,
    subcategoryFilter,
    effectiveSearchZone,
    openNowOnly,
    verifiedOnly,
    hasRatingOnly,
    hasVideoOnly,
    sortBy,
    userCoords,
    shuffleSeed,
    pinnedDirectBizId,
  ]);
}
