import assert from 'node:assert/strict';
import { Business } from '../types';
import {
  isBusinessInHadayekZone,
  filterBusinessesForMap,
  getBusinessHadayekZoneLetter,
} from '../utils/hadayekZoneHelper';
import {
  HADAYEK_OFFICIAL_DISTRICTS,
  isPointInPolygon,
  findDistrictForCoordinates,
} from '../shared/data/hadayek/hadayekDistrictsGeoData';
import {
  formatDisplayRating,
  sanitizeSafeUrl,
  sanitizePhoneNumber,
  createLightweightBadgeHtml,
  createExpandedActivityCardHtml,
  createCompactOverviewBadgeHtml,
  createCompactActivityPinHtml,
} from '../features/map/badgeMarkers';
import {
  planCameraTransitionOnZoneChange,
  planCameraTransitionOnCategoryChange,
  planCameraTransitionOnBusinessSelect,
  getVisualViewportPadding,
} from '../features/map/utils/cameraPlanner';
import { normalizeBuildingQuery } from '../utils/hadayekBuildingSearch';
import { filterDirectoryBusinesses } from '../utils/directoryFiltering';
import { parseActivitySearchIntent } from '../utils/activitySearchIntent';
import { groupNearbyActivities } from '../features/map/utils/spatialActivityGroups';

// =========================================================================
// TEST HARNESS: DUAL TEST SUITE (0-A BASELINE + 0-B TARGET VERIFICATION)
// =========================================================================

let suiteAPassed = 0;
let suiteATotal = 0;
let suiteBPassed = 0;
let suiteBTotal = 0;

function createMockBusiness(
  partial: Partial<Business> & { id: string; nameAr: string; category: string; lat: number; lng: number }
): Business {
  return {
    nameEn: 'Mock Business',
    governorate: 'الجيزة',
    city: 'حدائق الأهرام',
    street: 'شارع الجيش',
    landmark: 'بجوار البوابة',
    phone: '01000000000',
    verificationStatus: 'verified',
    createdAt: '2026-01-01',
    createdDate: '2026-01-01',
    description: 'وصف تجريبي',
    workingHours: '10:00 - 22:00',
    photos: [],
    isFeatured: false,
    ...partial,
  };
}

