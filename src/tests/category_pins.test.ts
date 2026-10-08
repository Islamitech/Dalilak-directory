import { describe, expect, it } from 'vitest';
import { Business } from '../types';
import {
  CATEGORY_PIN_STYLES,
  getBusinessPinCategoryId,
  getCategoryPinStyle,
} from '../components/map/markers/categoryPinStyle';
import {
  categoryClusterFootprint,
  categoryPinKey,
  categoryPinOffset,
  splitGroupByCategory,
} from '../components/map/utils/categoryPinGroups';
import { createCategoryClusterPinHtml, createCompactActivityPinHtml } from '../components/map/badgeMarkers';
import { buildVisiblePinPipeline } from '../components/map/utils/visiblePinPipeline';
import { INTEGRATED_FILTER_CATEGORIES } from '../features/search/model/filterModel';

function biz(id: string, category: string, lng = 31): Business {
  return { id, nameAr: id, nameEn: id, category, governorate: 'الجيزة', city: 'حدائق الأهرام', street: '', landmark: '', lat: 30, lng, phone: '', verificationStatus: 'verified', createdAt: '', createdDate: '', description: '', workingHours: '', photos: [], isFeatured: false };
}

describe('unified category pins', () => {
  it('defines a style (colour + icon) for every directory filter category', () => {
    for (const cat of INTEGRATED_FILTER_CATEGORIES) {
      const style = CATEGORY_PIN_STYLES[cat.id];
      expect(style, cat.id).toBeTruthy();
      expect(style.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(style.iconSvg.length).toBeGreaterThan(10);
    }
  });

  it('uses a distinct colour per category', () => {
    const colors = Object.values(CATEGORY_PIN_STYLES).map((s) => s.color);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('falls back to the "other" style for unknown ids', () => {
    expect(getCategoryPinStyle('nope').id).toBe('other');
    expect(getCategoryPinStyle(undefined).id).toBe('other');
  });

  it('splits a cluster into per-category groups with counts, largest first', () => {
    const group = [
      biz('r1', 'مطاعم'), biz('r2', 'مطاعم'), biz('r3', 'مطاعم'),
      biz('p1', 'صيدليات'), biz('p2', 'صيدليات'),
      biz('c1', 'سيارات'),
    ];
    const split = splitGroupByCategory(group);
    expect(split.map((s) => [s.categoryId, s.members.length])).toEqual([
      ['food', 3],
      ['health', 2],
      ['automotive', 1],
    ]);
    expect(split.flatMap((s) => s.members).length).toBe(group.length);
  });

  it('keeps single and cluster pins on the same teardrop with the category colour', () => {
    const b = biz('x', 'مطاعم');
    const style = getCategoryPinStyle(getBusinessPinCategoryId(b));
    const single = createCompactActivityPinHtml(b, false).html;
    const cluster = createCategoryClusterPinHtml('food', 5).html;
    expect(single).toContain(`fill="${style.color}"`);
    expect(cluster).toContain(`fill="${style.color}"`);
    const path = (html: string) => /<path d="(M15 37\.2[^"]+)"/.exec(html)?.[1];
    expect(path(single)).toBeTruthy();
    expect(path(single)).toBe(path(cluster));
  });

  it('never draws activity counts on pins', () => {
    expect(createCategoryClusterPinHtml('food', 1).html).not.toContain('category-pin-count');
    expect(createCategoryClusterPinHtml('food', 7).html).not.toContain('category-pin-count');
    expect(createCategoryClusterPinHtml('food', 250).html).not.toContain('99+');
  });

  it('fans category pins out symmetrically and wraps rows upwards', () => {
    expect(categoryPinOffset(0, 1)).toEqual({ dx: 0, rowOffset: 0 });
    const [a, b] = [categoryPinOffset(0, 2), categoryPinOffset(1, 2)];
    expect(a.dx).toBe(-b.dx);
    expect(a.dx).toBeGreaterThan(0);
    expect(categoryPinOffset(4, 6).rowOffset).toBeGreaterThan(0);
    expect(categoryClusterFootprint(6).height).toBeGreaterThan(categoryClusterFootprint(2).height);
    expect(categoryClusterFootprint(1).width).toBeGreaterThanOrEqual(48);
  });

  it('builds distinct registry keys per category inside one cluster', () => {
    expect(categoryPinKey('g', 'food')).not.toBe(categoryPinKey('g', 'health'));
  });

  it('groups by screen proximity at city zoom so a wide gathering still becomes category pins', () => {
    // ~400 m apart: separate at local zoom, one gathering at city zoom.
    const items = [biz('a', 'مطاعم', 31), biz('b', 'صيدليات', 31.004)];
    const base = {
      businesses: items, contains: () => true,
      project: (b: Business) => ({ x: b.lng === 31 ? 100 : 130, y: 0 }),
      point: (b: Business) => ({ x: b.lng === 31 ? 100 : 130, y: 200 }),
      hasSelectedZone: false,
    };
    expect(buildVisiblePinPipeline({ ...base, zoom: 14 }).clusterKeys.size).toBe(1);
    expect(buildVisiblePinPipeline({ ...base, zoom: 17 }).clusterKeys.size).toBe(0);
  });
});
