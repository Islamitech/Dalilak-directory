# Architecture & Refactoring Gap Analysis — Dalilak Directory

**Date**: October 4, 2026  
**Branch**: `refactor/ux-architecture`  
**Base Commit**: `a66b253`  
**Purpose**: Rigorous and honest audit of the original refactoring plan versus the actual state of the codebase. Every item is verified with file evidence, exact line counts, and `git grep` results.

---

## 1. Plan Execution Status Matrix (Original Plan vs. Reality)

| Plan Item | Description | Status | Concrete File Evidence & Notes |
| :--- | :--- | :---: | :--- |
| **Step 1: Design System Tokens & RTL Foundations** | Centralized CSS variables in `src/index.css`, Tailwind 4 theme tokens, Arabic font stack, logical properties (`ms-`, `me-`, `ps-`, `pe-`). | **PARTIAL** | Tokens created in `src/index.css`. However, physical direction utilities still remain in active components (`left-`, `right-` in `src/components/InteractiveMap.tsx:75`, `src/components/PublicShowcase.tsx:210`, `src/components/activity/PhotoLightbox.tsx:64`, `src/shared/ui/Toast.tsx:22`). Dark theme tokens are partially applied with fallback gaps. |
| **Step 2: Shared Pure Libraries (`src/shared/lib/`)** | Pure, side-effect-free helpers (`phone.ts`, `whatsapp.ts`, `directions.ts`, `arabic.ts`, `format.ts`). | **PARTIAL** | Core libraries created in `src/shared/lib/` and verified with unit tests (`src/tests/shared_lib.test.ts`). However, old-path re-exports remain (`src/utils/phone.ts`) and are still actively imported by callers (`src/components/views/ForBusinessView.tsx`, `src/tests/phone_validator.test.ts`, `src/tests/repair.test.ts`). `src/utils/hadayekRouting.ts` still imported directly by `InAppNavigationDrawer.tsx`. |
| **Step 3: Data Separation (`src/shared/data/`)** | Separate static constants (`geography.ts`, `categories.ts`, `packages.ts`) from mock fixtures (`mockData.ts`). | **PARTIAL** | Static datasets extracted to `src/shared/data/`. However, massive geodata files (`src/data/hadayekBuildingsCoords.json` [79,134 lines, 1.65 MB] and `src/data/hadayekDistrictsGeoData.ts` [1,671 lines]) are statically imported by map utilities, leaking into bundles rather than being cleanly lazy-loaded. |
| **Step 4: Design System UI Primitives (`src/shared/ui/`)** | Accessible primitives (`Button`, `IconButton`, `Card`, `Modal`, `Drawer`, `Skeleton`, `EmptyState`, `SearchField`, `Toast`). | **PARTIAL** | 10 primitives created in `src/shared/ui/`. However, multiple primitives have zero callers (`IconButton`, `SearchField`), while ad-hoc implementations remain across the app (`ActivityDetailModal.tsx` is an ad-hoc modal, `InAppNavigationDrawer.tsx` and `ProximityRadarDrawer.tsx` are ad-hoc drawers, `SmartSearchBar.tsx` is an ad-hoc search field). |
| **Step 5: Feature Unification — Business Card & Actions** | Create `UnifiedBusinessCard` with variants (`grid`, `compact`, `map-popup`, `detail`). Standardize actions: Call -> WhatsApp -> Directions. | **PARTIAL** | `UnifiedBusinessCard.tsx` created (309 lines), but only supports `grid` and `compact`. `map-popup` and `detail` variants were NOT implemented; map markers still generate ad-hoc HTML popups in `useMapPinsClustering.ts` and `ActivityDetailModal.tsx` remains a separate 754-line duplicate. |
| **Step 6: App Shell & Composition Root (`src/app/`)** | Slim `src/App.tsx` from 382 to <150 lines. Extract data lifecycle into `useCatalogLifecycle.ts`. | **PARTIAL** | `src/App.tsx` slimmed to 32 lines. However, `useCatalogLifecycle.ts` grew to 281 lines (violating the 120-line hook limit), `src/app/providers` was never created, and `src/components/PublicShowcase.tsx` remains a 667-line monolithic secondary orchestrator. |
| **Step 7: Feature Modularization (`src/features/`)** | Reorganize `search`, `business-details`, `favorites`, `pricing`, `for-business`, `about`, `atlas`, `map`, `directions` into feature slices with `index.ts`. | **NOT STARTED** | Only `src/features/catalog` and partial `src/features/business-details` exist. All other features (`search`, `map`, `atlas`, `directions`, `favorites`, `for-business`, `pricing`, `about`) still reside under `src/components/` and `src/directory-experience/`. |
| **Step 8: Guards, Linting & Bundle Check Scripts** | Implement `scripts/check-architecture.cjs` and `scripts/check-bundle.cjs`. Wire to `npm run check:architecture` and `npm run check:bundle`. | **PARTIAL** | Scripts exist and pass. However, `check-architecture.cjs` only checks `App.tsx <= 150`, circular imports, and `shared/lib` purity. It does NOT guard component lines <= 250, hook lines <= 120, cross-feature deep imports, or physical CSS classes. Bundle budgets have generous arbitrary caps rather than measured size + 10% headroom. |
| **Step 9: Verification, Tests & Documentation** | Run full test suite, E2E accessibility and user flow tests, responsive evidence across breakpoints. | **PARTIAL** | Existing test suites pass (`npm test`). However, Playwright E2E tests for safe action links, `/biz/:id` deep link, offline fallback, 360px RTL, and keyboard dialog traversal are missing. `axe-core` is NOT installed in `node_modules`. |

