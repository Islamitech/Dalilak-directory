# Dalilak Directory Experience — Prototype Port Plan & Coverage Matrix

**Document Version:** 1.0.0  
**Status:** APPROVED & ACTIVE  
**Authorization Quote:**
> "GO PHASE 2 THROUGH FINAL. I (the owner) authorize in writing: Phase 2 commits 02ad4f6, da4e30d, 0e0f59e, fc7a9f8, 8158107 and p1 commit 967cec4 are ACCEPTED into this branch, and you may now implement ALL remaining phases of the prototype port in order, until the full prototype (docs/design/prototype.html) is ported into the app."

---

## 1. Scope and Implementation Principles

### 1.1 In Scope
- Porting all visual presentation, layouts, component styles, and interaction states defined in `docs/design/prototype.html` and `docs/design/00-prototype-spec.md`.
- Strict enforcement of Decisions D1–D6 and Requirements E1–E6.
- Preserving all production features: Hadayek Atlas, cadastral building/street search, WhatsApp links, turn-by-turn directions, offline IndexedDB resilience, theme toggle, and deep linking.
- RTL-native logical CSS properties only (no `ml-`, `mr-`, `left-`, `right-`, `text-left`, `text-right`).
- 44px minimum touch targets on all interactive controls.
- Component length <= 250 lines, hook length <= 120 lines, App.tsx <= 150 lines.
- Complete Playwright test verification across Chromium, Firefox, and WebKit on 5 responsive viewports (360px, 390px, 768px, 1024px, 1280px).
- Axe accessibility compliance: 0 critical or serious violations.
- Performance budget compliance: first-load JS must not exceed baseline (592.66 kB raw / 169.42 kB gzip) by >5%.

### 1.2 Explicitly Out of Scope
- Modifying `api/`, `supabase/`, `vercel.json`, auth, or data-fetching logic.
- Dropping `notes` from SELECT queries (held as BLOCKED until public view is deployed per Hard Rule 3).
- Modifying map core algorithms (spiderfy physics, camera trajectory math, cadastral containment polygons).
- Inventing synthetic data (ratings, review counts, open/closed badges, and offer chips appear **only** when present in real business records).
- Weakening or altering architecture guards or bundle budgets to pass gates.

---

## 2. Phase-by-Phase Execution Plan

### Phase 2: Design Tokens & Shell Layout (COMPLETED)
- **Status:** ACCEPTED (Commits: `02ad4f6`, `da4e30d`, `0e0f59e`, `fc7a9f8`, `8158107`, `4e3a4e1`, `603fea0`).
- **Covers:** Design tokens in CSS variables & Tailwind 4 theme, top-row icon segmented switch (`ViewSegmentedSwitch`), 360px-fit header with mini buttons and "More" trigger (`AppNavbar`), snap-scrolling CategoryBar with RTL edge fades and taxonomy synchronization, desktop two-pane layout container (`DesktopTwoPaneView`).

---

### Phase 3: Component Restyling & Prototype UI Elements

#### Task 3-1: UnifiedBusinessCard Prototype Restyling (`feat(p3-01)`)
- **Prototype Elements Covered:** `.card`, `.card-icon`, `.card-name`, `.badge.verified`, `.card-cat`, `.card-meta`, `.rating`, `.status.open`, `.status.closed`, `.card-offer`, `.fav-btn`.
- **Target Files:**
  - `src/features/business-details/components/UnifiedBusinessCard.tsx`
  - `src/features/business-details/components/BusinessCardContent.tsx`
  - `src/features/business-details/components/BusinessCardActions.tsx`
- **Acceptance Criteria:**
  1. 60x60px squircle container with category icon or photo thumbnail.
  2. Verified badge rendered as blue/amber checkmark adjacent to name.
  3. Category line and zone area rendered in muted typography (`--color-text-muted`, >= 4.5:1 contrast).
  4. Meta row (rating pill, review count, open/closed status badge) renders **only** when real data exists.
  5. Offer pill renders **only** when active offer text exists.
  6. Stretched link pattern (`after:absolute after:inset-0`) on business title anchor; favorite toggle and quick actions sit at `relative z-10`. Zero nested `<button>` inside `<button>` or `<a>` inside `<a>`.
  7. Touch targets on action buttons >= 44x44px.
  8. Passes all unit and architecture tests.

