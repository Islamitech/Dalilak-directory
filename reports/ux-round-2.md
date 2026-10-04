# UX Architecture & Refactoring Audit Report — Round 2

**Branch**: `refactor/ux-architecture`  
**Date**: October 4, 2026  
**Auditor**: Antigravity Autonomous Engineering Agent  
**Baseline Reference**: `docs/refactor/03-gap-analysis.md`

---

## 1. Executive Summary & Objective

In Round 2 of the UX Architecture Refactoring, the objective was to remediate every deficit documented in `docs/refactor/03-gap-analysis.md` under strict operational guardrails:
- Atomic, sequential execution of Items 1 through 11.
- Strict line budgets: Components $\le 250$ lines, Hooks $\le 120$ lines.
- Enforced modularity: Feature slices with public APIs (`index.ts`) and zero cross-feature deep imports.
- RTL and theming compliance: Elimination of all physical CSS utilities, complete dark theme CSS tokens, and bidirectional isolation (`<bdi dir="auto">`).
- Performance and bundle integrity: Elimination of heavy assets from the initial bundle and tightening bundle budgets to measured $+10\%$ headroom.
- Automated architectural guards enforced during `npm run build`.
- Playwright E2E and responsive verification across 4 viewports (360, 390, 768, 1280) and 5 core screens.
- Zero false compliance claims: `axe-core` accessibility marked **BLOCKED** due to absence from `node_modules`.

---

## 2. Before / After Metrics Comparison

