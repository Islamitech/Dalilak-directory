import { useMemo } from 'react';
import { useDirectoryLoad } from '../../../features/catalog';
import { Business } from '../../../types';
import { parseActivitySearchIntent } from '../../../utils/activitySearchIntent';
import { filterBusinessesForMap } from '../../../utils/hadayekZoneHelper';
import type { DirectoryScope } from '../../../utils/directoryScope';
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
  directoryScope: DirectoryScope;
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
    directoryScope,
  } = input;
  const catalogSettled = !useDirectoryLoad().pending;

  return useMemo(() => {
    const openScope = directoryScope === 'all';
    const source = openScope
      ? publicBusinesses
      : filterBusinessesForMap(publicBusinesses, 'all', 'all', false);
    return computeFilteredBusinesses({
      publicBusinesses: source,
      activityIntent,
      deferredSearchQuery,
      categoryFilter: activityIntent ? 'all' : categoryFilter,
      subcategoryFilter: activityIntent ? 'all' : subcategoryFilter,
      effectiveSearchZone: openScope ? 'all' : effectiveSearchZone,
      govFilter: 'all',
      cityFilter: 'all',
      openNowOnly,
      verifiedOnly,
      hasRatingOnly,
      hasVideoOnly,
      sortBy,
      userCoords,
      shuffleSeed: openScope ? shuffleSeed + 1000003 : shuffleSeed,
      pinnedDirectBizId,
      catalogSettled,
    });
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
    catalogSettled,
    directoryScope,
  ]);
}