---

## 2. Components Exceeding 250 Lines in `src/`

*Audit Rule: Components (`.tsx`) must not exceed 250 lines.*

| Line Count | File Path | Primary Responsibilities & Violations |
| :---: | :--- | :--- |
| **754** | `src/components/activity/ActivityDetailModal.tsx` | Monolithic entity modal: ad-hoc dialog overlay, photo lightbox gallery, video embed, business hours calculations, contact action links. |
| **667** | `src/components/PublicShowcase.tsx` | Monolithic UI shell: view routing, active filter state, geolocation watch, JSON-LD schema injection, modal visibility orchestration. |
| **645** | `src/components/PackagesHub.tsx` | Pricing table, plan feature matrix, WhatsApp lead generation, FAQ accordion. |
| **555** | `src/components/views/SearchView.tsx` | Search view coordinator: filter chips, search input, sort controls, catalog pagination, discovery category grid. |
| **532** | `src/components/InteractiveMap.tsx` | Leaflet container lifecycle, offline tile retry overlay, fallback toast, zoom control buttons. |
| **495** | `src/components/map/MapModernTopBar.tsx` | Ad-hoc map search input, zone selector dropdown, category filter trigger, mobile filter sheet. |
| **472** | `src/components/map/MapHeaderBar.tsx` | Redundant map top navigation bar and filter controls. |
| **409** | `src/components/search/FilterDrawer.tsx` | Filter panel: governorate/city/zone pickers, category tree, rating checkboxes, working hours toggle. |
| **374** | `src/components/views/HomeView.tsx` | Landing view: hero search trigger, category showcase, featured businesses, value proposition. |
| **358** | `src/components/views/ForBusinessView.tsx` | Merchant landing view: registration form, phone validation, benefit cards, WhatsApp quote submission. |
| **351** | `src/components/map/InAppNavigationDrawer.tsx` | Ad-hoc navigation drawer: turn-by-turn routing steps, GPS route fetching, coordinate display. |
| **341** | `src/components/atlas/ProximityRadarDrawer.tsx` | Ad-hoc radar drawer: landmark proximity list, compass bearing, gate distance calculations. |
| **335** | `src/directory-experience/map/MapScreen.tsx` | Duplicate map screen in directory-experience legacy path. |
| **322** | `src/components/layout/AppNavbar.tsx` | Global top navigation: brand logo, view links, mobile hamburger drawer, saved items counter. |
| **312** | `src/components/search/SmartSearchBar.tsx` | Ad-hoc search input: autocomplete dropdown, recent searches, clear button, debounce handler. |
| **309** | `src/features/business-details/components/UnifiedBusinessCard.tsx` | Business card implementation exceeding limit with complex action bar rendering and inline badge logic. |
| **277** | `src/components/views/MapView.tsx` | Map view container: building search serialization, selected business drawer trigger, atlas launcher. |
| **273** | `src/components/views/MapSandboxView.tsx` | Sandbox view for map testing and developer preview. |
| **252** | `src/components/atlas/HadayekAtlasNavigator.tsx` | Hadayek gate selector, zone index cards, emergency contact list. |

