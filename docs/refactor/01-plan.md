# Refactoring Execution Plan — Dalilak Directory Architecture & UX

**Date**: October 4, 2026  
**Branch**: `refactor/ux-architecture`  
**Reference Document**: [`docs/refactor/00-baseline.md`](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/docs/refactor/00-baseline.md)  

---

## 1. Target Architecture & Directory Layout

The application will be organized into a high-cohesion, feature-sliced architecture following clean single-responsibility boundaries:

```
src/
├── app/
│   ├── App.tsx                     # Thin composition root (<150 lines)
│   ├── providers/                  # ThemeProvider, DirectoryLoadProvider, ToastProvider
│   ├── router/                     # URL synchronization, deep link parser, view dispatcher
│   └── hooks/useCatalogLifecycle.ts# Supabase fetch, pagination, cache, realtime sync
├── features/
│   ├── search/                     # Catalog search, filter drawer, category hierarchy, chips
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── model/
│   │   └── index.ts
│   ├── map/                        # Interactive Leaflet map, pins, clustering, camera controllers
│   │   ├── components/
│   │   ├── controllers/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── index.ts
│   ├── business-details/           # Activity detail modal, gallery lightbox, video player
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   ├── favorites/                  # Saved businesses view, local storage sync
│   ├── pricing/                    # Growth packages hub, tier comparison
│   ├── for-business/               # Merchant onboarding & WhatsApp lead generator
│   ├── about/                      # About & mission views
│   └── atlas/                      # Hadayek gates, radar drawer, lifeline bar
├── shared/
│   ├── ui/                         # Reusable Design System primitives (WCAG 2.2 AA)
│   │   ├── Button/
│   │   ├── IconButton/
│   │   ├── Card/
│   │   ├── Modal/
│   │   ├── Drawer/
│   │   ├── Skeleton/
│   │   ├── EmptyState/
│   │   ├── SearchField/
│   │   └── Toast/
│   ├── lib/                        # Pure, side-effect-free helpers
│   │   ├── phone.ts                # Egyptian phone normalization & validation
│   │   ├── whatsapp.ts             # Safe wa.me intent URL generation
│   │   ├── directions.ts           # Safe Google Maps directions & coords
│   │   ├── arabic.ts               # Arabic diacritic & alef/hamza normalization
│   │   └── format.ts               # Date, currency, rating, distance formatting
│   └── data/                       # Static read-only datasets
│       ├── geography.ts            # Egyptian governorates & cities
│       ├── zones.ts                # Hadayek Al-Ahram zones
│       └── taxonomy.ts             # Category groupings & taxonomy hierarchy
```

---

## 2. Ordered Execution Steps & Risk Management

| Step | Action & Scope | Primary Deliverable | Risk Assessment | Mitigation Strategy |
| :---: | :--- | :--- | :---: | :--- |
| **Step 1** | **Design System Tokens & RTL Foundations** | Centralized CSS variables in `src/index.css`, Tailwind 4 theme tokens, Arabic font stack, logical properties (`ms-`, `me-`, `ps-`, `pe-`). | **Low**: Visual regression on spacing. | Use existing snapshot tests and ensure backward-compatible utility classes. |
| **Step 2** | **Shared Pure Libraries (`src/shared/lib/`)** | Extract and unify: `phone.ts`, `whatsapp.ts`, `directions.ts`, `arabic.ts`. Re-export at old locations. | **Low**: Broken imports in callers. | Keep legacy files as re-exports until callers are migrated. |
| **Step 3** | **Data Separation (`src/shared/data/`)** | Separate static constants (`geography.ts`, `zones.ts`) from mock fixtures (`mockData.ts`). | **Low**: Bundle size reduction. | Verify zero runtime breakage in `MapSandboxView` or `FilterDrawer`. |
| **Step 4** | **Design System UI Primitives (`src/shared/ui/`)** | Implement accessible primitives (`Button`, `IconButton`, `Card`, `Modal`, `Drawer`, `Skeleton`, `EmptyState`, `SearchField`). | **Low-Medium**: CSS specificity clashes. | Implement with Tailwind 4 classes and standard ARIA attributes (`role`, `aria-label`). |
| **Step 5** | **Feature Unification — Business Card & Actions** | Create `UnifiedBusinessCard` with variants (`grid`, `compact`, `map-drawer`). Standardize action order: Call -> WhatsApp -> Directions -> Share -> Favorite. | **Medium**: UI discrepancy between screens. | Verify with test suite and visual layout check. |
| **Step 6** | **App Shell & Composition Root (`src/app/`)** | Slim `src/App.tsx` from 382 to <150 lines. Extract data lifecycle into `useCatalogLifecycle.ts`. | **Medium**: Timing of catalog load & hydration. | Preserve exact state machine, cache fallback, and retry listeners. |
| **Step 7** | **Feature Modularization (`src/features/`)** | Reorganize `search`, `business-details`, `favorites`, `pricing`, `for-business`, `about`, `atlas` into single-responsibility feature directories. | **Low-Medium**: Import path updates. | Perform atomic commits per feature using `git mv` where appropriate. |
| **Step 8** | **Guards, Linting & Bundle Check Scripts** | Implement `scripts/check-architecture.cjs` and `scripts/check-bundle.cjs`. Wire to `npm run check:architecture` and `npm run check:bundle`. | **Low**: Script syntax errors. | Validate locally with Node 24. |
| **Step 9** | **Verification, Tests & Documentation** | Run full test suite (`npm test`, `npm run test:security`, `npm run test:repair`, etc.), generate before/after metrics, and write `reports/ux-architecture.md`. | **Zero**: Read-only verification. | Confirm 100% green tests. |

---

## 3. Strict Safety Invariants

During all refactoring stages:
1. **Zero Database or API Changes**: `api/*.ts` and `supabase/` remain untouched.
2. **SEO & URLs Preserved**: All paths (`/`, `/search`, `/map`, `/saved`, `/pricing`, `/about`, `/for-business`, `/biz/:id`) and OpenGraph/Sitemap metadata remain 100% identical.
3. **Map Verification Preserved**: Map behaviors verified in `src/tests/map_fixes.test.ts` and `src/tests/safety_net_batch0.test.ts` must pass without modifications to test logic.
4. **Local Commits Only**: Each step is committed atomically following `refactor(ux-xx)` / `feat(ux-xx)` format.