#### Task 3-2: Map Selected Business Drawer (`feat(p3-02)`)
- **Prototype Elements Covered:** `.map-sheet`, `#sheetIcon`, `#sheetName`, `#sheetCat`, `#sheetRating`, `#sheetStatus`, `#sheetArrow`.
- **Target Files:**
  - `src/components/map/MapSelectedBusinessDrawer.tsx`
  - `src/components/views/MapView.tsx`
- **Acceptance Criteria:**
  1. Bottom-anchored card preview when a pin is selected on the map.
  2. Bottom padding reserved for the old floating switch completely removed (no 100px gap).
  3. Displays squircle avatar/icon, business name, category/zone, rating (if verified), and open/closed badge.
  4. Arrow action button opens full `ActivityDetailModal`.
  5. Close button and backdrop dismiss card cleanly.
  6. Smooth spring transition on open/close; disables under `prefers-reduced-motion`.

#### Task 3-3: Business Detail Modal & Bottom Sheet (`feat(p3-03)`)
- **Prototype Elements Covered:** `.sheet-modal`, `.sheet-header`, `.sheet-hero`, `.rating-box`, `.info-list`, `.info-row`, `.offer-card`, `.actions-grid`, `.btn-primary.btn-call`, `.btn-whatsapp`, `.btn-dir`, `.btn-share`.
- **Target Files:**
  - `src/components/activity/ActivityDetailModal.tsx`
  - `src/components/activity/DetailHeroSection.tsx`
  - `src/components/activity/DetailInfoRows.tsx`
  - `src/components/activity/DetailActionsGrid.tsx`
- **Acceptance Criteria:**
  1. Responsive transformation: Sliding bottom sheet on mobile (<768px, max-height 92vh, 24px top radius), centered dialog modal on tablet/desktop (>=768px, max-width 480px).
  2. Hero section: warm subtle gradient, 72x72px squircle avatar, verified badge, 44px close button, 44px favorite button.
  3. Big rating box: 4.8 visual score, stars, review count (shown only when verified data exists).
  4. Structured info rows: squircle icons for Address, Telephone, Hours/Status.
  5. Offer card: dashed border, amber background, tag icon (shown only if offer exists).
  6. Action grid: primary Call CTA (spans 2 columns), WhatsApp, Turn-by-Turn Directions, Share link.
  7. Accessibility: Accessible dialog hook (`useAccessibleDialog`), focus trap, Esc key dismiss, body scroll lock without layout jump, focus restoration to trigger element upon dismissal.

#### Task 3-4: Teardrop Marker Pins & Floating Map Controls (`feat(p3-04)`)
- **Prototype Elements Covered:** `.marker-pin`, `.map-controls`, `.map-btn`, `.map-stats`.
- **Target Files:**
  - `src/components/map/badgeMarkers.ts`
  - `src/components/map/MapControlOverlay.tsx`
  - `src/components/map/MapStatsBadge.tsx`
- **Acceptance Criteria:**
  1. Teardrop pin geometry: rotated -45 deg (`border-radius: 50% 50% 50% 0`) with inner icon rotated +45 deg.
  2. Inactive pins: amber gradient (`#f59e0b` to `#d97706`).
  3. Active pin: dark slate gradient (`#0f172a` to `#334155`), scaled 1.15x with glowing ring.
  4. HTML escaping strictly preserved on all Leaflet marker popups.
  5. Map floating controls: Locate Me and Fit All positioned at top-start on mobile (<1024px); docked in top header at >=1024px (Requirement E1).
  6. Map stats badge: pulsing live dot with real business count (`"N نشاط موثق"`).

#### Task 3-5: List Page Controls & Feed States (`feat(p3-05)`)
- **Prototype Elements Covered:** `.list-header`, `#favToolBtn`, `#sortBtn`, `.empty`, `.empty-icon`.
- **Target Files:**
  - `src/components/views/SearchView.tsx`
  - `src/shared/ui/EmptyState.tsx`
  - `src/components/showcase/BusinessGrid.tsx`
- **Acceptance Criteria:**
  1. Feed header shows active count and location/category summary.
  2. Favorites filter chip (`#favToolBtn`) toggles saved items with badge count.
  3. Sort cycle button (`#sortBtn`) cycles through sorting options with active state indicator.
  4. Empty search state: Arabic empty illustration, contextual suggestion tags, clear filters button.
  5. Connection retry state with "إعادة المحاولة" button.
  6. Loading skeletons match card layout dimensions without layout shift.

---

### Phase 4: Domain Integration & Advanced Behaviors