*Total Violations*: **19 component files** exceed the 250-line limit.

---

## 3. Custom Hooks Exceeding 120 Lines in `src/`

*Audit Rule: Custom hooks (`use*.ts`, `use*.tsx`) must not exceed 120 lines.*

| Line Count | File Path | Primary Responsibilities & Violations |
| :---: | :--- | :--- |
| **1,229** | `src/components/map/hooks/useMapPinsClustering.ts` | Massive hook combining spatial supercluster management, pin filtering, marker click events, and raw HTML string popup generation. |
| **475** | `src/components/map/hooks/useMapInstance.ts` | Leaflet map instantiation, tile layers, boundary bounds, flyTo/panTo camera transitions. |
| **281** | `src/features/catalog/hooks/useCatalogLifecycle.ts` | Supabase REST pagination, localStorage cache fallback, realtime change subscription, broadcast channels. |
| **154** | `src/components/map/hooks/useMapGeolocation.ts` | Geolocation watcher, accuracy circles, watchPosition error handling. |
| **130** | `src/hooks/useAccessibleDialog.ts` | Focus trapping, Esc key handling, body scroll locking, focus restoration. |

*Total Violations*: **5 custom hooks** exceed the 120-line limit.

---

## 4. Features Still Outside `src/features/`

The target architecture defines feature-sliced modules under `src/features/<feature-name>/` containing `components/`, `hooks/`, `model/`, and `index.ts`. Currently, 9 out of 10 intended features remain misplaced:

| Intended Feature Module | Current Scattered Locations | Status |
| :--- | :--- | :---: |
| `src/features/search` | `src/components/search/`, `src/components/views/SearchView.tsx`, `src/utils/activitySearchIntent.ts`, `src/utils/arabicSearch.ts` | **OUTSIDE** |
| `src/features/map` | `src/components/map/`, `src/components/InteractiveMap.tsx`, `src/components/views/MapView.tsx`, `src/directory-experience/map/` | **OUTSIDE** |
| `src/features/atlas` | `src/components/atlas/`, `src/data/hadayekAtlasData.ts` | **OUTSIDE** |
| `src/features/directions` | `src/components/map/InAppNavigationDrawer.tsx`, `src/utils/hadayekRouting.ts`, `src/shared/lib/directions.ts` | **OUTSIDE** |
| `src/features/favorites` | `src/components/views/FavoritesView.tsx` | **OUTSIDE** |
| `src/features/for-business` | `src/components/views/ForBusinessView.tsx` | **OUTSIDE** |
| `src/features/pricing` | `src/components/PackagesHub.tsx`, `src/components/views/BusinessPricingView.tsx` | **OUTSIDE** |
| `src/features/about` | `src/components/views/AboutView.tsx` | **OUTSIDE** |
| `src/features/share` | Ad-hoc share buttons in `ActivityDetailModal.tsx`, `AppNavbar.tsx`, `PlaceDetails.tsx` | **OUTSIDE** |
| `src/features/business-details` | Partially in `src/features/business-details/`, but `ActivityDetailModal.tsx` and `PhotoLightbox.tsx` remain in `src/components/activity/` | **PARTIAL** |

