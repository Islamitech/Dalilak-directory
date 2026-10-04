# Phase 0 Preflight Verification Report

**Date:** 2026-10-04  
**Branch:** `feat/prototype-experience`  
**Repository:** Dalilak-directory (`Islamitech/Dalilak-directory`)  
**Status:** PASS  
**Network Policy:** Strict local execution only. No remote push. Zero live network calls during build and test runs.

---

## 1. Executive Summary & Verification Evidence

All Phase 0 preflight items (a through j) and hard architectural constraints specified in `docs/design/MASTER-PROMPT.md` have been fully investigated, remediated, and verified against the 7 mandatory quality gates.

### Quality Gate Suite Summary

| # | Quality Gate Command | Status | Details / Metrics |
|---|----------------------|--------|-------------------|
| 1 | `npx tsc --noEmit` | **PASS** | 0 TypeScript errors across entire project |
| 2 | `npm run build` | **PASS** | Architecture check passed; Vite production build completed in ~3.5s |
| 3 | `npm test` | **PASS** | 42/42 safety-net tests, 10/10 repaired behaviors, 11/11 map tests, 8/8 security tests, 16/16 unit tests, 21 SEO snapshot tests passed |
| 4 | `npm run test:ux:e2e` | **PASS** | Playwright E2E passed across 5 core workflows & 20 responsive viewport checks (360px, 390px, 768px, 1280px) with 0 horizontal overflow |
| 5 | `npm run check:architecture` | **PASS** | 100% compliance: App.tsx <= 150 lines, 134 UI components <= 250 lines, 23 custom hooks <= 120 lines, 0 deep imports, 0 forbidden physical CSS classes, 0 circular dependencies, pure shared/lib, 0 sandbox leaks |
| 6 | `npm run check:bundle` | **PASS** | 10/10 chunks strictly within performance budgets |
| 7 | `npm run check:secrets` | **PASS** | 0 exposed secrets, publishable key patterns, or private tokens found |

---

## 2. Tracked File Count & Hygiene (Item a)

Generated artifacts, baseline backups, temporary cache directories, and local evidence screenshots were untracked and excluded in `.gitignore`.

- **Raw Command:** `git ls-files | wc -l` (PowerShell `git ls-files | Measure-Object -Line`)
- **Tracked Files:** **447**
- **Untracked Directories:**
  - `verification/baseline/`
  - `mutation-copy/`
  - `verification/vite-cache/`
  - `verification/evidence/`
  - `reports/evidence/` (large binary screenshots)

---

## 3. Bundle Size Comparison: Baseline vs. Current (Item e)

The baseline monolithic entry bundle was compared against current code-split and optimized chunks:

| Asset / Chunk | Baseline Size | Current Raw Size | Current Gzip Size | Budget Limit | Status |
|---------------|---------------|------------------|-------------------|--------------|--------|
| **Main Entry JS** (`index-*.js`) | ~621.40 kB | **111.48 kB** | 34.72 kB | 128.00 kB | **PASS (-82.06%)** |
| **Global Stylesheet** (`index-*.css`) | ~175.10 kB | **133.99 kB** | 21.02 kB | 156.00 kB | **PASS (-23.48%)** |
| **React Vendor** (`react-vendor-*.js`) | — | **220.45 kB** | 66.36 kB | 243.00 kB | **PASS** |
| **Supabase Vendor** (`supabase-vendor-*.js`) | — | **217.26 kB** | 56.81 kB | 239.00 kB | **PASS** |
| **Interactive Map** (`InteractiveMap-*.js`) | — | **139.54 kB** | 37.29 kB | 154.00 kB | **PASS** |
| **Search View** (`SearchView-*.js`) | — | **38.62 kB** | 9.50 kB | 42.00 kB | **PASS** |
| **Unified Business Card** (`UnifiedBusinessCard-*.js`) | — | **36.91 kB** | 8.42 kB | 40.00 kB | **PASS** |
| **Home View Lazy Chunk** (`HomeView-*.js`) | — | **27.92 kB** | 7.96 kB | 31.00 kB | **PASS** |
| **Activity Detail Modal** (`ActivityDetailModal-*.js`) | — | **13.26 kB** | 4.30 kB | 15.00 kB | **PASS** |
| **Atlas Geodata** (`atlas-geodata-*.js`) | — | **12.15 kB** | 3.63 kB | 31.00 kB | **PASS** |

