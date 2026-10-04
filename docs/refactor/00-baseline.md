# Baseline Measurement Report — Dalilak Directory Refactor

**Date**: October 4, 2026  
**Branch**: `refactor/ux-architecture`  
**Commit**: Base of `refactor/ux-architecture` (from `fix/main-round-2`)  
**Auditor/Architect**: Senior Frontend Architect & UX Engineer  

---

## 1. Top 30 Source Files by Line Count (`src/`)

| Rank | File Path | Line Count | Primary Role / Notes |
| :---: | :--- | :---: | :--- |
| 1 | `src/data/hadayekBuildingsCoords.json` | 79,134 | Cadastral building coordinate database (1.65 MB raw JSON) |
| 2 | `src/data/hadayekDistrictsGeoData.ts` | 1,671 | Hadayek Al-Ahram polygon boundaries & gate coordinates |
| 3 | `src/components/map/hooks/useMapPinsClustering.ts` | 1,229 | Map pin spatial clustering, filtering, popup generation |
| 4 | `src/components/map/badgeMarkers.ts` | 1,133 | Custom SVG badge generation for Leaflet markers |
| 5 | `src/index.css` | 1,043 | Global stylesheet (Tailwind 4, animations, scrollbars, overrides) |
| 6 | `src/tests/map_fixes.test.ts` | 995 | Map regression and bug-fix test suite |
| 7 | `src/components/activity/ActivityDetailModal.tsx` | 754 | Entity details modal (gallery, call, whatsapp, map, reviews) |
| 8 | `src/components/PublicShowcase.tsx` | 667 | Monolithic UI orchestrator, view switcher, filter state |
| 9 | `src/data/mockData.ts` | 661 | Mixed file: static constants + sandbox fixtures |
| 10 | `src/components/views/SearchView.tsx` | 654 | Catalog search view, pagination, sorting, active filters |
| 11 | `src/components/PackagesHub.tsx` | 645 | Pricing packages comparison, WhatsApp quotes, lead flow |
| 12 | `src/data/hadayekAtlasData.ts` | 586 | Geographic landmark index and gate directory |
| 13 | `src/components/InteractiveMap.tsx` | 532 | Leaflet map container, lifecycle, tile fallback handlers |
| 14 | `src/components/map/MapModernTopBar.tsx` | 495 | Map search bar, zone switcher, category filter drawer |
| 15 | `src/components/map/hooks/useMapInstance.ts` | 475 | Leaflet map instantiation, bounds, pan/fly management |
| 16 | `src/components/map/MapHeaderBar.tsx` | 472 | Secondary map top navigation bar |
| 17 | `src/tests/safety_net_batch0.test.ts` | 448 | Safety net regression contract suite |
| 18 | `src/components/search/FilterDrawer.tsx` | 406 | Search and discovery multi-attribute filter drawer |
| 19 | `src/App.tsx` | 382 | Monolithic application root (fetch, cache, realtime, routing) |
| 20 | `src/utils/directoryEnhancements.ts` | 379 | Business metadata helpers, distance, shuffle, schema.org |
| 21 | `src/components/views/HomeView.tsx` | 374 | Home showcase, hero, category grid, featured activities |
| 22 | `src/utils/hadayekZoneHelper.ts` | 372 | Cadastral district normalization, bounding box checks |
| 23 | `src/components/views/ForBusinessView.tsx` | 358 | Merchant onboarding and WhatsApp registration view |
| 24 | `src/components/map/InAppNavigationDrawer.tsx` | 351 | Turn-by-turn navigation drawer and directions |
| 25 | `src/components/atlas/ProximityRadarDrawer.tsx` | 341 | Nearby landmarks radar drawer |
| 26 | `src/directory-experience/map/MapScreen.tsx` | 335 | Standalone preview map screen |
| 27 | `src/tests/map_geolocation.test.ts` | 334 | Geolocation test harness |
| 28 | `src/components/layout/AppNavbar.tsx` | 322 | Main application header and responsive navigation |
| 29 | `src/components/map/utils/pinDispersal.ts` | 316 | Overlapping coordinate offset calculation |
| 30 | `src/components/cards/BusinessCard.tsx` | 314 | Unified business listing card (search, grid, favorites) |

---

## 2. Large Files & Monolithic Modules