| Metric / Dimension | Baseline (Start of Round 2) | Current State (End of Round 2) | Delta / Improvement |
| :--- | :--- | :--- | :--- |
| **Components $> 250$ lines** | 18 components (up to 358 lines) | **0 components** (all 133 components $\le 250$ lines) | **$-100\%$** (Max: 241 lines) |
| **Hooks $> 120$ lines** | 8 hooks (up to 349 lines) | **0 hooks** (all 23 custom hooks $\le 120$ lines) | **$-100\%$** (Max: 119 lines) |
| **Feature Slices with Public APIs** | Incomplete, scattered across legacy folders | **9 feature slices** (`search`, `map`, `atlas`, `directions`, `favorites`, `share`, `for-business`, `pricing`, `about`) | **$+100\%$** coverage |
| **Cross-Feature Deep Imports** | 17 deep imports bypassing public APIs | **0 deep imports** (enforced by build guard) | **$-100\%$** |
| **Physical CSS Directional Classes** | 74 occurrences (`ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `text-right`, `border-l`, `border-r`) | **0 occurrences** (enforced by build guard) | **$-100\%$** (100% logical utilities) |
| **Main JS Bundle Chunk (`index-*.js`)** | 233.82 kB (52.62 kB gzip) | **119.17 kB** (37.05 kB gzip) | **$-49.0\%$** ($-114.65$ kB) |
| **Atlas Geodata Chunk Isolation** | Bundled in main / vendor | **28.60 kB** (isolated lazy chunk) | Isolated from initial load |
| **Building Coords JSON Isolation** | 937.87 kB (bundled on demand) | **937.87 kB** (isolated lazy chunk, $0$ bytes in entry) | Guaranteed absent from initial load |
| **Unified Business Card Variants** | 2 variants (`grid`, `compact`), map & detail ad-hoc | **5 variants** (`grid`, `compact`, `list`, `map-popup`, `detail`) | 100% unified rendering |
| **Interactive Card Accessibility** | Click only (`role="article"`) | `role="button"`, `tabIndex={0}`, keyboard `Enter` handler | Keyboard interactive |
| **Search Primitive & State** | 3 fragmented search inputs, duplicated debounce | **1 `SearchField` + 1 `useUnifiedSearch`** | Single canonical implementation |
| **Async States (No Blank Screens)** | Ad-hoc spinners, blank on network drop | **`LoadingSkeleton` + `EmptyState` + `ErrorState` + `OfflineState`** | Resilient offline recovery |
| **Automated Architecture Guards** | 3 basic checks in CI | **7 comprehensive guards** wired into `npm run build` | Build fails on any violation |

---

## 3. Honest Status Per Item

| Item | Description | Status | Evidence / Verification Notes |
| :---: | :--- | :---: | :--- |
| **1** | **Honesty Pass** | **DONE** | Complete baseline audit written in `docs/refactor/03-gap-analysis.md` detailing every oversized component, hook, missing feature slice, and legacy re-export with git grep proof. |
| **2** | **Adopt, Then Delete** | **DONE** | All ad-hoc dialogs, drawers, buttons, chips, and skeletons migrated to `src/shared/ui/`. Deleted obsolete `src/components/ui/` re-exports (`Card.tsx`, `Skeleton.tsx`, `Badge.tsx`, `Input.tsx`). Focus trap, focus restore, and Esc dismiss verified. |
| **3** | **Split Oversized Components & Hooks** | **DONE** | Every component $>250$ lines and hook $>120$ lines split into pure logic (`model/`), presentation (`components/`), and state (`hooks/`). 9 feature folders created with `index.ts` public APIs. Zero files exceed limits. |
| **4** | **Card Variants** | **DONE** | `UnifiedBusinessCard` extended to 5 variants (`grid`, `compact`, `list`, `map-popup`, `detail`). Map popups and `ActivityDetailModal` migrated to it. Marker HTML escaping preserved (`escapeHtml`) and verified. |
| **5** | **Unified Search** | **DONE** | Consolidated into `SearchField` primitive and `useUnifiedSearch` hook with debounce (250ms), Arabic-Indic normalization, recent searches persistence in `localStorage`, instant clear, and dynamic count. Adopted across Home, Search, and Map. |
| **6** | **Async States (Loading, Empty, Error, Offline)** | **DONE** | Created `ErrorState.tsx`, `OfflineState.tsx`, `LoadingSkeleton.tsx`, and `useNetworkStatus.ts`. Integrated across Home, Search, Map, Details, and Favorites. Zero blank screens on network failure or offline transitions. |
| **7** | **RTL & Dark Theme Tokens** | **DONE** | Replaced all physical CSS classes (`ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `text-right`, `border-l`, `border-r`) with logical equivalents (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`, `border-s`, `border-e`). Dark theme tokens (`[data-theme="dark"]`, `.dark`) configured in `src/index.css`. Phone numbers and mixed titles protected with `<bdi dir="auto">`. Verified by `src/tests/rtl_theme_tokens.test.ts`. |
| **8** | **Performance & Bundle Budgets** | **DONE** | Isolated `atlas-geodata` (28.60 kB) and `HomeView` (28.08 kB) into dedicated chunks. Confirmed `hadayekBuildingsCoords.json` (937.87 kB) never enters entry chunk. Main chunk decreased from 233.82 kB to 119.17 kB ($-49.0\%$). Budgets tightened to measured size $+10\%$ headroom in `scripts/check-bundle.cjs`. |
| **9** | **Architecture Guards** | **DONE** | Extended `scripts/check-architecture.cjs` to enforce: (1) App.tsx $\le 150$, (2) Component $\le 250$, (3) Hook $\le 120$, (4) Zero cross-feature deep imports, (5) Zero forbidden physical-direction classes, (6) Zero circular imports, (7) shared/lib purity. Wired into `npm run build` and `npm run vercel-build` to fail immediately on violations. |
| **10** | **Tests: Playwright E2E & WCAG** | **PARTIAL** / **BLOCKED** | **E2E Scenarios (DONE)**: Playwright test suite `src/tests/e2e/ux_round2.playwright.cjs` passed 5/5 scenarios: (a) Safe call/WhatsApp/directions links, (b) Deep link `/biz/:id`, (c) Offline fallback & retry, (d) 360px RTL layout, (e) Keyboard modal open/close with focus trap and focus restore.<br>**WCAG Audit (BLOCKED)**: `axe-core` is NOT installed in `node_modules`. Per explicit user instructions, automated WCAG compliance is marked **BLOCKED** and not falsely claimed. |
| **11** | **Responsive Evidence** | **DONE** | Automated responsive evidence captured across 4 viewports (360px, 390px, 768px, 1280px) and 5 screens (`home`, `search`, `map`, `detail`, `saved`). 20/20 combinations verified with $0$ horizontal overflow (`scrollWidth <= clientWidth`). Full screenshots saved to `verification/evidence/responsive/`. |

---

## 4. Test & Verification Table

### 4.1 Automated Architecture & Unit Suites (`npm test`)

| Test Suite | File / Runner | Results | Status |
| :--- | :--- | :---: | :---: |
| **Architecture Guards** | `scripts/check-architecture.cjs` | 7/7 rules passed (133 components, 23 hooks, 254 source files) | **PASS** |
| **Bundle Budgets** | `scripts/check-bundle.cjs` | 10/10 chunks within measured $+10\%$ limits | **PASS** |
| **Map Unit & Repair Tests** | `src/tests/map_fixes.test.ts` | 42/42 tests passed | **PASS** |
| **Safety Net Contracts** | `src/tests/safety_net_batch0.test.ts` | 19/19 tests passed (9/9 regression + 10/10 repaired behaviors) | **PASS** |
| **Map State & Camera Unit** | `src/tests/map_repair_safety.test.ts`, `camera_controller.test.ts`, etc. | 11/11 tests passed | **PASS** |
| **Serverless Security** | `src/tests/serverless_security.test.ts` | 8/8 tests passed | **PASS** |
| **Shared Lib Purity & Helpers** | `src/tests/shared_lib.test.ts` | 13/13 tests passed | **PASS** |
| **SEO & Sitemap Endpoints** | `scripts/test-seo-endpoints.ts` | 2,056 URLs validated | **PASS** |
| **RTL & Dark Theme Tokens** | `src/tests/rtl_theme_tokens.test.ts` | 3/3 tests passed | **PASS** |

### 4.2 Playwright Browser & E2E Suites

| Scenario / Verification | Runner / Script | Measured Result | Status |
| :--- | :--- | :--- | :---: |
| **Search $\to$ Open $\to$ Safe Links** | `src/tests/e2e/ux_round2.playwright.cjs` | Direct call (`tel:01...`), WhatsApp (`wa.me/...`, `rel="noopener noreferrer"`), Directions action safe | **PASS** |
| **Deep Link `/biz/:id`** | `src/tests/e2e/ux_round2.playwright.cjs` | Direct load of `/biz/biz_alpha` opens modal; closes cleanly to base route | **PASS** |
| **Offline Fallback & Recovery** | `src/tests/e2e/ux_round2.playwright.cjs` | Network drop triggers offline/error UI with retry; network restore re-fetches data | **PASS** |
| **360px RTL Layout** | `src/tests/e2e/ux_round2.playwright.cjs` | `dir="rtl"`, `scrollWidth = 360px`, `overflow = false` | **PASS** |
| **Keyboard-Only Modal Navigation** | `src/tests/e2e/ux_round2.playwright.cjs` | Card opened via `Enter`, focus trapped on `Tab` cycling, dismissed via `Escape`, focus restored | **PASS** |
| **History Back/Forward Modal (U3)**| `src/tests/mutation_browser.playwright.cjs` | History back/forward restores modal state | **PASS** |
| **Direct-link Dismiss (U4)** | `src/tests/mutation_browser.playwright.cjs` | Dismissed modal remains closed on retry | **PASS** |
| **Gallery Photo Reset (U7)** | `src/tests/mutation_browser.playwright.cjs` | Photo gallery index resets between businesses | **PASS** |
| **In-Flight REST vs Realtime (B4)** | `src/tests/mutation_browser.playwright.cjs` | Stale REST response does not overwrite live updates | **PASS** |
| **Automated Accessibility (`axe-core`)** | `src/tests/e2e/ux_round2.playwright.cjs` | `axe-core` not installed in dependencies | **BLOCKED** |

---

## 5. Responsive Verification Evidence (Item 11)

All 20 combinations of screens and viewports were tested using Chromium with DOM metrics measurement. Zero horizontal overflow was detected across any screen.

| Screen | Viewport: 360px | Viewport: 390px | Viewport: 768px | Viewport: 1280px | Screenshot Evidence Artifact |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Home (`/`)** | 360px (No overflow) | 390px (No overflow) | 768px (No overflow) | 1280px (No overflow) | `verification/evidence/responsive/home-*.png` |
| **Search (`/search`)** | 360px (No overflow) | 390px (No overflow) | 768px (No overflow) | 1280px (No overflow) | `verification/evidence/responsive/search-*.png` |
| **Map (`/map`)** | 360px (No overflow) | 390px (No overflow) | 768px (No overflow) | 1280px (No overflow) | `verification/evidence/responsive/map-*.png` |
| **Detail Modal (`/biz/:id`)** | 360px (No overflow) | 390px (No overflow) | 768px (No overflow) | 1280px (No overflow) | `verification/evidence/responsive/detail-*.png` |
| **Saved (`/favorites`)** | 360px (No overflow) | 390px (No overflow) | 768px (No overflow) | 1280px (No overflow) | `verification/evidence/responsive/saved-*.png` |

---

## 6. Commit List (Round 2 Atomic Commits)

```
* de42503 chore(ux-guards): enforce component, hook, cross-feature imports, and rtl limits in build
* 5580abd perf(ux-bundle): code-split atlas geodata, lazy-load home view, and tighten bundle budgets to measured +10% headroom
* bf8bd51 refactor(ux-rtl): enforce logical css properties, complete dark theme tokens, and protect text with bdi dir=auto
* 2b21927 feat(ux-states): standardize loading skeleton, empty, error with retry, and offline states across async surfaces
* 9955c15 feat(ux-search): unify SearchField primitive and useUnifiedSearch across all search entry points
* 623289f refactor(ux-17): extend unified business card to grid compact list map-popup and detail variants
* 3fcde02 refactor(ux-16): split oversized components and hooks and establish feature slices
* 199d060 refactor(ux-15): adopt shared ui primitives across modals, drawers, chips, search inputs and delete old re-exports
* 99ecb86 docs(ux-14): record comprehensive refactoring gap analysis and baseline integrity in 03-gap-analysis.md
```

*(Final commit for Items 10 & 11 encompasses the Playwright E2E suite, responsive artifacts, and this report).*

---

## 7. Residual Risks & Technical Debt

1. **Automated Accessibility Testing (`axe-core`)**:
   - `axe-core` is currently absent from `package.json` devDependencies. Keyboard traps, focus restoration, and ARIA modal roles are verified through Playwright DOM assertions, but full WCAG 2.1 AA contrast and screen-reader tree validation requires installing `@axe-core/playwright`.
   - **Mitigation**: Add `@axe-core/playwright` in a follow-up devDependencies update to unblock automated CI accessibility scans.
2. **Offline Mode Service Worker**:
   - The application now features comprehensive client-side `OfflineState` and network reconnection listeners, but does not yet register a dedicated Workbox Service Worker to cache static assets and JSON catalogs offline.
   - **Mitigation**: Implement a service worker caching strategy (`CacheFirst` for tiles/fonts, `StaleWhileRevalidate` for business directory queries).
3. **Large Cadastral GeoJSON File**:
   - While `hadayekBuildingsCoords.json` (937.87 kB) has been safely isolated into an on-demand dynamic chunk and does not inflate initial page load, downloading it over slow 3G cellular connections on the map screen still incurs latency.
   - **Mitigation**: Compress the cadastral building coordinates into FlatGeobuf or protocol buffers (Protobuf) to reduce file transfer size by $\sim 70\%$.

---

READY FOR REVIEW
