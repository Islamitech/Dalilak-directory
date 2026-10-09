import { Business } from '../../../types';
import { classifyBusinessCategory } from '../../../utils/categoryMatcher';
import { CATEGORY_TAXONOMY } from '../../../data/categoryTaxonomy';

export interface CategoryCounts {
  groups: Map<string, number>;
  children: Map<string, number>;
}

export interface QuickCategoryItem {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  description: string;
}

export const INTEGRATED_FILTER_CATEGORIES: QuickCategoryItem[] = [
  { id: 'food', name: 'مطاعم وكافيهات', icon: '🍽️' },
  { id: 'grocery', name: 'سوبر ماركت', icon: '🛒' },
  { id: 'health', name: 'صيدليات وعيادات', icon: '💊' },
  { id: 'fashion', name: 'ملابس وأزياء', icon: '👗' },
  { id: 'automotive', name: 'صيانة سيارات', icon: '🔧' },
  { id: 'education', name: 'تعليم وخدمات', icon: '🏫' },
  { id: 'crafts', name: 'صيانة وحرفيين', icon: '🔨' },
  { id: 'electronics', name: 'إلكترونيات وهواتف', icon: '📱' },
  { id: 'home', name: 'أثاث وديكور', icon: '🛋️' },
  { id: 'beauty-fitness', name: 'تجميل ولياقة', icon: '💇‍♂️' },
  { id: 'travel-events', name: 'سياحة ومناسبات', icon: '🏨' },
  { id: 'stationery-printing', name: 'مكتبات وطباعة', icon: '📚' },
  { id: 'professional-services', name: 'خدمات وشركات', icon: '🏢' },
  { id: 'other', name: 'أنشطة أخرى', icon: '📍' },
].map((item) => {
  const group = CATEGORY_TAXONOMY.find((entry) => entry.id === item.id);
  return {
    ...item,
    shortName: group?.word || item.name,
    description: group?.description || '',
  };
});

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