---

## 5. `shared/ui` Primitives Adoption & Importers

*Audit Command*: Scanned all imports across `src/` for design system primitives.

| Primitive File | Total Importers | Importer Files | Status |
| :--- | :---: | :--- | :---: |
| `src/shared/ui/IconButton.tsx` | **0** | None | **ZERO IMPORTERS** (Unused Dead Code) |
| `src/shared/ui/SearchField.tsx` | **0** | None | **ZERO IMPORTERS** (Unused Dead Code) |
| `src/shared/ui/Skeleton.tsx` | **1** | `src/components/cards/BusinessCardGrid.tsx` | **UNDERUTILIZED** |
| `src/shared/ui/Chip.tsx` | **2** | `src/components/views/SearchView.tsx`, `src/features/business-details/components/UnifiedBusinessCard.tsx` | **UNDERUTILIZED** |
| `src/shared/ui/Drawer.tsx` | **2** | `src/components/search/FilterDrawer.tsx`, `src/components/views/SearchView.tsx` | **UNDERUTILIZED** |
| `src/shared/ui/EmptyState.tsx` | **2** | `src/components/cards/BusinessCardGrid.tsx`, `src/components/views/FavoritesView.tsx` | **UNDERUTILIZED** |
| `src/shared/ui/Toast.tsx` | **1** | `src/App.tsx` | **ADOPTED** |
| `src/shared/ui/Card.tsx` | **5** | `BusinessCardGrid`, `FavoritesView`, `SearchDiscoveryFeatured`, `SearchView`, `UnifiedBusinessCard` | **ADOPTED** |
| `src/shared/ui/Modal.tsx` | **5** | `BusinessCardGrid`, `FavoritesView`, `SearchDiscoveryFeatured`, `SearchView`, `UnifiedBusinessCard` | **PARTIALLY ADOPTED** (Major modals still ad-hoc) |
| `src/shared/ui/Button.tsx` | **6** | `BusinessCardGrid`, `FilterDrawer`, `FavoritesView`, `SearchDiscoveryFeatured`, `SearchView`, `UnifiedBusinessCard` | **ADOPTED** |

---

## 6. Old-Path Re-exports Still Present

*Audit Finding*: Two compatibility shim files exist in the codebase:

1. **`src/components/cards/BusinessCard.tsx`** (10 lines):
   - Re-exports `UnifiedBusinessCard` from `src/features/business-details/components/UnifiedBusinessCard`.
   - Still imported by: `src/components/cards/BusinessCardGrid.tsx`.
2. **`src/utils/phone.ts`** (7 lines):
   - Re-exports phone normalization functions from `src/shared/lib/phone`.
   - Still imported by: `src/components/views/ForBusinessView.tsx`, `src/tests/phone_validator.test.ts`, `src/tests/repair.test.ts`.

---

## 7. Duplicated Features Still Present

### A. Search Input & Autocomplete Flow
- `src/components/search/SmartSearchBar.tsx` (312 lines): Independent search input with debounce and history.
- `src/components/map/ZoneScopedSearchBar.tsx` (112 lines): Secondary search input with zone-scoping.
- `src/components/map/MapModernTopBar.tsx`: Inline search input embedded in map bar.
- `src/shared/ui/SearchField.tsx`: Standardized primitive with zero callers.
- `src/components/views/HomeView.tsx`: Inline hero search input.

### B. Directions & Navigation Flow
- `src/components/map/InAppNavigationDrawer.tsx` (351 lines): Custom in-app turn-by-turn routing UI.
- `src/shared/lib/directions.ts`: Canonical Google Maps / Waze intent generator.
- `src/components/activity/ActivityDetailModal.tsx`: Ad-hoc directions link generator.
- `src/features/business-details/components/UnifiedBusinessCard.tsx`: Ad-hoc directions button.
- `src/components/map/MapSelectedBusinessDrawer.tsx`: Ad-hoc directions button.
- `src/directory-experience/details/PlaceDetails.tsx`: Ad-hoc directions button.