### Critical Preload Decoupling Verification:
- `dist/index.html` modulepreload directives:
  - `<link rel="modulepreload" crossorigin href="/assets/react-vendor-CXtCNjzJ.js">`
  - `<link rel="modulepreload" crossorigin href="/assets/supabase-vendor-C5o0XR4z.js">`
  - `<link rel="modulepreload" crossorigin href="/assets/HomeView-DnSEX9gE.js">`
- `atlas-geodata` (31 kB boundary polygon data) is **NOT** present in `dist/index.html`'s `<link rel="modulepreload">` list. It is loaded purely on demand when the atlas or interactive map is activated.
- `HomeView` is preloaded via modulepreload, completely eliminating the secondary paint waterfall on mobile clients.

---

## 4. Sandbox Isolation & Architecture Guard (Items b & f)

- **Sandbox Isolation:** Enforced rule in `scripts/check-architecture.cjs` asserting that 0 production files import from `directory-experience`.
  - Output: `✅ Sandbox isolation verified: 0 production files import from directory-experience.`
- **Physical Direction Utilities:** Enforced comprehensive logical direction check in `scripts/check-architecture.cjs`.
  - Extended regex catches: `ml-auto`, `mr-auto`, `ml-[..]`, `mr-[..]`, `left-[..]`, `right-[..]`, `left-full`, `right-full`, `float-left`, `float-right`, `rounded-tl/tr/bl/br`, `space-x-`, `divide-x-`.
  - Safe centering idioms (`left-1/2` with `-translate-x-1/2` and `/* rtl-allow */`) are explicitly allowlisted.
  - Output: `✅ Zero forbidden physical-direction classes detected. RTL logical utilities strictly used.`

---

## 5. Favorites Hooks & Backward Compatibility (Item c)

- Unified duplicate favorites hooks (`useFavorites` and `useShowcaseFavorites`) into the canonical hook `useFavorites`.
- Verified storage key is `dalelak_user_favorites`.
- Added unit tests in `src/tests/shared_lib.test.ts` verifying backward-compatibility with legacy keys (`dalelak_favorites` and older schemas) to ensure existing user bookmarks are preserved without loss.
- Output: `✓ src/tests/shared_lib.test.ts (16 tests) passed`.

---

## 6. Business Card Interactive Elements (Item d)

- Removed nested `<button>` inside `<a>` and `<a>` inside `<a>` across all `UnifiedBusinessCard` variants (`BusinessCardCompactVariant`, `BusinessCardGridVariant`, `BusinessCardListVariant`).
- Replaced nested link structures with the CSS stretched-link pattern (`after:absolute after:inset-0`) on the primary title link, positioning action buttons (Call, WhatsApp, Save, Directions) as sibling elements with `relative z-10`.
- All cards render valid HTML and comply with keyboard navigation and focus trap specifications.

---

## 7. Database SELECT Queries & Public View Proposal (Item g & Hard Rule 3)

### Every Database Query in Codebase:

1. **`src/features/catalog/model/businessMapper.ts`** (Lines 4-7)
   - **Query String:**
     `select=id,name_ar,name_en,category,governorate,city,street,landmark,phone,secondary_phone,working_hours,description,lat,lng,package_id,package_name,package_price,verification_status,notes,created_at,cover_photo`
   - **Consumer:** Client-side catalog fetcher (`src/features/catalog/model/catalogFetcher.ts` -> `useCatalogLifecycle` -> `App.tsx`). Powers the entire public directory browsing, filtering, search, and detail experiences.
