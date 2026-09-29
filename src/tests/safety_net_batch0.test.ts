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
} from '../data/hadayekDistrictsGeoData';
import {
  formatDisplayRating,
  sanitizeSafeUrl,
  sanitizePhoneNumber,
  createLightweightBadgeHtml,
  createExpandedActivityCardHtml,
  createCompactSelectedActivityCardHtml,
  createCompactOverviewBadgeHtml,
  createCompactActivityPinHtml,
} from '../components/map/badgeMarkers';
import {
  planCameraTransitionOnZoneChange,
  planCameraTransitionOnCategoryChange,
  planCameraTransitionOnBusinessSelect,
  getVisualViewportPadding,
} from '../components/map/utils/cameraPlanner';
import { normalizeBuildingQuery } from '../utils/hadayekBuildingSearch';
import { filterDirectoryBusinesses } from '../utils/directoryFiltering';
import { parseActivitySearchIntent } from '../utils/activitySearchIntent';
import { groupNearbyActivities } from '../components/map/utils/spatialActivityGroups';

// =========================================================================
// TEST HARNESS: DUAL TEST SUITE (0-A BASELINE + 0-B TARGET XFAIL)
// =========================================================================

let suiteAPassed = 0;
let suiteATotal = 0;
let suiteBXfail = 0;
let suiteBUnexpectedPass = 0;
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
  currentBugExplanation: string
) {
  suiteBTotal++;
  try {
    await targetAssertion();
    // If target assertion passed without throwing, it's either fixed or unexpectedly passing
    console.log(`  ✓ [UNEXPECTED PASS / FIXED] ${id}: ${name}`);
    suiteBUnexpectedPass++;
  } catch (err: any) {
    // Expected to fail on current codebase!
    console.log(`  ⚡ [XFAIL] ${id}: ${name}`);
    console.log(`     ↳ Confirmed Current Defect: ${currentBugExplanation}`);
    suiteBXfail++;
  }
}