### C. Call & WhatsApp Action Buttons
- `src/components/activity/ActivityDetailModal.tsx`: Direct `<a href="tel:...">` and `<a href="https://wa.me/...">`.
- `src/features/business-details/components/UnifiedBusinessCard.tsx`: Re-implemented action button bar.
- `src/components/map/MapSelectedBusinessDrawer.tsx`: Duplicate action button row.
- `src/components/map/hooks/useMapPinsClustering.ts`: HTML string popup with hardcoded `wa.me` and `tel:` anchor tags.
- `src/components/views/ForBusinessView.tsx`: Custom WhatsApp registration redirect.
- `src/components/PackagesHub.tsx`: Custom WhatsApp quote generator.
- `src/directory-experience/discovery/PlaceCard.tsx`: Duplicate action button row.

### D. Card Variants Used in Map Popup & Entity Details
- `src/features/business-details/components/UnifiedBusinessCard.tsx`: Supports `grid` and `compact` variants only.
- `src/components/map/hooks/useMapPinsClustering.ts`: Generates custom raw HTML strings for popup card previews with duplicated styles and badges.
- `src/components/map/MapSelectedBusinessDrawer.tsx`: Ad-hoc drawer card layout for selected map markers.
- `src/components/activity/ActivityDetailModal.tsx`: Ad-hoc detail presentation for entity modal.
- `src/directory-experience/map/MapActivityCards.tsx`: Alternate card carousel implementation.

---

## 8. WCAG Accessibility & Tooling Check

- **`axe-core`**: Verified **NOT INSTALLED** (`Cannot find module 'axe-core'`).
- **Status**: Marked **BLOCKED**. In accordance with instructions, WCAG compliance cannot and will not be claimed without automated axe-core verification. Focus trap, focus restore, and keyboard escape handling will be verified via Playwright tests.

---

## 9. Action Plan for Round 2 Execution

1. **Adopt, Then Delete**:
   - Wire `IconButton`, `SearchField`, `Modal`, `Drawer`, `Chip`, and `Skeleton` into all ad-hoc components (`ActivityDetailModal`, `VideoPlayerModal`, `HadayekGatesModal`, drawers, and search bars).
   - Migrate callers of `BusinessCard.tsx` and `src/utils/phone.ts` to their canonical paths and delete the re-export shims.
2. **Split Components & Hooks**:
   - Split all 19 oversized components to <= 250 lines.
   - Split all 5 oversized hooks to <= 120 lines.
   - Establish feature directory structure: `src/features/{search,map,atlas,directions,favorites,share,for-business,pricing,about}` with public `index.ts`.
3. **Unify Card Variants**:
   - Extend `UnifiedBusinessCard` to support `grid`, `compact`, `map-popup`, and `detail`.
   - Update `useMapPinsClustering.ts` and `ActivityDetailModal.tsx` to utilize `UnifiedBusinessCard`.
4. **Single Search Primitive**:
   - Connect all search surfaces (`HomeView`, `SearchView`, `MapModernTopBar`) to `SearchField` and unified `useCatalogSearch`.
5. **Enforce Architectural Guards**:
   - Upgrade `scripts/check-architecture.cjs` to enforce <= 250 component lines, <= 120 hook lines, no cross-feature deep imports, and no forbidden physical direction classes.
6. **Performance & Lazy Loading**:
   - Lazy load `hadayekBuildingsCoords.json` and atlas geodata out of the initial chunk.
   - Tighten bundle budgets to measured + 10% headroom.
7. **Playwright E2E Tests**:
   - Add verification for search -> open business -> safe action links, deep link `/biz/:id`, offline fallback, 360px RTL, and keyboard dialog traversal.
