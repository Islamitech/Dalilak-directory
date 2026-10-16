import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  computeSpiderfyOffsets,
  createSpiderfyManager,
  getOrCreateSpiderfyManager,
} from '../features/map/utils/mapSpiderfier';
import { executePinPipeline } from '../features/map/model/mapPinPipeline';
import { Business } from '../types';

function createMockBusiness(id: string, nameAr: string, category: string): Business {
  return {
    id,
    nameAr,
    nameEn: id,
    category,
    governorate: 'الجيزة',
    city: 'حدائق الأهرام',
    street: '',
    landmark: '',
    lat: 29.98,
    lng: 31.12,
    phone: '',
    verificationStatus: 'verified',
    createdAt: '',
    createdDate: '',
    description: '',
    workingHours: '',
    photos: [],
    isFeatured: false,
  };
}

describe('mapSpiderfier geometry calculations', () => {
  it('returns empty array for zero or negative count', () => {
    expect(computeSpiderfyOffsets(0)).toEqual([]);
    expect(computeSpiderfyOffsets(-3)).toEqual([]);
  });

  it('returns single centered offset for count = 1', () => {
    const offsets = computeSpiderfyOffsets(1);
    expect(offsets).toHaveLength(1);
    expect(offsets[0]).toEqual({ angle: 0, radiusPx: 0, dx: 0, dy: 0 });
  });

  it('computes balanced circular offsets for small counts (<= 8)', () => {
    const count = 4;
    const offsets = computeSpiderfyOffsets(count, 50);
    expect(offsets).toHaveLength(4);

    // First item starts at -Math.PI / 2 (top)
    expect(offsets[0].angle).toBeCloseTo(-Math.PI / 2, 4);
    expect(offsets[0].radiusPx).toBe(50);
    expect(offsets[0].dx).toBe(0);
    expect(offsets[0].dy).toBe(-50);

    // Items should be distinct and spaced by 90 degrees (Math.PI / 2)
    const angles = offsets.map((o) => o.angle);
    for (let i = 1; i < angles.length; i++) {
      expect(angles[i] - angles[i - 1]).toBeCloseTo(Math.PI / 2, 4);
    }
  });

  it('computes two concentric rings for larger counts (> 8)', () => {
    const count = 10;
    const offsets = computeSpiderfyOffsets(count, 55);
    expect(offsets).toHaveLength(10);

    // Ring 1 should have smaller radius than Ring 2
    const ring1 = offsets.slice(0, 4);
    const ring2 = offsets.slice(4);

    expect(ring1.every((o) => o.radiusPx === 55)).toBe(true);
    expect(ring2.every((o) => o.radiusPx === 100)).toBe(true);
  });
});

