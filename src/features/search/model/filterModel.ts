import { Business } from '../../../types';
import { classifyBusinessCategory } from '../../../utils/categoryMatcher';

export interface CategoryCounts {
  groups: Map<string, number>;
  children: Map<string, number>;
}

export interface QuickCategoryItem {
  id: string;
  name: string;
  shortName: string;
  icon: string;
}

export const INTEGRATED_FILTER_CATEGORIES: QuickCategoryItem[] = [
  { id: 'food', name: 'مطاعم وكافيهات', shortName: 'مطاعم', icon: '🍽️' },
  { id: 'grocery', name: 'سوبر ماركت', shortName: 'سوبرماركت', icon: '🛒' },
  { id: 'health', name: 'صيدليات وعيادات', shortName: 'صيدليات وعيادات', icon: '💊' },
  { id: 'fashion', name: 'ملابس وأزياء', shortName: 'ملابس', icon: '👗' },
  { id: 'automotive', name: 'صيانة سيارات', shortName: 'سيارات', icon: '🔧' },
  { id: 'education', name: 'تعليم وخدمات', shortName: 'تعليم', icon: '🏫' },
  { id: 'crafts', name: 'صيانة وحرفيين', shortName: 'صيانة', icon: '🔨' },
  { id: 'electronics', name: 'إلكترونيات وهواتف', shortName: 'إلكترونيات', icon: '📱' },
  { id: 'home', name: 'أثاث وديكور', shortName: 'أثاث', icon: '🛋️' },
  { id: 'beauty-fitness', name: 'تجميل ولياقة', shortName: 'تجميل', icon: '💇‍♂️' },
  { id: 'travel-events', name: 'سياحة ومناسبات', shortName: 'سياحة', icon: '🏨' },
  { id: 'stationery-printing', name: 'مكتبات وطباعة', shortName: 'مكتبات', icon: '📚' },
  { id: 'professional-services', name: 'خدمات وشركات', shortName: 'شركات', icon: '🏢' },
  { id: 'other', name: 'أنشطة أخرى', shortName: 'أخرى', icon: '📍' },
];

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
