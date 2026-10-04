# Dalilak Directory Experience — Feature Mapping Matrix

**Document Version:** 1.0.0  
**Phase:** Phase 1 (Documentation & Specifications)  
**Reference Document:** [`docs/design/00-prototype-spec.md`](file:///c:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/docs/design/00-prototype-spec.md)  
**Target:** Unified Public Directory Experience (`Dalilak-directory`)  

---

## 1. Mapping Methodology & Action Taxonomies

To achieve 100% fidelity with the prototype design while maintaining strict stability, performance budgets, and zero loss of features, every UI element and functional capability is mapped into one of five explicit actions:

- **`reuse`**: Existing tested business logic, hooks, state engines, or utilities retained without structural modification.
- **`restyle`**: Existing production components or views adapted to the prototype's visual tokens, typography, and styling.
- **`replace`**: Legacy implementation or prototype placeholder replaced with a newly architected, standards-compliant component.
- **`drop`**: Element permanently removed per Owner Directives (no dummy placeholders).
- **`BLOCKED`**: Architectural change that cannot be implemented until prerequisites outside the repository are fulfilled (e.g. database views).

---

## 2. Master Feature Mapping Table

| # | Prototype Element | Existing Source File(s) | Action | Target Architecture & Implementation Details | Owner Rule |
|---|---|---|:---:|---|:---:|
| 1 | **App Shell Container** (`.app-shell`) | `src/App.tsx`<br>`src/components/PublicShowcase.tsx` | `restyle` | Convert from fixed phone mockup to responsive full-bleed container with desktop two-pane layout at `>=1024px`. | D4 |
| 2 | **Brand Logo & Wordmark** (`.brand`) | `src/components/Logo.tsx`<br>`public/logo.svg` | `restyle` | Replace generic prototype pin icon with official Dalilak vector brand logo. Keep as home navigation anchor with Arabic alt text. | D6 |
| 3 | **Notification Button** (Bell with red dot) | `src/components/layout/AppNavbar.tsx` | `drop` | Permanently removed from header and codebase. Zero placeholders. | D1 |
| 4 | **Account Profile Button** (User icon) | `src/components/layout/AppNavbar.tsx` | `drop` | Permanently removed from header and codebase. Zero placeholders. | D1 |
| 5 | **Map / List View Switch** (Floating bottom pill) | `src/components/PublicShowcase.tsx` | `replace` | Removed from bottom floating position. Re-engineered as a top-row compact icon-only segmented control. | D2 |
| 6 | **Top-Row Icon Switch** | New component in `src/components/layout/` | `replace` | Compact segmented switch (Map icon & List icon, no text, amber indicator, state-driven logical properties, >=44px hit target). | D2 |
| 7 | **Mini Header Buttons** (`.mini-btn`) | `src/shared/ui/IconButton.tsx` | `restyle` | Standardized 38–44px square icon buttons with rounded corners and border. Max 2 visible on mobile; rest collapse into "More". | D3 |
| 8 | **Collapsed "More" Button** | New drawer/sheet trigger in header | `replace` | `...` button opening accessible menu sheet for secondary links (Pricing, About, For Business, Offline). | D3 |
| 9 | **Search Input & Field** (`.search-field`) | `src/shared/ui/SearchField.tsx`<br>`src/features/search/hooks/useUnifiedSearch.ts` | `restyle` | Style SearchField to prototype specs (48px height, rounded-16px, background `#f1f5f9`, clear button, Arabic normalization). | E4 |
| 10 | **Category Bar** (`.categories`, `.cat`) | `src/components/showcase/CategoryChips.tsx`<br>`src/shared/ui/Chip.tsx` | `restyle` | Horizontal snap-scrolling bar with active dark badge styling and start/end gradient fades. | D5 |
| 11 | **Map Canvas & Leaflet Controls** (`#map`) | `src/components/views/MapView.tsx`<br>`src/components/InteractiveMap.tsx` | `restyle` | Full-bleed interactive Leaflet map with custom +/- zoom controls. | D5 |
| 12 | **Locate Me Action** (`locateMe()`) | `src/features/map/hooks/useMapGeolocation.ts`<br>`src/components/map/MapControlOverlay.tsx` | `reuse` | Reuses existing `useMapGeolocation`. Triggers only on tap; displays friendly toast if permission is denied. | E3 |
| 13 | **Fit All Pins Action** (`fitAll()`) | `src/components/map/cameraController.ts` | `reuse` | Smooth zoom to bounding box of all active filtered business pins. | D5 |
| 14 | **Map Stats Pill** (`.map-stats`) | `src/components/map/MapStatsBadge.tsx` | `restyle` | Pulsing accent dot with live business count (`"N نشاط موثق"`). | D5 |
| 15 | **Map Selected Sheet** (`.map-sheet`) | `src/components/map/MapSelectedBusinessDrawer.tsx` | `restyle` | Positioned at bottom of map canvas (cleared of bottom pill reserved spacing). Shows card summary and arrow link. | D2, D5 |
| 16 | **Teardrop Marker Pins** (`.marker-pin`) | `src/components/map/badgeMarkers.ts` | `restyle` | Restyle markers to gradient teardrop rotated -45 deg with category icon (+45 deg). Active pin turns dark slate. Keep HTML escaping. | D5 |
| 17 | **Business List Page** (`.list-page`) | `src/components/views/SearchView.tsx`<br>`src/components/showcase/BusinessGrid.tsx` | `restyle` | Scrollable card feed with counter header, favorites filter, and sorting cycle. | D4, D5 |
| 18 | **Favorites Filter Chip** (`#favToolBtn`) | `src/hooks/useFavorites.ts`<br>`src/components/views/SearchView.tsx` | `reuse` | Toggles display of saved businesses using canonical `dalelak_user_favorites`. | D5 |
| 19 | **Sort Cycle Button** (`#sortBtn`) | `src/components/views/SearchView.tsx` | `reuse` | Cycles through sorting strategies: Default -> Highest Rated -> Alphabetical / Distance. | D5 |
| 20 | **Business Card Presentation** (`.card`) | `src/features/business-details/components/UnifiedBusinessCard.tsx` | `restyle` | Adopts prototype tile layout: icon squircle, title, verified shield, category line, rating, status badge, offer chip, favorite. | D5 |
| 21 | **Business Card Links (Stretched-Link)** | `UnifiedBusinessCard.tsx` | `reuse` | Primary link on title (`after:inset-0`) with sibling action buttons (`relative z-10`). No nested interactive elements. | P0-d |
| 22 | **Empty State** (`.empty`) | `src/shared/ui/EmptyState.tsx` | `restyle` | Centered illustration, Arabic messaging, and action button to reset filters. | D5 |
| 23 | **Business Detail Sheet/Modal** (`.sheet-modal`) | `src/components/activity/ActivityDetailModal.tsx` | `restyle` | Responsive presentation: Bottom sheet on mobile (<768px), centered modal on tablet (768–1023px), side panel on desktop (>=1024px). | D4, D5 |
| 24 | **Detail Rating Box** (`.rating-box`) | `ActivityDetailModal.tsx` | `restyle` | Large score, visual stars, review count. Displayed only if business has verified rating data (Rule 6). | Rule 6 |
| 25 | **Detail Info Rows** (`.info-list`) | `ActivityDetailModal.tsx` | `restyle` | Squircle icon badges with address, direct telephone, and operating hours. | D5 |
| 26 | **Detail Offer Card** (`.offer-card`) | `ActivityDetailModal.tsx` | `restyle` | Dashed border card with gift/tag icon. Rendered only when active offer exists. | Rule 6 |
| 27 | **Detail Action Buttons Grid** (`.actions-grid`) | `ActivityDetailModal.tsx` | `restyle` | Primary Call button (spans 2 cols), WhatsApp button, Turn-by-Turn Directions button, Share button. | D5 |
| 28 | **Toast Notification Stack** (`.toast`) | `src/shared/ui/Toast.tsx` | `restyle` | Pill toasts with `aria-live="polite"` and auto-dismiss timing. | D5 |
| 29 | **Connection Status Banner** (`.connection-banner`) | `src/hooks/useNetworkStatus.ts`<br>`src/shared/ui/ConnectionBanner.tsx` | `restyle` | Slide-down notification for offline/online state transitions. | D5 |
| 30 | **Dropping `notes` from SELECT** | `src/features/catalog/model/businessMapper.ts`<br>`src/server/directoryData.ts` | **`BLOCKED`** | Preserved per Hard Rule 3 until `public_businesses_view` is deployed in Supabase. | Rule 3 |

---

## 3. Preservation of Features Not Present in the Prototype

The prototype (`prototype.html`) is a visual template and lacks several critical domain features present in the Dalilak production directory. These features must be strictly preserved and integrated into the new shell architecture per Decision D5:

### 3.1 Hadayek Atlas & Proximity Radar
- **Existing Files:**
  - `src/features/atlas/model/proximityRadar.ts`
  - `src/features/atlas/components/ProximityRadarDrawer.tsx`
  - `src/components/views/HomeView.tsx` (Gates modal & Zone quick links)
  - `src/data/hadayekAtlasData.ts`
- **Integration Plan:**
  - Accessed via a standardized mini icon button in the header (Compass / MapPin icon) or via the "More" menu.
  - Opens the `ProximityRadarDrawer` with zone boundary filtering and nearest gate routing.
  - Dynamically imports `hadayekDistrictsGeoData.ts` on demand, preserving first-load performance.

### 3.2 Building & Cadastral Exact Street Search
- **Existing Files:**
  - `src/utils/hadayekBuildingSearch.ts`
  - `src/utils/activitySearchIntent.ts`
  - `src/data/hadayekBuildingsCoords.json` (Lazy loaded)
- **Integration Plan:**
  - Integrated directly into the main `SearchField`.
  - When a user types a building query (e.g., "عمارة 125 هـ" or "بوابة خفرع"), intent parser surfaces cadastral building coordinates alongside business listings.
  - Selecting a building match centers the map on that building centroid with an informative pin.

### 3.3 In-App Navigation Drawer / Mobile Menu
- **Existing Files:**
  - `src/components/layout/NavbarMobileDrawer.tsx`
- **Integration Plan:**
  - Re-architected as the target for the "More" (`...`) mini button.
  - Contains quick links to secondary pages:
    - **باقات النمو والتوثيق** (`/pricing`)
    - **أضف نشاطك مجاناً** (`/for-business`)
    - **عن منصة دليلك** (`/about`)
    - **بوابة حدائق الأهرام** (`/gates`)
    - **تبديل المظهر** (Light / Dark theme toggle)
    - **صفحة العمل دون اتصال** (`/offline.html`)

### 3.4 WhatsApp Business Ordering & Direct Links
- **Existing Files:**
  - `src/shared/lib/whatsapp.ts`
- **Integration Plan:**
  - Mapped into the action button grid inside `UnifiedBusinessCard` and `ActivityDetailModal`.
  - Automatically formats the WhatsApp URL with pre-filled Arabic greeting and business identifier.

### 3.5 Turn-by-Turn Directions (In-App & External Google Maps)
- **Existing Files:**
  - `src/shared/lib/directions.ts`
- **Integration Plan:**
  - Dedicated action button inside card and detail modal.
  - Resolves verified GPS coordinates first; falls back gracefully to address search query.
  - Guards against Null Island `(0, 0)` coordinates.

### 3.6 Deep Linking & Social Share Cards
- **Existing Files:**
  - `src/utils/directoryUrl.ts`
  - `src/app/router/useInitialRouteParams.ts`
  - `api/share.ts` & `api/biz-og.ts`
- **Integration Plan:**
  - Direct URLs (`/biz/:id` and `?biz=:id`) immediately activate detail modal over the corresponding map/list location.
  - Browser back button dismisses modal before navigating away.
  - Share button generates canonical link `https://www.dalilaak.com/biz/:slug`.

### 3.7 Video Player Showcase
- **Existing Files:**
  - `src/components/video/VideoPlayerModal.tsx`
- **Integration Plan:**
  - Plays verified field video reels when present in business metadata.
  - Accessible video modal with focus trap and keyboard dismissal.

### 3.8 Theme Toggle (Light & Dark System)
- **Existing Files:**
  - `src/index.css` (`@custom-variant dark`, CSS variables)
  - `useTheme` hook / `ThemeToggle.tsx`
- **Integration Plan:**
  - Integrated into header mini buttons (or "More" menu on compact screens).
  - Toggles `data-theme="light|dark"` attribute on `<html>` root, persisting preference in localStorage (`dalelak_theme_preference`).

---

## 4. Breakpoint Composition Rules (D4 Summary)

```
                    +-----------------------------+
                    |        Unified App Shell     |
                    +-----------------------------+
                                   |
         +-------------------------+-------------------------+
         |                                                   |
[Breakpoint < 1024px]                               [Breakpoint >= 1024px]
Mobile / Tablet Mode                                Desktop Two-Pane Mode
--------------------                                ---------------------
- Header: Logo, Icon Switch,                        - Header: Logo, Wide Search,
  Max 2 Mini Buttons, More Menu                       Map Actions, Mini Buttons
- Search Row (below top row)                        - Category Bar underneath
- Dynamic View Switching:                           - Split Layout (Permanent):
    Page = Map OR List                                  * Start Pane: 420px List
- Detail View:                                          * End Pane: Full Map
    * Mobile: Bottom Sheet                              * Detail: Docked Modal
    * Tablet: Centered Modal
```

---

## 5. Risk Assessment & Verification Checkpoints

1. **Header Congestion at 360px:** Guarded by rule D3 (max 2 mini buttons) and verified via Playwright responsive test (`scrollWidth === 360px`).
2. **Bundle Size Headroom:** Phase 1 introduces no runtime dependencies; Phase 2–4 code changes must remain within the 128 kB main entry bundle budget.
3. **Map Pin Interaction Sync:** Desktop two-pane mode requires bi-directional sync (selecting card highlights pin, clicking pin scrolls card into view). Tested in Phase 5 E2E.
