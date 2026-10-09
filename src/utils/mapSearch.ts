import { Business } from '../types';
import { matchesBusinessSearch } from '../shared/lib/arabicSearch';
import { isBusinessInHadayekZone } from './hadayekZoneHelper';

/** Explicit map text search is independent from residual category/district filters. */
export function getMapBusinessSearchMatches(businesses: Business[], query: string, limit = 5): Business[] {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];
  return businesses
    .filter((business) => isBusinessInHadayekZone(business, 'all'))
    .filter((business) => matchesBusinessSearch(business, cleanQuery))
    .slice(0, limit);
}

export function isSearchSelectedBusiness(business: Business | null, query: string): boolean {
  return Boolean(business && query.trim() && matchesBusinessSearch(business, query));
}
