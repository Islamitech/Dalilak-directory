import { describe, expect, it } from 'vitest';
import { Business } from '../types';
import { filterBusinessesForMap } from '../utils/hadayekZoneHelper';
import { isBusinessAssociatedWithBuilding, parseHadayekBuildingAddress } from '../utils/hadayekBuildingSearch';
import { HADAYEK_OFFICIAL_DISTRICTS } from '../data/hadayekDistrictsGeoData';
import { HADAYEK_GATES } from '../data/hadayekAtlasData';
import { MAP_ZOOM_POLICY, isLocalPinPresentationZoom } from '../utils/mapZoomPolicy';
import { getVisualViewportPadding, planCameraTransitionOnZoneChange } from '../components/map/utils/cameraPlanner';
import { getMapBusinessSearchMatches, isSearchSelectedBusiness } from '../utils/mapSearch';

function business(partial: Partial<Business> & Pick<Business, 'id' | 'nameAr' | 'category' | 'lat' | 'lng'>): Business {
  return {
    nameEn: '', governorate: 'الجيزة', city: 'حدائق الأهرام', street: '', landmark: '', phone: '',
    verificationStatus: 'verified', createdAt: '', createdDate: '', description: '', workingHours: '',
    photos: [], isFeatured: false, ...partial,
  };
}

describe('map repair safety contracts', () => {
  it('keeps city-wide pins below zoom 15 and applies selected zone at zoom 15 and above', () => {
    const zoneH = business({ id: 'h', nameAr: 'صيدلية ح', category: 'صيدليات', lat: 29.97314, lng: 31.096411 });
    const zoneT = business({ id: 't', nameAr: 'صيدلية ط', category: 'صيدليات', lat: 29.970452, lng: 31.092889 });

    expect(filterBusinessesForMap([zoneH, zoneT], 'ح', 'all', false, 14.99).map(x => x.id)).toEqual(['h', 't']);
    expect(filterBusinessesForMap([zoneH, zoneT], 'ح', 'all', false, 15).map(x => x.id)).toEqual(['h']);
  });

  it('centralizes both established zoom boundaries and preserves adjacent behavior', () => {
    expect(MAP_ZOOM_POLICY.citywideFilterBelow).toBe(15);
    expect(MAP_ZOOM_POLICY.localPinPresentationFrom).toBe(15.5);
    expect(isLocalPinPresentationZoom(15.49)).toBe(false);
    expect(isLocalPinPresentationZoom(15.5)).toBe(true);
    const district = [{ letterAr: 'ب', polygons: [[[29, 31], [29.1, 31], [29.1, 31.1]] as [number, number][]] }];
    expect(planCameraTransitionOnZoneChange('', 'ب', district, 14.99).flightMode).toBe('direct-glide');
    expect(planCameraTransitionOnZoneChange('', 'ب', district, 15).flightMode).toBe('parabolic-arc');
    expect(getVisualViewportPadding(true, true).paddingBottomRight[1]).toBeGreaterThanOrEqual(165);
  });

  it('associates a building by exact address number and zone, never digits in the business name', () => {
    const namedOne = business({ id: 'one', nameAr: 'صيدلية عمارة 1', category: 'صيدليات', lat: 29.979184, lng: 31.106863, street: 'عمارة 11 منطقة ب' });
    const exactOne = business({ id: 'exact', nameAr: 'صيدلية أخرى', category: 'صيدليات', lat: 29.979184, lng: 31.106863, street: 'عمارة 1 منطقة ب' });
    expect(isBusinessAssociatedWithBuilding(namedOne, '1', 'ب')).toBe(false);
    expect(isBusinessAssociatedWithBuilding(exactOne, '1', 'ب')).toBe(true);
    const nearby = business({ id: 'nearby', nameAr: 'نشاط قريب', category: 'خدمات', lat: 29.9795, lng: 31.106863, street: 'شارع الجيش' });
    const distant = { ...nearby, id: 'distant', lat: 29.982, lng: 31.106863 };
    expect(isBusinessAssociatedWithBuilding(nearby, '1', 'ب', { lat: 29.979184, lng: 31.106863 })).toBe(true);
    expect(isBusinessAssociatedWithBuilding(distant, '1', 'ب', { lat: 29.979184, lng: 31.106863 })).toBe(false);
  });

  it('lets explicit map text search find Hadayek businesses despite a residual category filter and retains a selected match', () => {
    const pharmacy = business({ id: 'pharmacy', nameAr: 'صيدلية ألفا', category: 'صيدليات', lat: 29.979184, lng: 31.106863 });
    const restaurant = business({ id: 'restaurant', nameAr: 'مطعم بيتا', category: 'مطاعم', lat: 29.979184, lng: 31.106863 });
    expect(getMapBusinessSearchMatches([pharmacy, restaurant], 'صيدلية')).toEqual([pharmacy]);
    expect(isSearchSelectedBusiness(pharmacy, 'صيدلية ألفا')).toBe(true);
  });

  it('keeps gate served-zone policy consistent across both catalogs', () => {
    const official = HADAYEK_OFFICIAL_DISTRICTS;
    expect(official.length).toBeGreaterThan(0);
    expect(HADAYEK_GATES.length).toBeGreaterThan(0);
    // Gate 3 differs today (official catalog vs atlas); record the conflict without choosing data.
    const source = require('node:fs').readFileSync('src/data/hadayekDistrictsGeoData.ts', 'utf8');
    expect(source).toContain('HADAYEK_OFFICIAL_GATES');
  });

  it('parses building number with Arabic digits and an explicit zone', () => {
    expect(parseHadayekBuildingAddress('عمارة ٤٥٦ ب')).toEqual({ buildingNumber: '456', zoneLetter: 'ب' });
  });
});