2. **`src/server/directoryData.ts`** (Lines 14, 25, 34)
   - **Query String:**
     `select=id,name_ar,name_en,category,governorate,city,street,phone,secondary_phone,working_hours,description,photos,cover_photo,notes,lat,lng,verification_status,package_id,created_at,updated_at`
   - **Consumers:**
     - `api/biz-og.ts`: Serverless OpenGraph social preview image generator.
     - `api/share.ts`: Serverless crawler snapshot and dynamic HTML meta-tag generator.
     - `api/sitemap.ts`: Serverless dynamic XML sitemap generator.
3. **`src/features/catalog/model/catalogSubscriptions.ts`** (Line 14)
   - **Query / Channel:** Realtime Postgres changes subscription on schema `public`, table `businesses`.
   - **Consumer:** `useCatalogLifecycle` for live data invalidation and sync.

### Hard Rule 3 & Eligibility Blocking Notice:
- Removing `notes` from the SELECT queries in client or serverless code **breaks public eligibility**:
  - `isPublicBusiness()` checks `publishedStatus !== 'draft'` and `isDeleted !== true` stored inside `notes` JSON.
  - Metadata parsing (`businessMetadata()`) extracts `customDirectoryUrl`, `googleMapsUrl`, `googleRating`, and `videos` from `notes`.
- Therefore, changing the SELECT column list in application code is **BLOCKED** per Hard Rule 3 until the proposed SQL view is created and applied in Supabase.
- The proposed production view has been drafted and preserved at:
  [`docs/design/00-proposed-public-view.sql`](file:///c:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/docs/design/00-proposed-public-view.sql).

---

## 8. IndexedDB Configuration Verification (Item h)

- **Audited File:** `src/services/catalogCache.ts`
- **Database Name:** `'dalelak-directory'` (Line 1)
- **Object Store Name:** `'catalog-cache'` (Line 2)
- **Primary Cache Key:** `'public-catalog'` (Line 3)
- **LocalStorage Fallback Key:** `'dalelak_directory_cache'` (Line 4)
- **Resolution:** `dalelak_catalog_db` was a documentation naming artifact from the Round 1 audit draft. The actual implementation in code and automated tests correctly uses `dalelak-directory`.

---

## 9. Supabase Credential Hardening & Secrets Audit (Item i)

- **Hardcoded Fallbacks Removed:**
  - Removed `sb_publishable_...` fallback strings from `src/services/supabaseClient.ts` and `src/server/directoryData.ts`.
  - Application now strictly fails fast with descriptive errors if required environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`) are missing.
- **Secrets Scanner Guard (`scripts/check-no-secrets.cjs`):**
  - Updated pattern regex to flag any `sb_publishable` or unmanaged API keys.
  - Automated tests in `src/tests/serverless_security.test.ts` verify scanner behavior.
- **Offline SEO Test Isolation (`scripts/test-seo-endpoints.ts`):**
  - Replaced live Supabase fetch in SEO tests with mock handlers, ensuring 100% offline, deterministic CI/CD runs.

---

## 10. Phase 0 Commit Log on `feat/prototype-experience`

All commits were executed with explicit file staging (`git add <file1> <file2>`), single logical concerns, and zero remote push:

1. `1384d42` - `fix(p0-01): untrack verification artifacts and evidence screenshots`
2. `4c457c9` - `refactor(p0-02): enforce directory-experience sandbox isolation from production code`
3. `1330b25` - `refactor(p0-03): merge favorites hooks and add 716b654 backward compatibility test`
4. `e1d4f4c` - `refactor(p0-04): remove nested interactive elements from UnifiedBusinessCard variants`
5. `dfc2b9f` - `refactor(p0-05): polish stretched-link pattern for UnifiedBusinessCard variants`
6. `171e36d` - `refactor(p0-06): expand physical direction check in architecture guard`
7. `3238398` - `fix(p0-07): remove hardcoded supabase credentials fallback and enforce secrets guard`
8. `25bcba5` - `refactor(p0-08): dynamic import atlas geodata and preload HomeView`

---

## 11. Conclusion & Phase 0 Sign-Off

Phase 0 is **COMPLETE** and verified **PASS**. The repository is in an airtight, performant, and fully compliant state ready for Phase 1 documentation.
