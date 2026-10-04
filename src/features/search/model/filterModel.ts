import { Business } from '../../../types';
import { classifyBusinessCategory } from '../../../utils/categoryMatcher';

export interface CategoryCounts {
  groups: Map<string, number>;
  children: Map<string, number>;
}

export function computeCategoryCounts(businesses: Business[]): CategoryCounts {
  const groups = new Map<string, number>();
  const children = new Map<string, number>();

  for (const business of businesses) {
    const classification = classifyBusinessCategory(business);
    groups.set(classification.mainCategoryId, (groups.get(classification.mainCategoryId) || 0) + 1);
    if (classification.subcategoryId !== 'all') {
      children.set(classification.subcategoryId, (children.get(classification.subcategoryId) || 0) + 1);
    }
  }

  return { groups, children };
}