#### Task 4-1: Unified Search & Cadastral Building Search Integration (`feat(p4-01)`)
- **Prototype Elements Covered:** `.search-field`, `#searchInput`, `#searchClear`, search intent parsing.
- **Target Files:**
  - `src/shared/ui/SearchField.tsx`
  - `src/features/search/hooks/useUnifiedSearch.ts`
  - `src/utils/activitySearchIntent.ts`
  - `src/utils/hadayekBuildingSearch.ts`
- **Acceptance Criteria:**
  1. Dedicated SearchField with 48px height, rounded corners, clear button, and Arabic normalization.
  2. Intent parser surfaces cadastral building and street matches alongside business listings.
  3. Selecting a cadastral result centers the map on that building centroid with an informative pin.

#### Task 4-2: Navigation Drawer / "More" Menu (`feat(p4-02)`)
- **Prototype Elements Covered:** Header collapsed actions sheet, navigation drawer.
- **Target Files:**
  - `src/components/layout/NavbarMobileDrawer.tsx`
  - `src/components/layout/AppNavbar.tsx`
- **Acceptance Criteria:**
  1. Triggered by "..." mini button in header.
  2. Provides clean access to Pricing, For Business, About, Hadayek Gates, Offline page, and Theme toggle.
  3. Full accessibility: focus trap, Esc key dismiss, backdrop click, focus restore.

#### Task 4-3: Deep Linking, Modal Dismissal & Browser History (`feat(p4-03)`)
- **Prototype Elements Covered:** Deep linking (`/biz/:id`, `?biz=:id`), URL state synchronization.
- **Target Files:**
  - `src/components/showcase/hooks/useShowcaseBusinessSelection.ts`
  - `src/components/PublicShowcase.tsx`
- **Acceptance Criteria:**
  1. Navigating to `/biz/:id` or `?biz=:id` immediately opens detail modal over map/list.
  2. Browser Back button dismisses the modal without leaving the view.
  3. Share action copies canonical URL `https://www.dalilaak.com/biz/:slug`.

#### Task 4-4: Desktop Two-Pane Interactivity Sync (`feat(p4-04)`)
- **Prototype Elements Covered:** Desktop two-pane synchronization (D4).
- **Target Files:**
  - `src/components/layout/DesktopTwoPaneView.tsx`
  - `src/components/showcase/PublicShowcaseViews.tsx`
- **Acceptance Criteria:**
  1. At >= 1024px: clicking a card in the list flies map camera to pin and highlights it.
  2. Clicking a pin on the map scrolls the list to the corresponding card and highlights it.
  3. Detail view opens alongside the list without occluding the interactive map.

---

### Phase 5: Test Automation, Multi-Browser Matrix & Evidence

#### Task 5-1: Playwright E2E Test Suite & Multi-Browser Verification (`test(p5-01)`)
- **Target Files:**
  - `src/tests/e2e/prototype_experience.spec.ts`
  - `scripts/verify-prototype-matrix.cjs`
- **Acceptance Criteria:**
  1. Multi-browser execution across Chromium, Firefox, WebKit on 5 viewports: 360, 390, 768, 1024, 1280px.
  2. Zero horizontal scroll overflow (`scrollWidth === clientWidth`) across all screens.
  3. Screenshots saved and committed to `reports/evidence/p5/`.
  4. Axe accessibility audit passes with 0 serious/critical violations.
  5. First-load JS bundle within 5% of Step-0 baseline.

---

## 3. Prototype Master Coverage Matrix