### Files Exceeding 300 Lines (Excluding Datasets and Tests)
1. `src/components/map/hooks/useMapPinsClustering.ts` (1,229 lines)
2. `src/components/map/badgeMarkers.ts` (1,133 lines)
3. `src/index.css` (1,043 lines)
4. `src/components/activity/ActivityDetailModal.tsx` (754 lines)
5. `src/components/PublicShowcase.tsx` (667 lines)
6. `src/components/views/SearchView.tsx` (654 lines)
7. `src/components/PackagesHub.tsx` (645 lines)
8. `src/components/InteractiveMap.tsx` (532 lines)
9. `src/components/map/MapModernTopBar.tsx` (495 lines)
10. `src/components/map/hooks/useMapInstance.ts` (475 lines)
11. `src/components/map/MapHeaderBar.tsx` (472 lines)
12. `src/components/search/FilterDrawer.tsx` (406 lines)
13. `src/App.tsx` (382 lines)
14. `src/utils/directoryEnhancements.ts` (379 lines)
15. `src/components/views/HomeView.tsx` (374 lines)
16. `src/utils/hadayekZoneHelper.ts` (372 lines)
17. `src/components/views/ForBusinessView.tsx` (358 lines)
18. `src/components/map/InAppNavigationDrawer.tsx` (351 lines)
19. `src/components/atlas/ProximityRadarDrawer.tsx` (341 lines)
20. `src/components/layout/AppNavbar.tsx` (322 lines)
21. `src/components/map/utils/pinDispersal.ts` (316 lines)
22. `src/components/cards/BusinessCard.tsx` (314 lines)
23. `src/components/search/SmartSearchBar.tsx` (312 lines)

### Custom Hooks Exceeding 150 Lines
1. `src/components/map/hooks/useMapPinsClustering.ts`: **1,229 lines** (Massive hook combining clustering, spatial search, marker instantiation, and popup HTML templating).
2. `src/components/map/hooks/useMapInstance.ts`: **475 lines** (Map initialization, layer lifecycle, camera transitions).
3. `src/components/map/hooks/useMapGeolocation.ts`: **154 lines** (Browser geolocation watch and coordinate state).

---

## 3. Components with Violations of Single Responsibility Principle

1. **`src/App.tsx`**:
   - Fetches and paginates REST data from Supabase.
   - Manages LocalStorage and IndexedDB caches.
   - Subscribes to Supabase Postgres Realtime changes.
   - Coordinates multi-tab BroadcastChannel communication.
   - Parses deep-link query parameters (`biz`, `place`, `ref`).
   - Renders root theme providers, toast notifications, and UI showcase.
2. **`src/components/PublicShowcase.tsx`**:
   - Manages router path state and browser history transitions.
   - Stores all filter parameters (search text, governorate, city, zone, category, subcategory, open now, rating, video).
   - Tracks user geolocation coordinates.
   - Controls entity modal visibility, video modal visibility, and favorite toggles.
   - Dynamically injects Schema.org JSON-LD and page `<title>` metadata.
3. **`src/components/activity/ActivityDetailModal.tsx`**:
   - Handles photo gallery lightbox and thumbnail carousel.
   - Manages video player preview.
   - Computes open/closed status and working hours.
   - Formats phone numbers, creates WhatsApp chat intents, and Google Maps directions URLs.
   - Implements merchant claim dialog and feedback submission form.
4. **`src/components/cards/BusinessCard.tsx`**:
   - Renders visual card layouts.
   - Formats localized addresses and categories.
   - Computes user distance from business.
   - Directly creates phone and WhatsApp anchor URLs.
   - Dispatches favorite toggle state.

---

## 4. Prop-Drilling Depth Analysis

Multiple states originate in `App.tsx` or `PublicShowcase.tsx` and are passed through up to 5 levels of intermediate components:

```
App.tsx
 └── PublicShowcase.tsx
      ├── (Level 1) SearchView.tsx
      │    └── (Level 2) FilterBar.tsx
      │         └── (Level 3) FilterDrawer.tsx
      │              └── (Level 4) CategoryHierarchyFilter.tsx
      ├── (Level 1) MapView.tsx
      │    └── (Level 2) InteractiveMap.tsx
      │         └── (Level 3) MapModernTopBar.tsx
      │              └── (Level 4) ZoneScopedSearchBar.tsx
      └── (Level 1) SearchView.tsx / FavoritesView.tsx
           └── (Level 2) BusinessCardGrid.tsx
                └── (Level 3) BusinessCard.tsx
                     └── (Level 4) Action buttons / Badges
```

**Variables subjected to deep prop-drilling**:
- `searchQuery`, `setSearchQuery`
- `categoryFilter`, `setCategoryFilter`
- `hadayekZoneFilter`, `setHadayekZoneFilter`
- `openNowOnly`, `hasRatingOnly`, `hasVideoOnly`
- `userCoords`, `isLocatingUser`
- `favorites`, `toggleFavorite`
- `onSelectBusiness`, `onNavigate`

