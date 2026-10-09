import { useMemo } from 'react';
import { parseActivitySearchIntent } from '../../../utils/activitySearchIntent';
import { resolveCategorySelection } from '../../../utils/categoryMatcher';
import { getMapBusinessSearchMatches } from '../../../utils/mapSearch';
import { isBusinessInHadayekZone } from '../../../utils/hadayekZoneHelper';
import { Business } from '../../../types';
import { parseHadayekBuildingAddress } from '../../../utils/hadayekBuildingSearch';
import { searchBuildingCoordinatesExact, getRecommendedGateForZone } from '../../../shared/data/hadayek/hadayekGeo';
import { getDistrictByLetter } from '../../../shared/data/hadayek/hadayekDistrictsGeoData';
import { MAP_QUICK_CATEGORIES } from '../constants/mapConstants';

export interface UseMapSearchMatchesParams {
  searchQuery: string;
  selectedZone: string;
  businesses: Business[];
  searchableBusinesses?: Business[];
  quickCategories?: Array<{ id: string; name: string; icon: string; count?: number }>;
}

export function useMapSearchMatches({
  searchQuery,
  selectedZone,
  businesses,
  searchableBusinesses,
  quickCategories,
}: UseMapSearchMatchesParams) {
  const categories: Array<{ id: string; name: string; icon: string; count?: number }> = (
    quickCategories?.length ? quickCategories : MAP_QUICK_CATEGORIES
  ).map((category) => {
    const selection = resolveCategorySelection(category.id);
    return { ...category, id: selection.subcategoryId !== 'all' ? selection.subcategoryId : selection.mainCategoryId };
  });

  const buildingMatch = useMemo(() => {
    return parseHadayekBuildingAddress(searchQuery, selectedZone);
  }, [searchQuery, selectedZone]);

  const digitOnlyMatches = useMemo(() => {
    const q = searchQuery.trim();
    if (!buildingMatch && /^\d+$/.test(q)) {
      const topZones = ['أ', 'ب', 'ج', 'ح', 'ع', 'ك', 'ل'];
      return topZones.map((z) => ({
        buildingNumber: q,
        zoneLetter: z,
        gate: getRecommendedGateForZone(z).primaryGate.popularNameAr,
      }));
    }
    return [];
  }, [searchQuery, buildingMatch]);

  const matchingBusinesses = useMemo(() => {
    if (!searchQuery.trim() || buildingMatch) return [];
    return getMapBusinessSearchMatches(searchableBusinesses || businesses, searchQuery, 5);
  }, [searchQuery, businesses, searchableBusinesses, buildingMatch]);

  const outsideSelectedZoneBusinesses = useMemo(() => {
    if (!selectedZone || selectedZone === 'all') return [];
    return matchingBusinesses.filter((biz) => !isBusinessInHadayekZone(biz, selectedZone));
  }, [matchingBusinesses, selectedZone]);

  const activityIntent = useMemo(() => parseActivitySearchIntent(searchQuery), [searchQuery]);

  const matchingCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2 || buildingMatch) return [];
    if (activityIntent) return [{ id: activityIntent.category, name: searchQuery.trim(), icon: '🔎' }];
    return categories.filter((c) => c.id !== 'all' && (c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)));
  }, [searchQuery, categories, buildingMatch, activityIntent]);

  const matchingZone = useMemo(() => {
    const q = searchQuery.trim();
    if (!q || buildingMatch) return null;
    return getDistrictByLetter(q);
  }, [searchQuery, buildingMatch]);

  return {
    categories,
    buildingMatch,
    digitOnlyMatches,
    matchingBusinesses,
    outsideSelectedZoneBusinesses,
    activityIntent,
    matchingCategories,
    matchingZone,
  };
}