| # | Prototype Element / Feature | App Target Component / File | Status | Notes / Decision |
|---|---|---|:---:|---|
| 1 | App Shell Container (`.app-shell`) | `src/components/layout/DesktopTwoPaneView.tsx`, `PublicShowcase.tsx` | **done** | Responsive shell, no phone frame (D4) |
| 2 | Brand Logo & Wordmark (`.brand`) | `src/components/Logo.tsx`, `AppNavbar.tsx` | **done** | Dalilak vector brand asset (D6) |
| 3 | Notification Bell Button | — | **dropped** | Removed permanently per Owner Directive D1 |
| 4 | Account Profile Button | — | **dropped** | Removed permanently per Owner Directive D1 |
| 5 | Floating Bottom View Switch | — | **dropped** | Replaced by top-row icon switch per D2 |
| 6 | Top-Row Icon-Only Segmented Switch | `src/components/layout/ViewSegmentedSwitch.tsx` | **done** | Map/List icon switch, no text, amber indicator (D2) |
| 7 | Mini Header Buttons (`.mini-btn`) | `src/shared/ui/IconButton.tsx`, `AppNavbar.tsx` | **done** | 38–44px square mini buttons (D3) |
| 8 | Header "More" Button (`...`) | `src/components/layout/NavbarMobileDrawer.tsx` | **done** | Accessible slide-over sheet for secondary actions (D3) |
| 9 | Category Bar (`.categories`, `.cat`) | `src/components/layout/CategoryBar.tsx` | **done** | Snap scroll, edge fades, taxonomy synchronized (D5) |
| 10 | Unified Business Card Presentation | `src/features/business-details/components/UnifiedBusinessCard.tsx` | **done** | Phase 3 Task 3-1 |
| 11 | Card Stretched-Link Pattern | `UnifiedBusinessCard.tsx` | **done** | Phase 3 Task 3-1 (Zero nested interactive elements) |
| 12 | Map Selected Bottom Sheet (`.map-sheet`) | `src/components/map/MapSelectedBusinessDrawer.tsx` | **done** | Phase 3 Task 3-2 |
| 13 | Business Detail Modal / Bottom Sheet | `src/components/activity/ActivityDetailModal.tsx` | **done** | Phase 3 Task 3-3 |
| 14 | Detail Rating Box (`.rating-box`) | `ActivityDetailModal.tsx` | **done** | Phase 3 Task 3-3 (Real verified data only) |
| 15 | Detail Info Rows (`.info-list`) | `ActivityDetailModal.tsx` | **done** | Phase 3 Task 3-3 |
| 16 | Detail Offer Card (`.offer-card`) | `ActivityDetailModal.tsx` | **done** | Phase 3 Task 3-3 (Shown only if offer exists) |
| 17 | Detail Action Grid (Call, WhatsApp, Dir, Share) | `ActivityDetailModal.tsx` | **done** | Phase 3 Task 3-3 |
| 18 | Teardrop Marker Pins (`.marker-pin`) | `src/components/map/badgeMarkers.ts` | **done** | Phase 3 Task 3-4 |
| 19 | Map Floating Controls (<1024px) | `src/components/map/MapControlOverlay.tsx` | **done** | Phase 3 Task 3-4 |
| 20 | Map Docked Controls (>=1024px) | `src/components/layout/AppNavbar.tsx` | **done** | Requirement E1 |
| 21 | Map Stats Badge (`.map-stats`) | `src/components/map/MapStatsBadge.tsx` | **done** | Phase 3 Task 3-4 |
| 22 | Business List Header & Counter | `src/components/views/SearchView.tsx` | **done** | Phase 3 Task 3-5 |
| 23 | Favorites Filter Chip (`#favToolBtn`) | `src/components/views/SearchView.tsx` | **done** | Phase 3 Task 3-5 |
| 24 | Sort Cycle Button (`#sortBtn`) | `src/components/views/SearchView.tsx` | **done** | Phase 3 Task 3-5 |
| 25 | Empty Search State (`.empty`) | `src/shared/ui/EmptyState.tsx` | **done** | Phase 3 Task 3-5 |
| 26 | Search Input Field (`.search-field`) | `src/shared/ui/SearchField.tsx` | **done** | Phase 4 Task 4-1 |
| 27 | Cadastral Building & Street Search | `src/utils/hadayekBuildingSearch.ts` | **done** | Phase 4 Task 4-1 (Preserved production feature) |
| 28 | Hadayek Atlas & Proximity Radar | `src/features/atlas/` | **done** | Preserved production feature (D5) |
| 29 | Deep Linking & History Handling | `src/hooks/useDirectoryNavigation.ts` | **done** | Phase 4 Task 4-3 |
| 30 | Desktop Two-Pane Interactivity Sync | `DesktopTwoPaneView.tsx`, `PublicShowcaseViews.tsx` | **done** | Phase 4 Task 4-4 |
| 31 | Toast Notification Stack (`.toast`) | `src/shared/ui/Toast.tsx` | **done** | Accessible toast notices with aria-live |
| 32 | Connection Status Banner | `src/shared/ui/ConnectionBanner.tsx` | **done** | Offline / online detection |
| 33 | Theme Toggle (Light / Dark) | `src/contexts/ThemeContext.tsx`, `AppNavbar.tsx` | **done** | Preserved production feature |
| 34 | Dropping `notes` from SELECT | `src/features/catalog/model/businessMapper.ts` | **dropped (BLOCKED)** | Blocked until DB view deployed per Rule 3 |