---

## 5. Duplicated Logic Across Modules

| Category | Canonical Utility | Duplicated Occurrences Found in Codebase |
| :--- | :--- | :--- |
| **Phone & WhatsApp** | `src/utils/phone.ts` | 1. `BusinessCard.tsx:95-110` (custom regex and `wa.me` string concatenation)<br>2. `ActivityDetailModal.tsx:180-205` (custom phone parser)<br>3. `ForBusinessView.tsx:32` (hardcoded WhatsApp anchor)<br>4. `PlaceDetails.tsx` (duplicate WhatsApp intent) |
| **Google Maps & Directions** | `src/utils/hadayekRouting.ts` | 1. `ActivityDetailModal.tsx:240-270` (`https://www.google.com/maps/search/?api=1&query=...`)<br>2. `BusinessCard.tsx` (`https://www.google.com/maps/dir/?api=1&destination=...`)<br>3. `InAppNavigationDrawer.tsx` (separate routing handler) |
| **Arabic Text Search** | `src/utils/arabicSearch.ts` | 1. `ZoneScopedSearchBar.tsx:45` (in-line Arabic character normalization)<br>2. `hadayekBuildingSearch.ts` (independent numeral translation) |
| **Card / Preview Rendering** | `BusinessCard.tsx` | 1. `MapSelectedBusinessDrawer.tsx` (separate card layout)<br>2. `PlaceCard.tsx` (directory preview layout)<br>3. `useMapPinsClustering.ts:600-680` (raw HTML card template literal inside Leaflet popup) |
| **Distance Calculation** | `src/utils/directoryEnhancements.ts` | 1. `ProximityRadarDrawer.tsx` (re-implemented Haversine formula)<br>2. `pinDispersal.ts` (pythagorean distance approximation) |
| **Category Taxonomy** | `src/data/categoryTaxonomy.ts` | 1. `src/data/mockData.ts` (`CATEGORY_GROUPS`)<br>2. `hadayekZoneHelper.ts` (re-exports category groups)<br>3. `categoryMatcher.ts` (hardcoded category mappings) |

---

## 6. Dead Code & Orphaned Files (Evidence from Grep)

1. **`src/services/storage.ts`**:
   - **Grep Proof**: `git grep "services/storage"` shows 0 imports in `src/`. It is only mentioned in documentation files and test audit reports.
   - **Status**: Orphaned service. Can be safely moved or deprecated.
2. **`src/data/mockData.ts` (Fixtures vs Constants)**:
   - Contains `MOCK_SANDBOX_BUSINESSES` and `MOCK_PRESETS` which are only used by `src/components/views/MapSandboxView.tsx`.
   - Contains static production data (`EGYPT_GOVERNORATES`, `HADAYEK_ALAHRAM_ZONES`, `CATEGORY_GROUPS`) which are imported across the main app.
   - **Status**: Coupling mock fixtures with production constants bundles 34 kB of unnecessary mock data into the production app.
3. **`src/directory-experience/`**:
   - An isolated preview and component laboratory.
   - Tested by `scripts/verify-directory-preview.mjs` and `src/directory-experience/tests/screens.test.tsx`.
   - Never imported by `App.tsx` or `PublicShowcase.tsx`.

---

## 7. Production Bundle Report (Vite Build Analysis)

### JavaScript Chunks
| Asset File | Raw Size | Gzip Size | Chunk Type |
| :--- | :---: | :---: | :--- |
| `hadayekBuildingsCoords-*.js` | 915.89 kB | 95.18 kB | Dynamically imported cadastral database |
| `react-vendor-*.js` | 219.44 kB | 66.12 kB | React, ReactDOM, Scheduler vendor chunk |
| `supabase-vendor-*.js` | 217.26 kB | 56.81 kB | Supabase client vendor chunk |
| `index-*.js` | 184.05 kB | 51.85 kB | Main application entry chunk |
| `InteractiveMap-*.js` | 148.77 kB | 40.12 kB | Leaflet interactive map lazy chunk |
| `SearchView-*.js` | 39.79 kB | 9.04 kB | Search & discovery lazy chunk |
| `BusinessPricingView-*.js` | 36.76 kB | 9.49 kB | Pricing view lazy chunk |
| `ActivityDetailModal-*.js` | 26.37 kB | 6.92 kB | Activity detail modal lazy chunk |
| `ForBusinessView-*.js` | 11.59 kB | 3.55 kB | Merchant registration lazy chunk |
| `MapSandboxView-*.js` | 7.54 kB | 2.41 kB | Developer sandbox lazy chunk |
| `VideoPlayerModal-*.js` | 6.87 kB | 2.48 kB | Video player modal lazy chunk |
| `AboutView-*.js` | 4.22 kB | 1.56 kB | About view lazy chunk |
| `MapView-*.js` | 3.50 kB | 1.43 kB | Map shell view lazy chunk |
| `FavoritesView-*.js` | 2.64 kB | 1.19 kB | Favorites view lazy chunk |
| `useAccessibleDialog-*.js` | 1.58 kB | 0.77 kB | Dialog accessibility helper |

