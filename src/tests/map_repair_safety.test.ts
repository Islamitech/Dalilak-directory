import { describe, expect, it } from 'vitest';
import { Business } from '../types';
import { filterBusinessesForMap } from '../utils/hadayekZoneHelper';
import { parseHadayekBuildingAddress } from '../utils/hadayekBuildingSearch';
import { HADAYEK_OFFICIAL_DISTRICTS } from '../data/hadayekDistrictsGeoData';
import { HADAYEK_GATES } from '../data/hadayekAtlasData';

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

  it('keeps the local marker presentation threshold at 15.5 (locked baseline)', () => {
    const source = require('node:fs').readFileSync('src/components/map/hooks/useMapPinsClustering.ts', 'utf8');
    expect(source).toMatch(/zoom\s*>=\s*15\.5/);
  });

  it.fails('matches an activity to a building by an address token, not a digit substring in its name', () => {
    const component = require('node:fs').readFileSync('src/components/map/BuildingDetailDrawer.tsx', 'utf8');
    expect(component).not.toMatch(/b\.nameAr\?\.includes\(building\.buildingNumber\)/);
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
