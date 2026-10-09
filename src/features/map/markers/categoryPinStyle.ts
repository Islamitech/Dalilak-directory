import { Business } from '../../../types';
import { classifyBusinessCategory } from '../../../utils/categoryMatcher';

/**
 * 📍 Unified map-pin visual identity.
 *
 * Every activity pin shares ONE shape (teardrop). The only things that vary are
 * the category colour and the category glyph. The 14 ids below are the same
 * main-category ids used by the directory filters (INTEGRATED_FILTER_CATEGORIES),
 * so a pin always matches what the user sees in the category filter.
 */
export interface CategoryPinStyle {
  id: string;
  label: string;
  color: string;
  /** Inner SVG markup for a 24x24 viewBox, drawn with a white stroke. */
  iconSvg: string;
}

const CIRCLE_DOTS =
  '<circle cx="5" cy="12" r="1.3" fill="#ffffff"/><circle cx="12" cy="12" r="1.3" fill="#ffffff"/><circle cx="19" cy="12" r="1.3" fill="#ffffff"/>';

export const CATEGORY_PIN_STYLES: Record<string, CategoryPinStyle> = {
  food: {
    id: 'food',
    label: 'مطاعم وكافيهات',
    color: '#d97706',
    iconSvg: '<path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2M15 2v19M5 2v4a3 3 0 0 0 3 3v0a3 3 0 0 0 3-3V2M8 9v12"/>',
  },
  grocery: {
    id: 'grocery',
    label: 'سوبر ماركت',
    color: '#16a34a',
    iconSvg:
      '<circle cx="8" cy="21" r="1.5" fill="#ffffff"/><circle cx="19" cy="21" r="1.5" fill="#ffffff"/><path d="M2.5 2.5h2.5l2.4 12a2 2 0 0 0 2 1.6h9.6a2 2 0 0 0 1.9-1.5l1.6-7.5H5.4"/>',
  },
  health: {
    id: 'health',
    label: 'صيدليات وعيادات',
    color: '#0284c7',
    iconSvg: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7ZM8.5 8.5l7 7"/>',
  },
  fashion: {
    id: 'fashion',
    label: 'ملابس وأزياء',
    color: '#9333ea',
    iconSvg:
      '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
  },
  automotive: {
    id: 'automotive',
    label: 'صيانة سيارات',
    color: '#dc2626',
    iconSvg:
      '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="1.8" fill="#ffffff"/><path d="M9 17h6"/><circle cx="17" cy="17" r="1.8" fill="#ffffff"/>',
  },
  education: {
    id: 'education',
    label: 'تعليم وخدمات',
    color: '#4338ca',
    iconSvg: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
  },
  crafts: {
    id: 'crafts',
    label: 'صيانة وحرفيين',
    color: '#78350f',
    iconSvg:
      '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  },
  electronics: {
    id: 'electronics',
    label: 'إلكترونيات وهواتف',
    color: '#0f766e',
    iconSvg: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  },
  home: {
    id: 'home',
    label: 'أثاث وديكور',
    color: '#c2410c',
    iconSvg:
      '<path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M4 18v2"/><path d="M20 18v2"/>',
  },
  'beauty-fitness': {
    id: 'beauty-fitness',
    label: 'تجميل ولياقة',
    color: '#db2777',
    iconSvg:
      '<path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11"/>',
  },
  'travel-events': {
    id: 'travel-events',
    label: 'سياحة ومناسبات',
    color: '#0891b2',
    iconSvg: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
  },
  'stationery-printing': {
    id: 'stationery-printing',
    label: 'مكتبات وطباعة',
    color: '#65a30d',
    iconSvg:
      '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  },
  'professional-services': {
    id: 'professional-services',
    label: 'خدمات وشركات',
    color: '#1e3a8a',
    iconSvg: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  },
  other: {
    id: 'other',
    label: 'أنشطة أخرى',
    color: '#64748b',
    iconSvg: CIRCLE_DOTS,
  },
};

export const CATEGORY_PIN_FALLBACK_ID = 'other';

export function getCategoryPinStyle(categoryId?: string | null): CategoryPinStyle {
  return (categoryId && CATEGORY_PIN_STYLES[categoryId]) || CATEGORY_PIN_STYLES[CATEGORY_PIN_FALLBACK_ID];
}

const categoryIdCache = new WeakMap<object, { key: string; id: string }>();

/**
 * Resolves the 14-way main category id used for pin colour/icon and for
 * per-category counting inside clusters. Cached per business object because
 * the pin pipeline asks for it repeatedly while panning/zooming.
 */
export function getBusinessPinCategoryId(biz: Business): string {
  const key = `${biz.mainCategoryId || ''}|${biz.category || ''}`;
  const cached = categoryIdCache.get(biz);
  if (cached && cached.key === key) return cached.id;
  const resolved = classifyBusinessCategory(biz).mainCategoryId;
  const id = CATEGORY_PIN_STYLES[resolved] ? resolved : CATEGORY_PIN_FALLBACK_ID;
  categoryIdCache.set(biz, { key, id });
  return id;
}