### CSS Assets
| Asset File | Raw Size | Gzip Size |
| :--- | :---: | :---: |
| `index-*.css` | 121.73 kB | 19.68 kB |

### Initial Load Payload (First Paint Critical Path)
- `index.html`: 12.12 kB (3.57 kB gzip)
- `index-*.js`: 184.05 kB (51.85 kB gzip)
- `react-vendor-*.js`: 219.44 kB (66.12 kB gzip)
- `supabase-vendor-*.js`: 217.26 kB (56.81 kB gzip)
- `index-*.css`: 121.73 kB (19.68 kB gzip)
- **Total Initial Critical JS**: ~620 kB uncompressed (~174 kB gzip)

### Tooling Availability
- `lighthouse`: Not installed locally (Skipped).
- `axe-core`: Not installed locally (Skipped).
- `madge`: Not installed locally (Custom architecture validator script will be implemented).

---

## 8. Screens, Routes, Drawers & Inconsistent Features Inventory

### Routes & Screens
1. `/` (Home View) — `src/components/views/HomeView.tsx`
2. `/search` (Search & Filter Catalog) — `src/components/views/SearchView.tsx`
3. `/map` (Interactive Geospatial Map) — `src/components/views/MapView.tsx`
4. `/saved` (Saved Activities) — `src/components/views/FavoritesView.tsx`
5. `/pricing` (Commercial Tier Showcase) — `src/components/views/BusinessPricingView.tsx`
6. `/about` (Platform Info & Mission) — `src/components/views/AboutView.tsx`
7. `/for-business` (Merchant Registration) — `src/components/views/ForBusinessView.tsx`
8. `/sandbox` (Developer Cadastral Sandbox) — `src/components/views/MapSandboxView.tsx`
9. `/biz/:id` (Direct Business Detail Deep Link) — Orchestrated in `PublicShowcase.tsx`

### Modals & Drawers
1. `ActivityDetailModal` (`src/components/activity/ActivityDetailModal.tsx`)
2. `PhotoLightbox` (`src/components/activity/PhotoLightbox.tsx`)
3. `VideoPlayerModal` (`src/components/VideoPlayerModal.tsx`)
4. `FilterDrawer` (`src/components/search/FilterDrawer.tsx`)
5. `MapSelectedBusinessDrawer` (`src/components/map/MapSelectedBusinessDrawer.tsx`)
6. `BuildingDetailDrawer` (`src/components/map/BuildingDetailDrawer.tsx`)
7. `InAppNavigationDrawer` (`src/components/map/InAppNavigationDrawer.tsx`)
8. `ProximityRadarDrawer` (`src/components/atlas/ProximityRadarDrawer.tsx`)
9. `HadayekGatesModal` (`src/components/atlas/HadayekGatesModal.tsx`)

### Feature Inconsistencies Identified
1. **Search Inputs**:
   - `SmartSearchBar.tsx` (used in `HomeView` and `SearchView`) has debounce, suggestions dropdown, and voice placeholder.
   - `MapModernTopBar.tsx` and `ZoneScopedSearchBar.tsx` have an independent input mechanism with different debouncing and cadastral building number regex matching.
2. **Action Ordering & Variants on Business Cards**:
   - `BusinessCard.tsx`: Favorite button on top image -> Card click opens modal -> Bottom actions: Call, WhatsApp, Directions, Share.
   - `MapSelectedBusinessDrawer.tsx`: Card click -> Actions: Call, WhatsApp, In-App Navigation, Full Details.
   - `ActivityDetailModal.tsx`: Top actions: Share, Favorite, Close -> Middle action: Direct Call, WhatsApp -> Map location: Directions.
3. **Directions Flows**:
   - Clicking directions in `BusinessCard.tsx` opens external Google Maps directions URL.
   - Clicking directions in `MapSelectedBusinessDrawer.tsx` opens `InAppNavigationDrawer.tsx` (an internal simulated path).
   - Inconsistent user expectation: users on the map get internal navigation, while users on search get external Google Maps.
