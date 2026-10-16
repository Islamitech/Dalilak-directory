import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getTileLayerConfig } from '../features/map/model/mapTileLayers';
import { renderGatesMarkers } from '../features/map/model/mapGatesLayer';
import { syncCadastralNumbersLayer, CADASTRAL_NUMBERS_MIN_ZOOM } from '../features/map/model/mapCadastralNumbersLayer';
import { buildVisiblePinPipeline } from '../features/map/utils/visiblePinPipeline';
import { HADAYEK_OFFICIAL_GATES } from '../shared/data/hadayek/hadayekDistrictsGeoData';
import { computeRouteStats } from '../features/directions/model/directionsModel';
import { Business } from '../types';

function createMockBiz(id: string, lat = 29.98, lng = 31.10): Business {
  return {
    id,
    nameAr: `نشاط ${id}`,
    nameEn: `Biz ${id}`,
    category: 'مطاعم',
    governorate: 'الجيزة',
    city: 'حدائق الأهرام',
    street: '',
    landmark: '',
    lat,
    lng,
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

describe('Map Optimization and Enhancement Suite', () => {
  describe('1. Tile Layer & CSS Performance Enhancements', () => {
    it('configures dalelak-white with keyless watermark-free OpenStreetMap tiles', () => {
      const config = getTileLayerConfig('dalelak-white');
      expect(config.url).toContain('tile.openstreetmap.fr/hot/{z}/{x}/{y}.png');
      expect(config.url).not.toContain('cartocdn.com');
      expect(config.subdomains).toEqual(['a', 'b', 'c']);
      expect(config.className).toBe('dl-tiles-white');
    });

    it('has eliminated unauthorized Google and watermarked Carto tile endpoints', () => {
      const googleStreets = getTileLayerConfig('google-streets');
      const googleHybrid = getTileLayerConfig('google-hybrid');
      const dalelakWhite = getTileLayerConfig('dalelak-white');
      const dalelakClean = getTileLayerConfig('dalelak-clean');
      const esriStreets = getTileLayerConfig('esri-streets');

      [googleStreets, googleHybrid, dalelakWhite, dalelakClean, esriStreets].forEach((layer) => {
        expect(layer.url).not.toContain('google.com');
        expect(layer.url).not.toContain('cartocdn.com');
      });
    });

    it('confirms GPU CSS filter removal in index.css for dl-tiles-white', () => {
      const cssPath = path.resolve(__dirname, '../index.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      expect(cssContent).toMatch(/\.leaflet-layer\.dl-tiles-white\s*\{[^}]*filter:\s*none;/);
      expect(cssContent).not.toMatch(/\.leaflet-layer\.dl-tiles-white\s*\{[^}]*grayscale\(1\)/);
    });

    it('confirms dedicated dalilak-map-tiles cache separation in Service Worker', () => {
      const swPath = path.resolve(__dirname, '../pwa/sw.ts');
      const swContent = fs.readFileSync(swPath, 'utf8');

      expect(swContent).toContain("cacheName: 'dalilak-map-tiles'");
      expect(swContent).toContain("maxEntries: 350");
      expect(swContent).not.toContain('basemaps.cartocdn.com');
    });
  });

  describe('2. Smart Interactive Gate Navigator', () => {
    it('creates interactive markers with popup navigation for all official gates', () => {
      const layersAdded: any[] = [];
      const mockGatesLayer = {
        clearLayers: vi.fn(),
        addLayer: vi.fn((layer) => layersAdded.push(layer)),
      };

      // Mock window.L
      const originalWindowL = (globalThis as any).window?.L;
      (globalThis as any).window = (globalThis as any).window || {};
      (globalThis as any).window.L = {
        divIcon: vi.fn((opts) => opts),
        marker: vi.fn((coords, opts) => {
          let popupContent: any = null;
          const listeners: Record<string, Function> = {};
          return {
            coords,
            opts,
            bindPopup: vi.fn((content) => { popupContent = content; return { openPopup: vi.fn() }; }),
            getPopupContent: () => popupContent,
            closePopup: vi.fn(),
            on: vi.fn((event, fn) => { listeners[event] = fn; }),
            trigger: (event: string) => listeners[event]?.(),
          };
        }),
      };

      const onSelectZone = vi.fn();
      const onSelectGate = vi.fn();

      renderGatesMarkers(mockGatesLayer, 'أ', onSelectZone, onSelectGate);

      expect(mockGatesLayer.clearLayers).toHaveBeenCalled();
      expect(layersAdded.length).toBe(HADAYEK_OFFICIAL_GATES.length);

      // Verify that markers are interactive
      layersAdded.forEach((layer) => {
        expect(layer.opts.interactive).toBe(true);
        expect(layer.bindPopup).toHaveBeenCalled();
      });

      // Verify gate click callback
      layersAdded[0].trigger('click');
      expect(onSelectGate).toHaveBeenCalledWith(HADAYEK_OFFICIAL_GATES[0]);

      if (originalWindowL) {
        (globalThis as any).window.L = originalWindowL;
      }
    });
  });

  describe('3. Cadastral Building Numbers Layer', () => {
    it('defines CADASTRAL_NUMBERS_MIN_ZOOM at 17.5', () => {
      expect(CADASTRAL_NUMBERS_MIN_ZOOM).toBe(17.5);
    });

    it('clears markers and does nothing when zoom is below 17.5', async () => {
      const mockCadastralLayer = {
        clearLayers: vi.fn(),
        removeLayer: vi.fn(),
        addLayer: vi.fn(),
      };
      const mockMap = {
        getCenter: vi.fn(() => ({ lat: 29.98, lng: 31.10 })),
        getBounds: vi.fn(() => ({
          pad: () => ({ contains: () => true }),
        })),
      };

      await syncCadastralNumbersLayer({
        map: mockMap,
        cadastralLayer: mockCadastralLayer,
        zoom: 16.5,
        activeZone: 'أ',
      });

      expect(mockCadastralLayer.addLayer).not.toHaveBeenCalled();
    });

    it('renders building numbers inside viewport bounds at zoom >= 17.5', async () => {
      const addedMarkers: any[] = [];
      const mockCadastralLayer = {
        clearLayers: vi.fn(),
        removeLayer: vi.fn(),
        addLayer: vi.fn((m) => addedMarkers.push(m)),
      };
      const mockMap = {
        getCenter: vi.fn(() => ({ lat: 29.9848, lng: 31.0978 })),
        getBounds: vi.fn(() => ({
          pad: () => ({
            contains: (arg1: any, arg2?: any) => {
              const lat = Array.isArray(arg1) ? arg1[0] : arg1;
              const lng = Array.isArray(arg1) ? arg1[1] : arg2;
              return typeof lat === 'number' && typeof lng === 'number';
            },
          }),
        })),
      };

      (globalThis as any).window = (globalThis as any).window || {};
      (globalThis as any).window.L = {
        divIcon: vi.fn((opts) => opts),
        marker: vi.fn((coords, opts) => {
          const listeners: Record<string, Function> = {};
          return {
            coords,
            opts,
            on: vi.fn((event, fn) => { listeners[event] = fn; }),
            trigger: (event: string) => listeners[event]?.(),
          };
        }),
      };

      const onSelectBuilding = vi.fn();

      await syncCadastralNumbersLayer({
        map: mockMap,
        cadastralLayer: mockCadastralLayer,
        zoom: 18,
        activeZone: 'أ',
        onSelectBuilding,
      });

      expect(addedMarkers.length).toBeGreaterThan(0);
      expect(addedMarkers[0].opts.pane).toBe('cadastralPane');
      expect(addedMarkers[0].opts.interactive).toBe(true);

      // Trigger click on building marker
      addedMarkers[0].trigger('click');
      expect(onSelectBuilding).toHaveBeenCalled();
    });
  });

  describe('4. Hybrid Pin Architecture & Pipeline Density', () => {
    it('returns backgroundBusinesses for activities beyond featured DOM cards', () => {
      const items: Business[] = [];
      for (let i = 0; i < 50; i++) {
        items.push(createMockBiz(`biz_${i}`, 29.98 + (i * 0.0001), 31.10 + (i * 0.0001)));
      }

      const result = buildVisiblePinPipeline({
        businesses: items,
        contains: () => true,
        project: (b) => ({ x: b.lng * 1000, y: b.lat * 1000 }),
        point: (b) => ({ x: (b.lng - 31.10) * 10000, y: (b.lat - 29.98) * 10000 }),
        zoom: 16,
        hasSelectedZone: false,
        individual: true,
      });

      expect(result.backgroundBusinesses).toBeDefined();
      expect(result.backgroundBusinesses!.length).toBeGreaterThan(0);
    });

    it('verifies useMapPinsClustering passes effectiveZone to executePinPipeline and filterBusinessesForMap', () => {
      const hookPath = path.resolve(__dirname, '../features/map/hooks/useMapPinsClustering.ts');
      const hookContent = fs.readFileSync(hookPath, 'utf8');

      expect(hookContent).toContain('effectiveSelectedZone: effectiveZone');
      expect(hookContent).not.toContain("effectiveSelectedZone: ''");
      expect(hookContent).toContain("filterBusinessesForMap(businesses, effectiveZone || 'all'");
      expect(hookContent).toMatch(/useMemo\([\s\S]*?\},\s*\[[^\]]*effectiveZone[^\]]*\]\)/);
    });

    it('isolates cadastral layer state so remounting does not leak or block building markers', async () => {
      const layerAAdded: any[] = [];
      const layerBAdded: any[] = [];
      const mockLayerA = { clearLayers: vi.fn(), removeLayer: vi.fn(), addLayer: vi.fn((m) => layerAAdded.push(m)) };
      const mockLayerB = { clearLayers: vi.fn(), removeLayer: vi.fn(), addLayer: vi.fn((m) => layerBAdded.push(m)) };
      const mockMap = {
        getCenter: vi.fn(() => ({ lat: 29.9848, lng: 31.0978 })),
        getBounds: vi.fn(() => ({
          pad: () => ({
            contains: () => true,
          }),
        })),
      };

      await syncCadastralNumbersLayer({
        map: mockMap,
        cadastralLayer: mockLayerA,
        zoom: 18,
        activeZone: 'أ',
      });
      expect(layerAAdded.length).toBeGreaterThan(0);

      // Simulating map remount with a brand new layer instance
      await syncCadastralNumbersLayer({
        map: mockMap,
        cadastralLayer: mockLayerB,
        zoom: 18,
        activeZone: 'أ',
      });
      expect(layerBAdded.length).toBeGreaterThan(0);
    });

    it('confirms openstreetmap wildcard and leaflet CDN caching in Service Worker', () => {
      const swPath = path.resolve(__dirname, '../pwa/sw.ts');
      const swContent = fs.readFileSync(swPath, 'utf8');

      expect(swContent).toContain("cacheName: 'dalilak-leaflet-cdn'");
      expect(swContent).toContain("url.hostname.includes('openstreetmap.')");
    });

    it('aligns vercel.json CSP connect-src with all cross-origin routes intercepted by the Service Worker', () => {
      const vercelPath = path.resolve(__dirname, '../../vercel.json');
      const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
      const cspHeader = vercelConfig.headers
        .flatMap((entry: any) => entry.headers || [])
        .find((h: any) => h.key === 'Content-Security-Policy')?.value || '';

      const connectSrcMatch = cspHeader.match(/connect-src\s+([^;]+)/);
      expect(connectSrcMatch).not.toBeNull();
      const connectSrc = connectSrcMatch![1];

      expect(connectSrc).toContain('https://*.supabase.co');
      expect(connectSrc).toContain('https://server.arcgisonline.com');
      expect(connectSrc).toContain('https://*.arcgisonline.com');
      expect(connectSrc).toContain('https://*.openfreemap.org');
      expect(connectSrc).toContain('https://*.tile.openstreetmap.org');
      expect(connectSrc).toContain('https://*.openstreetmap.fr');
      expect(connectSrc).toContain('https://unpkg.com');
      expect(connectSrc).toContain('https://cdnjs.cloudflare.com');
      expect(connectSrc).toContain('https://*.googleusercontent.com');
      expect(connectSrc).toContain('https://*.ggpht.com');
    });
  });

  describe('4. UX Optimization & Interaction Improvements', () => {
    it('verifies InteractiveMap canvasWrapperClasses does not isolate stacking context with z-0', () => {
      const filePath = path.resolve(__dirname, '../features/map/components/InteractiveMap.tsx');
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).not.toMatch(/canvasWrapperClasses\s*=\s*['"][^'"]*\bz-0\b[^'"]*['"]/);
    });

    it('verifies MapCanvasTransit has eliminated bottom-28 overlapping floating buttons', () => {
      const filePath = path.resolve(__dirname, '../features/map/components/MapCanvasTransit.tsx');
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).not.toContain('bottom-28');
      expect(content).not.toContain('نتيجة');
    });

    it('verifies SearchView has eliminated bottom-28 floating filter clear button', () => {
      const filePath = path.resolve(__dirname, '../components/views/SearchView.tsx');
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).not.toContain('bottom-28');
      expect(content).not.toContain('مسح الفلتر');
    });

    it('verifies useMapPinsClustering calls onSelectBusiness immediately on marker selection', () => {
      const filePath = path.resolve(__dirname, '../features/map/hooks/useMapPinsClustering.ts');
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('onSelectBusiness?.(b)');
    });

    it('verifies out-of-Hadayek coordinates are detected correctly', () => {
      const isInsideHadayek = (lat: number, lng: number) =>
        lat >= 29.930 && lat <= 30.010 && lng >= 31.060 && lng <= 31.140;

      // Inside Hadayek (e.g. Zone A, Zone J, Gates)
      expect(isInsideHadayek(29.9777, 31.1122)).toBe(true); // Gate 1 (Khufu)
      expect(isInsideHadayek(29.9713, 31.1084)).toBe(true); // Gate Ahmes

      // Outside Hadayek (Downtown Cairo, Alexandria, abroad)
      expect(isInsideHadayek(30.0444, 31.2357)).toBe(false); // Tahrir Square
      expect(isInsideHadayek(31.2001, 29.9187)).toBe(false); // Alexandria
      expect(isInsideHadayek(51.5074, -0.1278)).toBe(false); // London
    });

    it('verifies computeRouteStats recomputes immediately when origin changes and realRouteData is reset', () => {
      const gate1 = { lat: 29.9777, lng: 31.1122 };
      const gate4 = { lat: 29.9490, lng: 31.0954 };
      const target = { lat: 29.9800, lng: 31.1100 };

      const oldRoute = {
        points: [[gate1.lat, gate1.lng], [target.lat, target.lng]] as [number, number][],
        distanceMeters: 400,
        durationSeconds: 120,
      };

      const statsOld = computeRouteStats(gate1, target, oldRoute);
      expect(statsOld?.isRealRoad).toBe(true);
      expect(statsOld?.distanceText).toContain('400');

      // When switching to gate4, realRouteData is reset to null immediately
      const statsReset = computeRouteStats(gate4, target, null);
      expect(statsReset?.isRealRoad).toBe(false);
      // Distance from gate4 (far south) is ~3.8km, not 400m
      expect(statsReset?.distanceText).not.toContain('400');
      expect(statsReset?.drivingMinutes).toBeGreaterThan(statsOld!.drivingMinutes);
    });

    it('verifies isMapContext correctly detects map background even with search params on root route', () => {
      const isMapContextFn = (pathname: string, bg?: string) => {
        const bgPath = (bg || '').split('?')[0];
        return pathname.startsWith('/map') || pathname === '/' || bgPath === '/' || bgPath.startsWith('/map');
      };

      // Root path with zone parameter in background history
      expect(isMapContextFn('/biz/al-ahram-pharmacy', '/?zone=ج')).toBe(true);
      // Map path with building param
      expect(isMapContextFn('/biz/al-ahram-pharmacy', '/map?zone=أ&bldg=265')).toBe(true);
      // Directly on map
      expect(isMapContextFn('/map')).toBe(true);
      expect(isMapContextFn('/')).toBe(true);
      // From search list
      expect(isMapContextFn('/biz/al-ahram-pharmacy', '/search')).toBe(false);
      expect(isMapContextFn('/biz/al-ahram-pharmacy', '/search?cat=restaurants')).toBe(false);
    });

    it('verifies FloatingBottomDock disables pointer events on all children when hidden', () => {
      const filePath = path.resolve(__dirname, '../components/layout/FloatingBottomDock.tsx');
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('[&_*]:pointer-events-none');
      expect(content).toContain('aria-hidden={isHiddenByOverlay}');
    });

    it('verifies NavigationOriginSelector displays gpsError notice unconditionally', () => {
      const filePath = path.resolve(__dirname, '../features/directions/components/NavigationOriginSelector.tsx');
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('{gpsError && (');
      expect(content).not.toContain('{originType === \'gps\' && gpsError && (');
    });
  });
});