describe('SpiderfyManager lifecycle', () => {
  let mockMap: any;
  let mockLayer: any;
  let onSelectBusiness: any;

  beforeEach(() => {
    mockMap = {
      getZoom: vi.fn(() => 17),
      project: vi.fn(() => ({
        add: vi.fn(() => ({ x: 100, y: 100 })),
      })),
      unproject: vi.fn(() => ({ lat: 29.981, lng: 31.121 })),
      on: vi.fn(),
      off: vi.fn(),
    };

    mockLayer = {
      clearLayers: vi.fn(),
      addLayer: vi.fn(),
    };

    onSelectBusiness = vi.fn();

    // Mock globalThis.window and L
    const mockL = {
      divIcon: vi.fn((opts) => opts),
      marker: vi.fn((latLng, opts) => {
        const handlers: Record<string, Function> = {};
        const markerObj: any = {
          latLng,
          opts,
          setIcon: vi.fn((newIcon) => {
            markerObj.opts = { ...markerObj.opts, icon: newIcon };
          }),
          setLatLng: vi.fn((newLatLng) => {
            markerObj.latLng = newLatLng;
          }),
          on: vi.fn((event, handler) => {
            handlers[event] = handler;
          }),
          _trigger: (event: string, e: any) => handlers[event]?.(e),
        };
        return markerObj;
      }),
      polyline: vi.fn((points, opts) => ({ points, opts })),
      point: vi.fn((x, y) => ({ x, y })),
    };

    (globalThis as any).L = mockL;
    (globalThis as any).window = globalThis;
    (globalThis as any).window.L = mockL;
    (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    };
    (globalThis as any).cancelAnimationFrame = vi.fn();
  });

  it('manages expand and collapse cycle cleanly', () => {
    const manager = createSpiderfyManager({
      map: mockMap,
      spiderfyLayer: mockLayer,
      onSelectBusiness,
    });

    expect(manager.isExpanded()).toBe(false);
    expect(manager.getActiveClusterKey()).toBeNull();

    const members = [
      createMockBusiness('b1', 'مطعم السعادة', 'مطاعم'),
      createMockBusiness('b2', 'صيدلية النور', 'صيدليات'),
    ];

    manager.expand([29.98, 31.12], members, 'cluster_group_1');

    expect(manager.isExpanded()).toBe(true);
    expect(manager.getActiveClusterKey()).toBe('cluster_group_1');
    expect(mockMap.on).toHaveBeenCalledWith('click', expect.any(Function));

    // Calling collapse removes layers and detaches listeners
    manager.collapse();
    expect(manager.isExpanded()).toBe(false);
    expect(manager.getActiveClusterKey()).toBeNull();
    expect(mockLayer.clearLayers).toHaveBeenCalled();
    expect(mockMap.off).toHaveBeenCalledWith('click', expect.any(Function));
  });

  it('toggles collapse if same cluster is clicked twice', () => {
    const manager = createSpiderfyManager({
      map: mockMap,
      spiderfyLayer: mockLayer,
      onSelectBusiness,
    });

    const members = [createMockBusiness('b1', 'مطعم 1', 'مطاعم')];
    manager.expand([29.98, 31.12], members, 'cluster_toggle');
    expect(manager.isExpanded()).toBe(true);

    // Second click on the same cluster
    manager.expand([29.98, 31.12], members, 'cluster_toggle');
    expect(manager.isExpanded()).toBe(false);
  });

  it('reuses manager per spiderfyLayer and updates onSelectBusiness callback', () => {
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();
    const addedMarkers: any[] = [];
    mockLayer.addLayer = vi.fn((layer) => addedMarkers.push(layer));

    const m1 = getOrCreateSpiderfyManager({
      map: mockMap,
      spiderfyLayer: mockLayer,
      onSelectBusiness: firstCallback,
    });
    const m2 = getOrCreateSpiderfyManager({
      map: mockMap,
      spiderfyLayer: mockLayer,
      onSelectBusiness: secondCallback,
    });

    expect(m1).toBe(m2);

    const biz = createMockBusiness('b1', 'مطعم السعادة', 'مطاعم');
    m1.expand([29.98, 31.12], [biz], 'cluster_cb');

    const pinMarker = addedMarkers.find((l) => l.opts?.title === 'مطعم السعادة');
    expect(pinMarker).toBeDefined();
    pinMarker._trigger('click', { originalEvent: { stopPropagation: vi.fn() } });

    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledWith(biz);
  });

  it('renders individual markers in executePinPipeline without creating cluster badges and cleans up any legacy clusters', () => {
    const spiderfyLayer = {
      clearLayers: vi.fn(),
      addLayer: vi.fn(),
    };
    const clusterLayer = {
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
    };
    const cardsLayer = {
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
    };

    const mapWithBounds = {
      ...mockMap,
      getZoom: vi.fn(() => 18),
      distance: vi.fn((a: any, b: any) => Math.abs((a[1] - b[1]) * 100000)),
      latLngToContainerPoint: vi.fn((ll: any) => ({ x: (ll.lng - 31) * 10000, y: 50 })),
      getBounds: vi.fn(() => ({
        pad: () => ({
          contains: () => true,
        }),
      })),
    };

    const b1 = { ...createMockBusiness('b1', 'نشاط 1', 'مطاعم'), lng: 31.01 };
    const b2 = { ...createMockBusiness('b2', 'نشاط 2', 'صيدليات'), lng: 31.02 };
    const legacyClusterMarker = { remove: vi.fn() };
    const clusterRegistry = new Map<string, any>([['legacy-cluster', legacyClusterMarker]]);
    const markersRegistry = new Map<string, any>();
    const seenMarkers = new Set<string>();

    const callbackRun1 = vi.fn();
    const cleanupRun1 = executePinPipeline({
      map: mapWithBounds,
      cardsLayer,
      clusterLayer,
      spiderfyLayer,
      clusterRegistry,
      markersRegistry,
      seenMarkers,
      sortedBusinesses: [b1, b2],
      selectedBiz: null,
      cameraController: { request: vi.fn() },
      onSelectBusiness: callbackRun1,
      onComplete: vi.fn(),
    });

    // Legacy cluster markers are purged and no new cluster markers are created
    expect(clusterLayer.removeLayer).toHaveBeenCalledWith(legacyClusterMarker);
    expect(clusterRegistry.size).toBe(0);
    expect(clusterLayer.addLayer).not.toHaveBeenCalled();

    // Individual markers are created and registered
    expect(markersRegistry.size).toBe(2);
    const retainedPinMarker = markersRegistry.get('b1');
    expect(retainedPinMarker).toBeDefined();

    cleanupRun1();

    const callbackRun2 = vi.fn();
    executePinPipeline({
      map: mapWithBounds,
      cardsLayer,
      clusterLayer,
      spiderfyLayer,
      clusterRegistry,
      markersRegistry,
      seenMarkers,
      sortedBusinesses: [b1, b2],
      selectedBiz: null,
      cameraController: { request: vi.fn() },
      onSelectBusiness: callbackRun2,
      onComplete: vi.fn(),
    });

    expect(markersRegistry.get('b1')).toBe(retainedPinMarker);
    expect(clusterRegistry.size).toBe(0);
  });
});
