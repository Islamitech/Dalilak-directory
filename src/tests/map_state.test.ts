import { describe, expect, it } from 'vitest';
import { Business } from '../types';
import { createInitialMapState, mapStateReducer } from '../components/map/state/mapState';
import { createMapViewportSnapshot } from '../components/map/state/mapViewport';

describe('map interaction state', () => {
  it('stores query, filters, selected result and viewport together', () => {
    const pharmacy: Business = {
      id: 'pharmacy', nameAr: 'صيدلية ألفا', nameEn: '', category: 'صيدليات', governorate: 'الجيزة', city: 'حدائق الأهرام',
      street: '', landmark: '', phone: '', lat: 29.979184, lng: 31.106863, verificationStatus: 'verified', createdAt: '',
      createdDate: '', description: '', workingHours: '', photos: [], isFeatured: false,
    };
    const viewport = createMapViewportSnapshot({
      getCenter: () => ({ lat: 29.97, lng: 31.1 }),
      getZoom: () => 15.5,
      getBounds: () => ({ getSouthWest: () => ({ lat: 29.9, lng: 31 }), getNorthEast: () => ({ lat: 30, lng: 31.2 }) }),
      getSize: () => ({ x: 360, y: 640 }),
    }, 1);
    let state = createInitialMapState();
    state = mapStateReducer(state, { type: 'search/set', query: 'صيدلية ألفا' });
    state = mapStateReducer(state, { type: 'zone/set', zone: 'ب' });
    state = mapStateReducer(state, { type: 'category/set', category: 'مطاعم' });
    state = mapStateReducer(state, { type: 'selection/set', business: pharmacy });
    state = mapStateReducer(state, { type: 'viewport/set', viewport });

    expect(state).toMatchObject({ searchQuery: 'صيدلية ألفا', selectedZone: 'ب', categoryFilter: 'مطاعم', selectedBusiness: pharmacy, viewport });
    expect(mapStateReducer(state, { type: 'category/set', category: 'all' }).selectedBusiness).toBe(pharmacy);
  });
});