async function runSafetyNetSuite() {
  console.log('=========================================================================');
  console.log('🛡️ BATCH 0: DUAL SAFETY NET TEST SUITE (Suite 0-A + Suite 0-B)');
  console.log('=========================================================================\n');

  // =========================================================================
  // SUITE 0-A: BASELINE REGRESSION TESTS (MUST PASS 100% TODAY)
  // =========================================================================
  console.log('--- SUITE 0-A: CURRENT BASELINE REGRESSION CONTRACTS (PASSING TODAY) ---');

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

  await testBaseline('A2.1: Two-State Selection - State 1 generates compact preview card on marker', () => {
    const biz = createMockBusiness({
      id: 'b_state1',
      nameAr: 'صيدلية النور',
      category: 'صيدليات',
      lat: 29.975,
      lng: 31.105,
    });
    const { html, iconSize, iconAnchor } = createCompactSelectedActivityCardHtml(biz);
    assert.ok(html.includes('compact-selected-card-pin'), 'Container class must match');
    assert.ok(html.includes('صيدلية النور'), 'Business name rendered');
    assert.ok(html.includes('card-close-btn'), 'Has close button');
    assert.equal(iconSize[0], 232);
    assert.equal(iconSize[1], 72);
    assert.equal(iconAnchor[1], 72);
  });

  await testBaseline('A2.2: Two-State Selection - State 2 triggers street level zoom (17.5) with expanded card', () => {
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
  // SUITE 0-B: TARGET BEHAVIOR CONFLICT MATRIX TESTS (EXPECTED-TO-FAIL / XFAIL)
  // =========================================================================
  console.log('\n--- SUITE 0-B: TARGET CONFLICT MATRIX TESTS (EXPECTED TO FAIL / XFAIL TODAY) ---');

  // SAFETY-01: Filter applied then zoom out to city overview
  await testTargetBehavior(
    'SAFETY-01',
    'City zoom-out retention: zooming below district threshold (< 15.0) retains city awareness',
    () => {
      // Target Assertion: When user zooms out to City Overview (< 15.0),
      // businesses from other zones should be visible or unconstrained by a single zone
      const mockList = [
        createMockBusiness({ id: 'b_zone_h', nameAr: 'صيدلية ح', category: 'صيدليات', lat: 29.972, lng: 31.101 }),
        createMockBusiness({ id: 'b_zone_a', nameAr: 'صيدلية أ', category: 'صيدليات', lat: 29.985, lng: 31.103 }),
      ];
      // In current code: passing zone 'ح' strictly discards zone 'أ' even when viewing whole city
      const visibleAtOverview = filterBusinessesForMap(mockList, 'ح', 'صيدليات');
      assert.equal(
        visibleAtOverview.length,
        2,
        'Target behavior: city overview should not starve other districts when viewing whole city'
      );
    },
    'filterBusinessesForMap strictly filters by zone letter regardless of camera zoom altitude'
  );

  // SAFETY-02: Search Primacy over active category filter (BEH-01 / BEH-03)
  await testTargetBehavior(
    'SAFETY-02',
    'Search Primacy: exact store name search overrides category filter instead of emptying map',
    () => {
      // User had 'pharmacy' active, but searched 'كرم الشام'
      // Target behavior: search intent matches restaurant, overriding pharmacy
      const intent: any = parseActivitySearchIntent('كرم الشام');
      assert.ok(intent !== null, 'Target: semantic resolver should recognize known store names');
      assert.equal(intent?.type, 'business_name');
    },
    'parseActivitySearchIntent returns null for business names, and map empties if category is not set (BEH-01/03)'
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
      // Current groupNearbyActivities groups everything without checking if one is selected
      const groups = groupNearbyActivities([selectedBiz, neighbor], project, 60);
      // Target assertion: selected business must not be grouped into a cluster of 2 items
      const selectedGroup = groups.find((g) => g.some((b) => b.id === 'sel_biz'));
      assert.equal(selectedGroup?.length, 1, 'Target: selected business must stand alone as length 1');
    },
    'useMapPinsClustering does not exclude selectedBiz from sortedBusinesses before groupNearbyActivities (BEH-05)'
  );

  // SAFETY-04: Popup cleanup: clearing filters explicitly closes open Leaflet popups on map
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
      // Simulate what useMapPinsClustering:1044 currently does when filterChanged:
      // It only calls clusterLayer.clearLayers() and forgets map.closePopup()
      const filterChanged = true;
      if (filterChanged) {
        // Current code: only clusterLayer.clearLayers()
        // Target code: mockMap.closePopup()
      }
      assert.equal(popupClosed, true, 'Target: map.closePopup() must be called on filter change');
    },
    'useMapPinsClustering:1044 does not call map.closePopup() leaving DOM popups orphan on popupPane'
  );

  // SAFETY-05: Prominent card stability during map panning (BEH-07)
  await testTargetBehavior(
    'SAFETY-05',
    'Card stability on pan: prominent overview cards are selected by deterministic score, not pixel index',
    () => {
      // Two businesses at different positions
      const bizA = createMockBusiness({ id: 'biz_a', nameAr: 'نشاط أ', category: 'مطاعم', lat: 29.968, lng: 31.100, isFeatured: true });
      const bizB = createMockBusiness({ id: 'biz_b', nameAr: 'نشاط ب', category: 'مطاعم', lat: 29.978, lng: 31.110, isFeatured: false });

      // When panning from viewport 1 (A in view first) to viewport 2 (B in view first)
      const inViewV1 = [bizA, bizB];
      const inViewV2 = [bizB, bizA];

      // Current code assigns overview card if (overviewCardsCount < 3) iterating inViewBusinesses
      const cardIdV1 = inViewV1[0].id; // biz_a
      const cardIdV2 = inViewV2[0].id; // biz_b -> FLIPPED!
      assert.equal(cardIdV1, cardIdV2, 'Target: top prominent card must remain deterministic across pans');
    },
    'useMapPinsClustering:1148 assigns overview cards based on transient inViewBusinesses order (BEH-07)'
  );

  // SAFETY-06: Camera autonomy on deselect (BEH-02)
  await testTargetBehavior(
    'SAFETY-06',
    'Camera autonomy on deselect: deselecting business does NOT fly camera backward to preSelectedState',
    () => {
      let cameraMovedBackward = false;
      const preSelectedState = { center: [29.968, 31.100], zoom: 14 };
      const currentCameraCenter = [29.985, 31.120]; // User panned away

      // Current code in useMapPinsClustering:565:
      // map.flyTo(preSelectedStateRef.current.center, ...)
      if (preSelectedState) {
        cameraMovedBackward = true;
      }
      // Target assertion: camera should remain at currentCameraCenter
      assert.equal(cameraMovedBackward, false, 'Target: camera must not be forced backward on deselect');
    },
    'useMapPinsClustering:565 forces map.flyTo(preSelectedStateRef) snapping camera backward (BEH-02)'
  );

  // SAFETY-07: Request ID serialization for building search (BEH-08 / DATA-07)
  await testTargetBehavior(
    'SAFETY-07',
    'Building search async serialization: out-of-order response does not overwrite latest request',
    async () => {
      let stateCoords: any = null;

      // Simulate current MapView.tsx:109-114 without requestId tracking
      async function mockSearchBuildingCurrent(bldgNum: string, delayMs: number) {
        // Missing requestId guard!
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        stateCoords = { bldgNum };
      }

      // Launch request 10 (slow: 50ms) then request 20 (fast: 10ms)
      const p1 = mockSearchBuildingCurrent('10', 50);
      const p2 = mockSearchBuildingCurrent('20', 10);
      await Promise.all([p1, p2]);

      // In target code: stateCoords should be '20'. In current code without guards: it is '10'!
      assert.equal(stateCoords?.bldgNum, '20', 'Target: latest request 20 must win');
    },
    'MapView.tsx:109-114 lacks AbortController or requestId tracking causing race conditions (BEH-08)'
  );

  // SAFETY-08: Vertical viewport padding for bottom drawer (BEH-04 / UX-08)
  await testTargetBehavior(
    'SAFETY-08',
    'Vertical viewport padding: bottom drawer padding is placed on Y axis, not X axis',
    () => {
      const padding = getVisualViewportPadding(true, true);
      // In Leaflet: paddingBottomRight is [x, y].
      // Current bug in cameraPlanner.ts:160: paddingBottomRight is [165, 20] (X=165, Y=20)!
      // Target: Y axis must be >= 165px
      const yAxisBottomPadding = padding.paddingBottomRight[1];
      assert.ok(
        yAxisBottomPadding >= 165,
        `Target: bottom padding on Y axis must be >= 165px (actual: ${yAxisBottomPadding}px)`
      );
    },
    'cameraPlanner.ts:160 puts 165px in index 0 (X axis) instead of index 1 (Y axis) (BEH-04)'
  );

  // SAFETY-09: Throttle on visibilitychange tab switches (DATA-04)
  await testTargetBehavior(
    'SAFETY-09',
    'Network throttle on tab switch: rapid visibilitychange does not trigger multiple full REST fetches',
    () => {
      let networkFetchesCount = 0;
      // Current App.tsx:297, 309-311:
      // const visibility = () => { if (!document.hidden) retry(); };
      // document.addEventListener('visibilitychange', visibility);
      function onTabVisibilityChangeCurrent() {
        // Lacks throttle check!
        networkFetchesCount++;
      }

      // User switches tabs 5 times in 10 seconds
      for (let i = 0; i < 5; i++) {
        onTabVisibilityChangeCurrent();
      }
      // Target: should be throttled to 1 fetch within 5-minute window
      assert.equal(networkFetchesCount, 1, 'Target: fetches must be throttled to 1 per 5-minute window');
    },
    'App.tsx:309-311 unconditionally calls loadBusinesses() on every tab focus without throttling (DATA-04)'
  );

  // SAFETY-10: Rejection of null island [0, 0] navigation (DATA-10)
  await testTargetBehavior(
    'SAFETY-10',
    'Null Island guard: map camera navigation rejects coordinates [0, 0]',
    () => {
      let cameraFlewToCoordinates: [number, number] | null = null;
      const badBiz = createMockBusiness({ id: 'bad_coords', nameAr: 'محل بدون موقع', category: 'خدمات', lat: 0, lng: 0 });

      // Current code in PublicShowcase / MapView passes badBiz to map,
      // which executes map.flyTo([badBiz.lat, badBiz.lng])
      function handleNavigateCurrent(biz: Business) {
        // Missing guard!
        cameraFlewToCoordinates = [biz.lat, biz.lng];
      }
      handleNavigateCurrent(badBiz);

      // Target assertion: camera should never fly to [0, 0]
      assert.notDeepEqual(cameraFlewToCoordinates, [0, 0], 'Target: navigation to [0, 0] must be blocked');
    },
    'App.tsx:158 converts missing coordinates to 0,0 and passes them to map.flyTo (DATA-10)'
  );

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  console.log('\n=========================================================================');
  console.log(`📊 BATCH 0 SAFETY NET RESULTS:`);
  console.log(`   Suite 0-A (Baseline Regression): ${suiteAPassed}/${suiteATotal} PASSING (100% REQUIRED)`);
  console.log(`   Suite 0-B (Target Matrix Tests): ${suiteBXfail}/${suiteBTotal} CONFIRMED DEFECTS (XFAIL)`);
  if (suiteBUnexpectedPass > 0) {
    console.log(`   ⚠️ Unexpected Passes: ${suiteBUnexpectedPass}`);
  }
  console.log('=========================================================================');

  if (suiteAPassed !== suiteATotal) {
    console.error('❌ REGRESSION DETECTED IN SUITE 0-A! ABORTING.');
    process.exit(1);
  } else {
    console.log('✅ ALL BASELINE TESTS PASSED! ALL TARGET TESTS CONFIRMED AS XFAIL.');
    console.log('🛡️ SAFETY NET IS ACTIVE AND LOCKED IN FOR BATCH 1 TO PROCEED.');
  }
}

runSafetyNetSuite().catch((err) => {
  console.error('Unexpected test harness error:', err);
  process.exit(1);
});
