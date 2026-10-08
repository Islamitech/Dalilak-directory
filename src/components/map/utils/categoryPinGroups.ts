import { Business } from '../../../types';
import { getBusinessPinCategoryId } from '../markers/categoryPinStyle';

/**
 * A spatial cluster ("تجمع") is shown as one unified pin PER CATEGORY.
 * Each pin carries the number of activities of that category inside the cluster.
 */
export interface CategoryPinGroup {
  categoryId: string;
  members: Business[];
}

/** Horizontal distance between neighbouring category pins inside one cluster (px). */
export const CATEGORY_PIN_SPACING_X = 48;
/** Vertical distance between rows when a cluster has many categories (px). */
export const CATEGORY_PIN_SPACING_Y = 46;
/** Max category pins per row before wrapping upwards. */
export const CATEGORY_PINS_PER_ROW = 4;

const PIN_BOX_HEIGHT = 54;

/**
 * Max category pins drawn per cluster. At city-overview zoom only the biggest categories
 * are shown so the map stays airy; zooming in splits clusters and reveals the rest.
 */
export function categoryPinLimitForZoom(zoom: number): number {
  return zoom < 15.5 ? 2 : 6;
}

/** Splits a cluster into per-category sub-groups, biggest category first (stable). */
export function splitGroupByCategory(group: Business[], limit: number = Infinity): CategoryPinGroup[] {
  const byCategory = new Map<string, Business[]>();
  for (const biz of group) {
    const id = getBusinessPinCategoryId(biz);
    const list = byCategory.get(id);
    if (list) list.push(biz);
    else byCategory.set(id, [biz]);
  }
  return Array.from(byCategory, ([categoryId, members]) => ({ categoryId, members }))
    .sort((a, b) => b.members.length - a.members.length || a.categoryId.localeCompare(b.categoryId))
    .slice(0, Math.max(1, limit));
}

export function categoryPinKey(groupKey: string, categoryId: string): string {
  return `${groupKey}::${categoryId}`;
}

/**
 * Screen-space offset of the i-th category pin relative to the cluster centre.
 * `dx` shifts the pin horizontally (largest category sits on the right, matching RTL reading order),
 * `rowOffset` lifts wrapped rows upwards.
 */
export function categoryPinOffset(index: number, total: number): { dx: number; rowOffset: number } {
  const row = Math.floor(index / CATEGORY_PINS_PER_ROW);
  const col = index % CATEGORY_PINS_PER_ROW;
  const inRow = Math.min(CATEGORY_PINS_PER_ROW, total - row * CATEGORY_PINS_PER_ROW);
  return {
    dx: ((inRow - 1) / 2 - col) * CATEGORY_PIN_SPACING_X,
    rowOffset: row * CATEGORY_PIN_SPACING_Y,
  };
}

/** On-screen footprint of a cluster made of `categoryCount` category pins. Never smaller than the old 48px badge. */
export function categoryClusterFootprint(categoryCount: number): { width: number; height: number } {
  const perRow = Math.min(Math.max(categoryCount, 1), CATEGORY_PINS_PER_ROW);
  const rows = Math.ceil(Math.max(categoryCount, 1) / CATEGORY_PINS_PER_ROW);
  return {
    width: Math.max(56, perRow * CATEGORY_PIN_SPACING_X + 10),
    height: Math.max(56, PIN_BOX_HEIGHT + (rows - 1) * CATEGORY_PIN_SPACING_Y + 4),
  };
}
