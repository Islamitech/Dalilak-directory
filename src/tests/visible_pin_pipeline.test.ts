import { describe, expect, it } from 'vitest';
import { Business } from '../types';
import { buildVisiblePinPipeline } from '../components/map/utils/visiblePinPipeline';

function biz(id: string, lng = 31): Business {
  return { id, nameAr: id, nameEn: id, category: 'مطاعم', governorate: 'الجيزة', city: 'حدائق الأهرام', street: '', landmark: '', lat: 30, lng, phone: '', verificationStatus: 'verified', createdAt: '', createdDate: '', description: '', workingHours: '', photos: [], isFeatured: false };
}

describe('visible pin pipeline', () => {
  it('applies viewport culling and selected-pin isolation before grouping', () => {
    const selected = biz('selected');
    const visible = biz('visible', 31.01);
    const outside = biz('outside', 32);
    const result = buildVisiblePinPipeline({ businesses: [selected, visible, outside], selectedBusinessId: 'selected', contains: (_lat, lng) => lng < 31.5, project: b => ({ x: b.lng * 100, y: 0 }), point: b => ({ x: b.lng * 100, y: 100 }), zoom: 16, hasSelectedZone: true });
    expect(result.groups.flat().map(b => b.id)).toEqual(['visible']);
    expect(result.singletonIds).toEqual(new Set(['visible']));
  });

  it('selects one featured overview card and collision-hides the overlapping candidate', () => {
    const items = [biz('a-top'), biz('b-nearby', 31.001), biz('c-other', 31.1)];
    const result = buildVisiblePinPipeline({ businesses: items, contains: () => true, project: b => ({ x: b.lng * 100000, y: 0 }), point: b => ({ x: b.lng < 31.01 ? 100 : 300, y: 200 }), zoom: 14, hasSelectedZone: false });
    expect(result.layouts.get('a-top')?.type).toBe('card');
    expect(result.layouts.has('b-nearby')).toBe(false);
    expect(result.singletonIds.has('b-nearby')).toBe(false);
    expect(result.layouts.get('c-other')?.type).toBe('card');
  });

  it('hides dots that collide with cluster footprints while keeping free-standing markers', () => {
    const clusterA = biz('cluster-a', 31);
    const clusterB = biz('cluster-b', 31.0001);
    const nearDot = biz('near-dot', 31.0013);
    const farBiz = biz('far-biz', 31.4);
    const result = buildVisiblePinPipeline({
      businesses: [clusterA, clusterB, nearDot, farBiz], contains: () => true,
      project: b => ({ x: b.lng * 100000, y: 0 }),
      point: b => ({ x: b.lng < 31.0005 ? 100 : b.lng < 31.002 ? 130 : 400, y: 200 }),
      zoom: 14, hasSelectedZone: false,
    });
    expect(result.clusterKeys.size).toBe(1);
    expect(result.layouts.has('near-dot')).toBe(false);
    expect(result.singletonIds.has('near-dot')).toBe(false);
    expect(result.layouts.has('far-biz')).toBe(true);
  });

  it('reserves the selected card footprint so background cards cannot render underneath it', () => {
    const selected = biz('selected');
    const neighbor = biz('neighbor', 31.02);
    const result = buildVisiblePinPipeline({
      businesses: [selected, neighbor], selectedBusiness: selected, contains: () => true,
      project: b => ({ x: b.lng * 1000, y: 0 }),
      point: b => ({ x: b.id === 'selected' ? 100 : 120, y: 200 }),
      zoom: 17, hasSelectedZone: true,
    });
    expect(result.groups.flat().map(b => b.id)).toEqual(['neighbor']);
    expect(result.layouts.get('neighbor')?.type).toBe('dot');
  });
});