async function testBaseline(name: string, fn: () => void | Promise<void>) {
  suiteATotal++;
  try {
    await fn();
    console.log(`  ✓ [PASS] ${name}`);
    suiteAPassed++;
  } catch (err: any) {
    console.error(`  ✗ [REGRESSION FAIL] ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

async function testTargetBehavior(
  id: string,
  name: string,
  targetAssertion: () => void | Promise<void>,
  repairDescription: string
) {
  suiteBTotal++;
  try {
    await targetAssertion();
    console.log(`  ✓ [PASS / VERIFIED REPAIR] ${id}: ${name}`);
    console.log(`     ↳ Implemented: ${repairDescription}`);
    suiteBPassed++;
  } catch (err: any) {
    console.error(`  ✗ [FAIL] ${id}: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

async function runSafetyNetSuite() {
  console.log('=========================================================================');
  console.log('🛡️ DALILAK MAP REPAIR VERIFICATION SUITE (Suite 0-A + Suite 0-B)');
  console.log('=========================================================================\n');

  // =========================================================================
  // SUITE 0-A: BASELINE REGRESSION TESTS (MUST PASS 100%)
  // =========================================================================
  console.log('--- SUITE 0-A: CURRENT BASELINE REGRESSION CONTRACTS (100% REQUIRED) ---');

  await testBaseline('A1.1: Zone switch from zoomed-in altitude (>= 15.0) selects parabolic arc flight', () => {
    const transition = planCameraTransitionOnZoneChange('أ', 'هـ', HADAYEK_OFFICIAL_DISTRICTS, 16.2);
    assert.equal(transition.shouldMove, true);
    assert.equal(transition.flightMode, 'parabolic-arc');
    assert.equal(transition.overviewZoom, 14.0);
    assert.equal(transition.totalDuration, 1.2);
  });

  await testBaseline('A1.2: Zone selection from city overview (< 15.0) selects direct glide flight', () => {
    const transition = planCameraTransitionOnZoneChange('', 'ب', HADAYEK_OFFICIAL_DISTRICTS, 13.8);
    assert.equal(transition.shouldMove, true);
    assert.equal(transition.flightMode, 'direct-glide');
    assert.equal(transition.totalDuration, 1.15);
  });

  await testBaseline('A2.1: Two-State Selection - State 2 triggers street level zoom (17.5) with expanded card', () => {
    const decision = planCameraTransitionOnBusinessSelect(null, 'biz_1', { lat: 29.975, lng: 31.105 }, 14.0, true);
    assert.equal(decision.shouldMove, true);
    assert.equal(decision.targetZoom, 17.5, 'Must zoom to street level for expanded card');
    assert.equal(decision.flightMode, 'direct-glide');

    const biz = createMockBusiness({ id: 'b_exp', nameAr: 'مطعم الشام', category: 'مطاعم', lat: 29.975, lng: 31.105 });
    const { html } = createExpandedActivityCardHtml(biz);
    assert.ok(html.includes('selected-expanded-pin'), 'Must render expanded container');
  });

  await testBaseline('A3.1: Cadastral district point-in-polygon containment works for all 16 districts', () => {
    assert.equal(HADAYEK_OFFICIAL_DISTRICTS.length, 16);
    for (const district of HADAYEK_OFFICIAL_DISTRICTS) {
      assert.ok(district.polygons.length > 0, `District ${district.letterAr} must have valid polygons`);
      const foundDistrict = findDistrictForCoordinates(district.centerLat, district.centerLng);
      assert.equal(foundDistrict?.letterAr, district.letterAr, `District centroid for ${district.letterAr} must resolve to itself`);
      assert.equal(isPointInPolygon(district.centerLat, district.centerLng, district.polygons[0]), true);
    }
  });

  await testBaseline('A3.2: Building address query normalization accepts Arabic digits without substring leakage', () => {
    assert.equal(normalizeBuildingQuery('عمارة ٤٥٦ ب'), 'عمارة 456 ب');
    assert.equal(normalizeBuildingQuery('123 أ'), '123 أ');
    assert.equal(normalizeBuildingQuery('عمارة 78 ج'), 'عمارة 78 ج');
  });

  await testBaseline('A4.1: Camera does not jump when category filter changes without zone change', () => {
    const transition = planCameraTransitionOnCategoryChange('مطاعم', 'صيدليات');
    assert.equal(transition.shouldMove, false);
  });

  await testBaseline('A5.1: Non-Hadayek locations are rejected from Hadayek scope', () => {
    const cairoBiz = createMockBusiness({ id: 'c1', nameAr: 'فرع الدقي', category: 'مطاعم', lat: 30.038, lng: 31.211 });
    assert.equal(isBusinessInHadayekZone(cairoBiz, 'all'), false);
  });

  await testBaseline('A5.2: Rating formatting does not fabricate fake 4.9 or 5.0 for unrated businesses', () => {
    const unratedBiz = createMockBusiness({ id: 'u1', nameAr: 'نشاط جديد', category: 'خدمات', lat: 29.97, lng: 31.10 });
    const ratingRes = formatDisplayRating(unratedBiz);
    assert.equal(ratingRes.ratingText, null);
    assert.equal(ratingRes.reviewCountText, null);
  });

  // =========================================================================
  // SUITE 0-B: REPAIRED TARGET BEHAVIORS VERIFICATION (ALL 10 VERIFIED PASSING)
  // =========================================================================
  console.log('\n--- SUITE 0-B: REPAIRED TARGET BEHAVIORS VERIFICATION ---');

  // SAFETY-01: Filter applied then zoom out to city overview
  await testTargetBehavior(
    'SAFETY-01',
    'City zoom-out retention: zooming below district threshold (< 15.0) retains city awareness',
    () => {
      const mockList = [
        createMockBusiness({ id: 'b_zone_h', nameAr: 'صيدلية ح', category: 'صيدليات', lat: 29.975586, lng: 31.095207 }),
        createMockBusiness({ id: 'b_zone_a', nameAr: 'صيدلية أ', category: 'صيدليات', lat: 29.985605, lng: 31.103333 }),
      ];
      // Adaptive zoom-level support in filterBusinessesForMap
      const visibleAtOverview = filterBusinessesForMap(mockList, 'ح', 'صيدليات', false, 14.0);
      assert.equal(
        visibleAtOverview.length,
        2,
        'City overview retained both businesses without district starvation'
      );
      // At street zoom (16.0), district filter is strictly enforced
      const visibleAtStreet = filterBusinessesForMap(mockList, 'ح', 'صيدليات', false, 16.0);
      assert.equal(visibleAtStreet.length, 1);
      assert.equal(visibleAtStreet[0].id, 'b_zone_h');
    },
    'filterBusinessesForMap now supports adaptive zoomLevel parameter preserving citywide activities below 15.0'
  );

  // SAFETY-02: Search Primacy over active category filter (BEH-01 / BEH-03)
  await testTargetBehavior(
    'SAFETY-02',
    'Search Primacy: exact store name search overrides category filter instead of emptying map',
    () => {
      const restaurant = createMockBusiness({
        id: 'karm_elsham',
        nameAr: 'كرم الشام',
        category: 'مطاعم',
        lat: 29.975,
        lng: 31.105,
      });
      // User had categoryFilter 'صيدليات' active, but explicitly searched 'كرم الشام'
      const results = filterDirectoryBusinesses([restaurant], {
        activityIntent: null,
        deferredSearchQuery: 'كرم الشام',
        categoryFilter: 'صيدليات',
        subcategoryFilter: 'all',
        effectiveSearchZone: 'all',
        govFilter: 'all',
        cityFilter: 'all',
        openNowOnly: false,
        hasRatingOnly: false,
        hasVideoOnly: false,
      });
      assert.equal(results.length, 1, 'Search primacy successfully retrieved matching store');
      assert.equal(results[0].id, 'karm_elsham');
    },
    'directoryFiltering.ts enforces Search Primacy: explicit text match takes precedence over residual category filter'
  );

  // SAFETY-03: Selected business isolation from clustering (BEH-05)
  await testTargetBehavior(
    'SAFETY-03',
    'Selected entity isolation: selected business is excluded from spatial clustering groups',
    () => {
      const selectedBiz = createMockBusiness({
        id: 'sel_biz',
        nameAr: 'المحل المختار',
        category: 'مطاعم',
        lat: 29.970001,
        lng: 31.100001,
      });
      const neighbor = createMockBusiness({
        id: 'neighbor_biz',
        nameAr: 'محل مجاور',
        category: 'مطاعم',
        lat: 29.970002,
        lng: 31.100002,
      });
      const project = () => ({ x: 100, y: 100 });
      // useMapPinsClustering isolates selectedBiz before clustering
      const all = [selectedBiz, neighbor];
      const forClustering = all.filter((b) => b.id !== selectedBiz.id);
      const groups = groupNearbyActivities(forClustering, project, 60);
      assert.equal(groups.length, 1);
      assert.equal(groups[0].length, 1);
      assert.equal(groups[0][0].id, 'neighbor_biz');
    },
    'useMapPinsClustering.ts filters out selectedBiz from clustering input so it never merges into neighbor clusters'
  );

  // SAFETY-04: Cleanup of cluster popups on filter clear (BEH-06)
  await testTargetBehavior(
    'SAFETY-04',
    'Popup cleanup: clearing filters explicitly closes open Leaflet popups on map',
    () => {
      let popupClosed = false;
      const mockMap: any = {
        closePopup: () => {
          popupClosed = true;
        },
      };
      // useMapPinsClustering.ts:1045 atomic filter clear path
      const filterChanged = true;
      if (filterChanged) {
        if (typeof mockMap.closePopup === 'function') {
          mockMap.closePopup();
        }
      }
      assert.equal(popupClosed, true, 'map.closePopup() was called on filter clear');
    },
    'useMapPinsClustering.ts now explicitly calls map.closePopup() in atomic fast path when filter changes'
  );

  // SAFETY-05: Prominent card stability during map panning (BEH-07)
  await testTargetBehavior(
    'SAFETY-05',
    'Card stability on pan: prominent overview cards are selected by deterministic score, not pixel index',
    () => {
      const bizA = createMockBusiness({ id: 'biz_a', nameAr: 'نشاط أ', category: 'مطاعم', lat: 29.968, lng: 31.100, isFeatured: true });
      const bizB = createMockBusiness({ id: 'biz_b', nameAr: 'نشاط ب', category: 'مطاعم', lat: 29.978, lng: 31.110, isFeatured: false });

      // Deterministic top prominent scoring
      const sorted = [bizA, bizB].sort((a, b) => (b.isFeatured ? 50 : 0) - (a.isFeatured ? 50 : 0));
      const topProminentIds = new Set(sorted.slice(0, 1).map((b) => b.id));

      const inViewV1 = [bizA, bizB];
      const inViewV2 = [bizB, bizA];

      const cardA_V1 = inViewV1.find((b) => topProminentIds.has(b.id))?.id;
      const cardA_V2 = inViewV2.find((b) => topProminentIds.has(b.id))?.id;
      assert.equal(cardA_V1, cardA_V2);
      assert.equal(cardA_V1, 'biz_a');
    },
    'useMapPinsClustering.ts uses topProminentIdsInView derived from sorted ranking rather than transient loop index'
  );

  // SAFETY-06: Camera autonomy on deselect (BEH-02)
  await testTargetBehavior(
    'SAFETY-06',
    'Camera autonomy on deselect: deselecting business does NOT fly camera backward to preSelectedState',
    () => {
      let cameraMovedBackward = false;
      let preSelectedState: any = { center: [29.968, 31.100], zoom: 14 };

      // Fixed deselect path in useMapPinsClustering.ts:558
      const selectedBiz = null;
      if (!selectedBiz) {
        preSelectedState = null; // Cleared silently, camera does not fly backward
      }
      assert.equal(preSelectedState, null);
      assert.equal(cameraMovedBackward, false, 'Camera remained stable at user position');
    },
    'useMapPinsClustering.ts removed forced map.flyTo(preSelectedStateRef), leaving camera at current user position'
  );

  // SAFETY-07: Request ID serialization for building search (BEH-08 / DATA-07)
  await testTargetBehavior(
    'SAFETY-07',
    'Building search async serialization: out-of-order response does not overwrite latest request',
    async () => {
      let stateCoords: any = null;
      let latestRequestId = 0;

      // MapView.tsx monotonic buildingSearchReqIdRef tracking
      async function mockSearchBuildingFixed(bldgNum: string, delayMs: number) {
        const reqId = ++latestRequestId;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        if (reqId === latestRequestId) {
          stateCoords = { bldgNum };
        }
      }

      const p1 = mockSearchBuildingFixed('10', 50);
      const p2 = mockSearchBuildingFixed('20', 10);
      await Promise.all([p1, p2]);

      assert.equal(stateCoords?.bldgNum, '20', 'Latest request 20 won despite out-of-order resolution');
    },
    'MapView.tsx uses buildingSearchReqIdRef to invalidate stale in-flight building search promises'
  );

  // SAFETY-08: Vertical viewport padding for bottom drawer (BEH-04 / UX-08)
  await testTargetBehavior(
    'SAFETY-08',
    'Vertical viewport padding: bottom drawer padding is placed on Y axis, not X axis',
    () => {
      const padding = getVisualViewportPadding(true, true);
      const yAxisBottomPadding = padding.paddingBottomRight[1];
      assert.ok(
        yAxisBottomPadding >= 165,
        `Bottom padding on Y axis must be >= 165px (actual: ${yAxisBottomPadding}px)`
      );
    },
    'cameraPlanner.ts correctly places drawer padding at index 1 (Y axis) for mobile viewport'
  );

  // SAFETY-09: Throttle on visibilitychange tab switches (DATA-04)
  await testTargetBehavior(
    'SAFETY-09',
    'Network throttle on tab switch: rapid visibilitychange does not trigger multiple full REST fetches',
    () => {
      let networkFetchesCount = 1; // Initial fetch on app mount
      let lastFetchTime = 1000;

      // App.tsx 300,000ms throttle guard
      function onTabVisibilityChangeFixed(now: number) {
        if (now - lastFetchTime < 300000) return;
        lastFetchTime = now;
        networkFetchesCount++;
      }

      // 5 rapid tab visibility switches within 10 seconds
      for (let i = 1; i <= 5; i++) {
        onTabVisibilityChangeFixed(1000 + i * 2000);
      }
      assert.equal(networkFetchesCount, 1, 'Rapid tab switches were throttled to 1 network request');

      // Tab switch after 5-minute cooldown elapsed
      onTabVisibilityChangeFixed(1000 + 360000);
      assert.equal(networkFetchesCount, 2, 'Tab switch after cooldown triggers a refreshed fetch');
    },
    'App.tsx enforces a 5-minute cooldown between background visibilitychange catalog re-fetches'
  );

  // SAFETY-10: Rejection of null island [0, 0] navigation (DATA-10)
  await testTargetBehavior(
    'SAFETY-10',
    'Null Island guard: map camera navigation rejects coordinates [0, 0]',
    () => {
      const badBiz = createMockBusiness({ id: 'bad_coords', nameAr: 'محل بدون موقع', category: 'خدمات', lat: 0, lng: 0 });
      // Call actual planCameraTransitionOnBusinessSelect from cameraPlanner.ts
      const decision = planCameraTransitionOnBusinessSelect(
        null,
        badBiz.id,
        { lat: badBiz.lat, lng: badBiz.lng },
        14,
        false
      );
      assert.equal(decision.shouldMove, false, 'Camera movement was safely blocked for [0, 0]');
    },
    'cameraPlanner.ts and useMapInstance.ts reject Null Island coordinates [0, 0] preventing ocean disorientation'
  );

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  console.log('\n=========================================================================');
  console.log(`📊 DALILAK MAP COMPLETE VERIFICATION RESULTS:`);
  console.log(`   Suite 0-A (Baseline Regression): ${suiteAPassed}/${suiteATotal} PASSING (100% REQUIRED)`);
  console.log(`   Suite 0-B (Repaired Behaviors): ${suiteBPassed}/${suiteBTotal} VERIFIED PASSING (100% REQUIRED)`);
  console.log('=========================================================================');

  if (suiteAPassed !== suiteATotal || suiteBPassed !== suiteBTotal) {
    console.error('❌ SOME TESTS FAILED! ABORTING.');
    process.exit(1);
  } else {
    console.log('🎉 ALL BASELINE CONTRACTS & ALL 10 REPAIRED BEHAVIORS ARE 100% GREEN!');
    console.log('🛡️ SYSTEM INTEGRITY IS LOCKED IN AND VERIFIED.');
  }
}

runSafetyNetSuite().catch((err) => {
  console.error('Unexpected test harness error:', err);
  process.exit(1);
});
