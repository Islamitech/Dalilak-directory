import type { Business } from '../types';
import {parseActivitySearchIntent} from './activitySearchIntent';
import {matchesBusinessSearch,normalizeArabicText} from './arabicSearch';
import {matchesCategorySelection} from './categoryMatcher';
import {isBusinessInHadayekZone} from './hadayekZoneHelper';
import {getBusinessOpenStatus} from './directoryEnhancements';
export interface DirectoryFilterOptions {activityIntent:ReturnType<typeof parseActivitySearchIntent>;deferredSearchQuery:string;categoryFilter:string;subcategoryFilter:string;effectiveSearchZone:string;govFilter:string;cityFilter:string;openNowOnly:boolean;hasRatingOnly:boolean;hasVideoOnly:boolean;}
export function filterDirectoryBusinesses(businesses:Business[],{activityIntent,deferredSearchQuery,categoryFilter,subcategoryFilter,effectiveSearchZone,govFilter,cityFilter,openNowOnly,hasRatingOnly,hasVideoOnly}:DirectoryFilterOptions):Business[]{
    return businesses.filter((b) => {
      if (!b) return false;

      // 1. Text Search across name, category, city, landmark, etc.
      if (!activityIntent && deferredSearchQuery.trim()) {
        if (!matchesBusinessSearch(b, deferredSearchQuery)) {
          return false;
        }
      }

      // 2. Category Filter (Enhanced with Canonical Aliases, Root Synonyms, and Groups)
      if (activityIntent || categoryFilter !== 'all') {
        if (!matchesCategorySelection(b, activityIntent?.mainCategoryId ?? categoryFilter, activityIntent?.subcategoryId ?? subcategoryFilter)) {
          return false;
        }
      }

      // 3. Hadayek Zone Filter (Strict Zone Boundary Protection)
      if (effectiveSearchZone && effectiveSearchZone !== 'all') {
        if (!isBusinessInHadayekZone(b, effectiveSearchZone)) {
          return false;
        }
      }

      // 4. Governorate Filter
      if (govFilter !== 'all') {
        const safeGov = (b.governorate || '').toLowerCase().trim();
        const safeTarget = govFilter.toLowerCase().trim();
        if (!safeGov.includes(safeTarget) && !safeTarget.includes(safeGov)) {
          return false;
        }
      }

      // 4. City & Area Filter
      if (cityFilter !== 'all') {
        const normCity = normalizeArabicText(cityFilter);
        const normBizAddress = normalizeArabicText(
          `${b.city || ''} ${b.street || ''} ${b.landmark || ''} ${b.governorate || ''}`
        );

        if (normCity.includes('حدايق الاهرام') || normCity.includes('هضبه الاهرام')) {
          // Search cards, counters and map pins must share the same geographic
          // authority. A broad rectangle allowed nearby activities to appear in
          // lists while disappearing from the selected district on the map.
          if (!isBusinessInHadayekZone(b, 'all')) return false;

          if (effectiveSearchZone !== 'all') {
            if (!isBusinessInHadayekZone(b, effectiveSearchZone)) {
              return false;
            }
          }

        }

        const mainKeyword = normCity.split('(')[0].trim();
        if (!(normCity.includes('حدايق الاهرام') || normCity.includes('هضبه الاهرام')) && !normBizAddress.includes(mainKeyword) && !(b.city && normCity.includes(normalizeArabicText(b.city)))) {
          return false;
        }
      }

      // 5. Open Now Filter
      if (openNowOnly) {
        const status = getBusinessOpenStatus(b.workingHours);
        if (!status.isOpen) return false;
      }

      // 6. Has Rating Filter
      if (hasRatingOnly) {
        if (!b.googleRatingEnabled || !b.googleRating || b.googleRating <= 0) return false;
      }

      // 7. Has Video Filter
      if (hasVideoOnly) {
        if (!b.videos || b.videos.length === 0) return false;
      }

      return true;
    });
}
