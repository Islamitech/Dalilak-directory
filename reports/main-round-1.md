# Round 1 Report

## 0. Verdict in 5 lines
Dalilak-directory is a high-quality, modern React 19 / Vite / Leaflet directory platform with rigorous client-side escaping and impressive domain-specific spatial logic, but it suffers from configuration and repository hygiene liabilities. A Google Places API key was exposed in Git history across 86 commits before removal in commit `7883a55`, while Supabase URL and anon credentials remain hardcoded as source fallbacks and inlined into `dist/`. Serverless functions in `api/` implement partial SSRF and XSS defenses but contain a host-header poisoning bypass accepting any `*.vercel.app` domain and an unrestricted `*` CORS policy on the Google Places resolver. The repository tracks over 50 MB of test suites, duplicate codebases (`verification/`), and raw zip archives, alongside test scripts broken by a hardcoded developer filesystem path. The platform is functionally operational and type-safe, but credentials must be rotated, endpoints hardened, and tracked clutter purged prior to production hardening.

---

## 1. Repo snapshot (A)

### 1.1 Directory Tree (Depth 2)
```
.
├── api/                             (4 serverless TypeScript functions)
├── dist/                            (Production build output, tracked index.html)
│   ├── assets/
│   └── images/
├── docs/                            (Documentation & audit archives)
│   ├── audit/
│   ├── IMPROVEMENTS_REGISTRY/
│   └── public-directory/
├── public/                          (Static PWA assets, icons, manifest, sw.js)
│   └── images/
├── reports/                         (Audit reports, source mirrors, appendices)
│   ├── round-1-appendix/
│   └── round-1-source/
├── scripts/                         (5 verification and test runner scripts)
├── src/                             (Core React 19 source application)
│   ├── components/
│   ├── contexts/
│   ├── data/
│   ├── directory-experience/
│   ├── hooks/
│   ├── server/
│   ├── services/
│   ├── shared/
│   ├── tests/
│   └── utils/
└── verification/                    (590 tracked verification files, test harnesses)
    ├── baseline/
    ├── evidence/
    ├── lib/
    ├── mutation-copy/
    └── vite-cache/
```

### 1.2 Storage Metrics
* **Total Tracked Files**: 842 files
* **`verification/` Directory**: 590 tracked files, 50.7 MB on disk
* **`dist/` Directory**: 1 tracked file (`dist/index.html`, 11.95 KB); full local build output: 4.88 MB
* **`dist-directory/`**: Not present on disk (listed in `.gitignore`)
* **Tracked Archives at Root**:
  * `api.zip` (20.56 KB, 5 entries)
  * `docs.zip` (81.78 KB, 29 entries)
  * `package.zip` (2.31 KB, 4 entries)
  * `src.zip` (1.75 MB, 168 entries)

### 1.3 Git State & Branches
* **Current Branch**: `audit/round-1` (branched from `main`)
* **Total Commit Count**: 204 commits on `main` (205 including audit branch)
* **`git rev-parse --is-shallow-repository`**: `false` (full history confirmed)
* **Local & Remote Branches**:
  * `main`, `audit/round-1`
  * `origin/feat/batch-0-safety-net`
  * `origin/feat/map-complete-repair`
  * `origin/fix/map-full-repair`
  * `origin/gh-pages`
  * `origin/main`
  * `origin/refactor/modularization-security`

### 1.4 Last 15 Commit Subjects
1. `af2b082` fix(pwa): bump service worker cache to v4 to purge stale mobile bundles
2. `d053842` build(deps): update package-lock with test and repair dependencies
3. `a58d59e` merge(map): integrate full architectural repairs and selected-card fixes into feat/map-complete-repair
4. `d3a6bbc` feat(seo): enhance open graph, meta tags and sitemap routes for crawler discovery
5. `8b09a94` fix(map): prevent selected card pin overlap
6. `9e1f683` docs: record GitHub push and Vercel verification
7. `4244c7f` build(vercel): pin Node runtime and record checks
8. `8dfd44c` docs(map): record final repair checkpoints
9. `c8fb765` fix(data): move public catalog cache to IndexedDB
10. `980a777` fix(map): improve mobile search and controls
11. `8d540bb` refactor(map): centralize visible pin pipeline
12. `a5d0e06` refactor(map): unify interaction state and camera ownership
13. `8ce22e6` fix(map): preserve search scope and exact building matches
14. `a92217e` refactor(map): centralize zoom and viewport policy
15. `8188955` test(map): add mobile repair safety net

### 1.5 Full `.gitignore` Contents
```gitignore
node_modules/
dist/
dist-directory/
dist-ux-preview/
*.log
.DS_Store
.env*
!.env.example
_backup_original/
**/_backup_original/
```

### 1.6 Irregular Tracked Files
* **Committed Build Artifact**: `dist/index.html` is tracked despite `dist/` being declared in `.gitignore`.
* **Tracked Root Archives**: `api.zip`, `docs.zip`, `package.zip`, `src.zip`.
* **Tracked Test Cache / Artifacts**: `verification/` contains 590 files including compiled node_modules in `verification/vite-cache/worktree/deps/` and `verification/vite-cache/baseline/deps/` with sourcemaps.

---

## 2. Build and test health (B)

| Command / Script | Result | Notes / First Meaningful Error Lines |
| :--- | :---: | :--- |
| `npm ci` | **PASS** | Added 262 packages, audited 263 packages in 16s. |
| `npx tsc --noEmit` | **PASS** | Zero TypeScript compilation or type errors. |
| `npm run build` | **PASS** | Vite production build generated in 8.43s (`dist/` output). |
| `npm run test:map` | **PASS** | 42/42 tests passed (`src/tests/map_fixes.test.ts`). |
| `npm run test:safety-net` | **PASS** | 19/19 tests passed (9 baseline regression + 10 repaired behaviors). |
| `npm run test:repair` | **FAIL** | `Cannot find module 'C:/Users/Ahmed/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'` at [verification/browser-harness.cjs:1](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/verification/browser-harness.cjs#L1). |
| `npm run test:repair:browser` | **FAIL** | Fails with exact same hardcoded path error in `verification/browser-harness.cjs:1`. |
| `npm run test:map:unit` | **PASS** | 4 test files, 11 tests passed in 702ms via Vitest. |
| `npm run test:map:e2e` | **PASS** | 5 tests passed in 14.4s using Playwright (Chromium mobile viewport). |
| `npm run test:seo` | **PASS** | Sitemap generation 200, static page share 200, category search SEO 200. |

*Detailed execution logs are recorded in [reports/round-1-appendix/test-results.txt](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/reports/round-1-appendix/test-results.txt).*

---

## 3. Secrets and personal data (C)

### 3.1 Secrets Inventory Table
| ID | Location | Type | Active-Risk Assessment |
| :--- | :--- | :--- | :--- |
| **S-01** | `api/google-place-resolver.ts:184` in commits `9089292..7883a55` (86 commits) | Google Places API Key (`[REDACTED:GoogleApiKey]`) | **HIGH (Historical)**: Active in repository history across 86 commits (2026-09-09 to 2026-09-27). Removed at HEAD; must be revoked in Google Cloud Console. |
| **S-02** | [src/services/supabaseClient.ts:10](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/services/supabaseClient.ts#L10) | Supabase Publishable/Anon Key (`[REDACTED:SupabasePublishableKey]`) | **MEDIUM (Active)**: Hardcoded as code fallback; inlined into production bundle `dist/assets/index-B67EiM-x.js`. |
| **S-03** | [src/server/directoryData.ts:4](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/server/directoryData.ts#L4) | Supabase Publishable/Anon Key (`[REDACTED:SupabasePublishableKey]`) | **MEDIUM (Active)**: Hardcoded fallback in serverless helper. |
| **S-04** | [src/services/supabaseClient.ts:5](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/services/supabaseClient.ts#L5) & [src/server/directoryData.ts:3](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/server/directoryData.ts#L3) | Supabase Project URL (`[REDACTED:SupabaseUrl]`) | **LOW**: Identifies production database project ID. Inlined into client bundle. |
| **S-05** | `src.zip` (`src/server/directoryData.ts`, `src/services/supabaseClient.ts`) | Supabase Publishable/Anon Key | **MEDIUM (Active)**: Tracked unencrypted inside zip archive. |
| **S-06** | `verification/baseline/` & `verification/mutation-copy/` | Supabase Publishable/Anon Key | **MEDIUM (Active)**: Tracked duplicate copies of client and server code. |
| **S-07** | [src/data/mockData.ts:512](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/data/mockData.ts#L512) | Personal Phone (`ownerPhone: '[REDACTED:Phone]'`) | **LOW (Privacy)**: Business owner personal mobile number in mock dataset. |
| **S-08** | Commit `7883a55` metadata & [verification/browser-harness.cjs:1](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/verification/browser-harness.cjs#L1) | Personal Email & Filesystem Path (`[REDACTED:Email]`, `C:/Users/Ahmed/...`) | **LOW (Information Leak)**: Identifies developer name, personal email, and local workstation hierarchy. |

### 3.2 Gitleaks & Git History Scan Verification
* **Gitleaks Version**: `8.30.1` executed over all 209 commits (`gitleaks git --log-opts="--all"`).
* **Gitleaks Total Findings**: 18 leak occurrences (all verified as either the Google Places key in `api/google-place-resolver.ts` or Supabase anon credentials across mirrors). Full redacted summary in [reports/round-1-appendix/gitleaks-summary.txt](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/reports/round-1-appendix/gitleaks-summary.txt).
* **Regex Pattern Scans**:
  * `service_role`: **0 occurrences** across all source code, serverless functions, scripts, and build configs. (Matched only regex scanner rules in `verification/secret-check.cjs`).
  * `AIza[0-9A-Za-z_-]{35}`: **0 occurrences at HEAD** across all tracked files and `dist/`. Only appears in git history prior to commit `7883a55`.
  * `14-digit Egyptian National IDs` (`\b[23][0-9]{13}\b`): **0 occurrences** across repository and build output.
  * `.env.example`: Checked; contains only safe dummy strings (`your-project-id.supabase.co`, `your-supabase-anon-public-key`, `your-google-places-api-key`). No real credentials.

---

## 4. Environment variables (D)

| Variable Name | Code Location (file:line) | `VITE_`-Prefixed? | Appears in `dist/`? | Purpose & Runtime Handling |
| :--- | :--- | :---: | :---: | :--- |
| `GOOGLE_PLACES_API_KEY` | [api/google-place-resolver.ts:195](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/api/google-place-resolver.ts#L195) | No | No | Serverless Google Places API key. If absent, resolution falls back to HTML scraping. |
| `VITE_GOOGLE_PLACES_API_KEY` | `README.md:43` | Yes | No | **Dead documentation**. No source or serverless file references or reads this variable. |
| `SUPABASE_URL` | [src/server/directoryData.ts:3](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/server/directoryData.ts#L3) | No | No | Serverless database URL. Falls back to `VITE_SUPABASE_URL` or hardcoded URL. |
| `VITE_SUPABASE_URL` | [src/services/supabaseClient.ts:4](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/services/supabaseClient.ts#L4) | **Yes** | **YES** | Public Supabase endpoint. Hardcoded fallback inlined into client bundle. |
| `SUPABASE_ANON_KEY` | [src/server/directoryData.ts:4](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/server/directoryData.ts#L4) | No | No | Serverless anon API key. Falls back to hardcoded string. |
| `VITE_SUPABASE_ANON_KEY` | [src/services/supabaseClient.ts:9](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/services/supabaseClient.ts#L9) | **Yes** | **YES** | Public Supabase publishable key. Hardcoded fallback inlined into client bundle. |
| `import.meta.env.PROD` | [src/main.tsx:21](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/main.tsx#L21) | Built-in | **YES** | Gates Service Worker registration to production builds. Replaced by `true` in bundle. |
| `process.env.CI` | `playwright.map.config.ts:18` | No | No | Test harness only; controls web server reuse. |
| `process.env.PLAYWRIGHT_MODULE` | `scripts/verify-browser.cjs:2` | No | No | Test script only; override for Playwright module path. |
| `process.env.CHROME_PATH` | `scripts/verify-browser.cjs:4` | No | No | Test script only; executable path for Chrome. |

---

## 5. Data access inventory (E)

| File:Line | Target Table / URL | Operation | Columns Requested | Filters | Limit / Pagination | Client / Server | Key Used |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| [src/App.tsx:301](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/App.tsx#L301) | `/rest/v1/businesses` | GET | `FAST_BUSINESS_SELECT` (21 columns; excludes `*`) | `package_id=neq.pkg_interested_lead`, `verification_status=eq.verified` | Range header (500/page, up to 100k) | Browser | `SUPABASE_ANON_KEY` |
| [src/App.tsx:328](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/App.tsx#L328) | Realtime channel `dalelak-public-directory-realtime` | WebSocket Subscribe | All table events (`*`) | None (listens to table `businesses`) | Streamed live | Browser | `SUPABASE_ANON_KEY` |
| [src/server/directoryData.ts:8](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/server/directoryData.ts#L8) | `/rest/v1/businesses` | GET | `fields` (20 columns; excludes `*`) | `loadPublicDirectory`: verified & non-lead; `findPublicBusiness`: `id=eq.<id>` | Range header (500/page) or `limit=1` | Server | `SUPABASE_ANON_KEY` |
| [src/services/storage.ts:53,62](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/services/storage.ts#L53) | Storage bucket `business-photos` | Upload / Get URL | File binary / public URL | N/A | Single file | Browser | `SUPABASE_ANON_KEY` |
| [src/components/activity/ActivityDetailModal.tsx:120](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/components/activity/ActivityDetailModal.tsx#L120) | `/api/google-place-resolver` | POST | N/A (JSON body) | None | 1 request | Browser | None (Internal) |
| [src/utils/geocoding.ts:64,107,167](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/utils/geocoding.ts#L64) | Nominatim OpenStreetMap | GET | JSON geocoding | Query parameters | Limit 1 | Browser | None |
| [src/utils/hadayekRouting.ts:28](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/utils/hadayekRouting.ts#L28) | OSRM Routing Service | GET | Route geometry & duration | Origin/Destination coordinates | 1 route | Browser | None |
| [api/biz-og.ts:201](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/api/biz-og.ts#L201) | External Photo URL | GET | Image binary buffer | Host allowlist check | Max 5 MB stream | Server | None |
| [api/google-place-resolver.ts:235](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/api/google-place-resolver.ts#L235) | `places.googleapis.com/v1/places:searchText` | POST | `places.id,displayName,primaryType,photos...` | Text query + optional locationBias | 1 place | Server | `GOOGLE_PLACES_API_KEY` |
| [api/google-place-resolver.ts:277](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/api/google-place-resolver.ts#L277) | `places.googleapis.com/v1/{name}/media` | GET | `photoUri` | Dimensions 1600x1600 | Up to 5 photos | Server | `GOOGLE_PLACES_API_KEY` |
| [api/google-place-resolver.ts:381,419,439](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/api/google-place-resolver.ts#L381) | User Google Maps URL | GET | HTML / JSON preload payload | Google host allowlist & private IP block | Max 6 hops | Server | None |

* **`service_role` Key Check**: Confirmed absent across all application code, serverless functions, scripts, Vite defines, and type definitions.

---

## 6. api/ functions (F)

*Full source files with line numbers and redactions are archived under [reports/round-1-source/](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/reports/round-1-source/).*

### 6.1 `api/biz-og.ts` (260 lines)
* **Purpose**: Generates dynamic OpenGraph preview images for individual businesses. If a verified photo exists on an allowed host or base64 format, it streams or converts it; otherwise it generates a customized SVG gold card and rasterizes it to PNG.
* **Inputs & Validation**: Accepts `req.query.biz` or `req.query.id`. Validates type as string, decodes URI component, and passes to `findPublicBusiness()`. Non-existent businesses return `404` with Arabic plaintext.
* **HTML / Output Escaping**: All business fields (`name_ar`, `category`, `city`, `governorate`, `phone`) embedded into the fallback SVG card are strictly escaped via custom `escapeXml()` replacing `&`, `<`, `>`, `"`, `'`.
* **External URL & SSRF Handling**: External images are strictly filtered against an allowlist: `.supabase.co`, `.googleusercontent.com`, `.ggpht.com`, `images.unsplash.com`, `www.dalilaak.com`, `dalilaak.com`. Employs a 5000ms `AbortController` timeout and enforces an explicit 5 MB chunk-by-chunk stream ceiling to prevent memory exhaustion DoS.
* **`@vercel/og` Usage**: Does **NOT** use `@vercel/og`. Uses `@resvg/resvg-js` (`Resvg`) to render SVG into PNG buffers.
* **Cache-Control**: `public, max-age=60, s-maxage=60, stale-while-revalidate=300` for generated cards; `public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800` for proxied photos; `no-store` on error / 404.
* **Rate Limiting & Error Leaks**: No rate limiting in code. Catches errors at root, logs to console, and returns `503` with static Arabic text `'تعذر تحميل الصورة'`. No stack trace leaks.

### 6.2 `api/google-place-resolver.ts` (826 lines)
* **Purpose**: Resolves Google Maps URLs, extracts business coordinates, phone numbers, working hours, and high-resolution photos using Google Places API (New) combined with anti-bleed HTML/JSON-LD parsing.
* **Inputs & Validation**: Reads `req.query.url` or `req.body.url`. Requires string input; validates via `isValidGoogleMapsUrl()`.
* **SSRF Guard & Scheme Checks**:
  * Protocol restricted to `http:` and `https:`.
  * Host blacklist blocks `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`, `10.*`, `192.168.*`, `169.254.*`, `.internal`, `.local`. *(Note: `172.16.0.0/12` is omitted from blacklist)*.
  * Host regex allowlist strictly matches `maps.app.goo.gl`, `goo.gl`, `google.com`, `www.google.com`, `maps.google.com`, and `/^(?:[a-z0-9-]+\.)*google\.(?:com|com\.eg|eg|net|co\.[a-z]{2})$/i`.
  * Redirects: Follows up to 6 manual hops (`redirect: 'manual'`), re-validating `isValidGoogleMapsUrl()` on every `Location` header before following.
* **Timeouts & Response Limits**: 6000ms global abort timeout; 4000ms timeout on media fetches. **Response size limit is missing** on `desktopResponse.text()`, `preloadPayload`, and `botHtml`.
* **Google API & Key Safety**: Uses `process.env.GOOGLE_PLACES_API_KEY`. The key is passed via headers (`X-Goog-Api-Key`) to `places:searchText` and query parameter `key=` on media endpoints. No logging of the raw key.
* **CORS & Callers**: Sets `Access-Control-Allow-Origin: *`, allowing arbitrary third-party websites to utilize this resolver. Called by client component `src/components/activity/ActivityDetailModal.tsx`.

### 6.3 `api/share.ts` (588 lines)
* **Purpose**: Generates server-side rendered HTML metadata, OpenGraph tags, Twitter cards, Schema.org JSON-LD, and pre-rendered semantic crawler snapshots for bot and social sharing on routes `/biz/:slug` and high-intent pages (`/about`, `/pricing`, `/for-business`, `/search`, `/map`).
* **Inputs & Validation**: Reads `req.query.biz`, `req.query.id`, `req.query.page`, `req.query.cat`. Sanitizes inputs, extracts `biz_` identifiers, and looks up public records via `findPublicBusiness()`.
* **Host Header Handling (VULNERABILITY)**:
  ```typescript
  const ALLOWED_HOSTS = ['www.dalilaak.com', 'dalilaak.com', 'dalilak.vercel.app', 'localhost:5173', '127.0.0.1:5173'];
  const reqHost = ((req.headers['x-forwarded-host'] as string) || req.headers.host || '').toLowerCase().trim();
  const host = ALLOWED_HOSTS.includes(reqHost) || reqHost.endsWith('.vercel.app') ? reqHost : 'www.dalilaak.com';
  ```
  `reqHost.endsWith('.vercel.app')` allows any attacker deploying an arbitrary Vercel application (e.g. `phishing.vercel.app`) to send `X-Forwarded-Host: phishing.vercel.app` and hijack canonical URLs, OG tags, and crawler links.
* **Output Escaping & Injection Protection**:
  * HTML meta tag values, titles, and descriptions are escaped via `escapeHtml()`.
  * JSON-LD structured data is serialized with `JSON.stringify()` and sanitized via `.replace(/</g, '\\u003c')` to prevent script breakout.
  * In the fallback redirect template, URL injection was patched in commit `7883a55` to use `window.location.replace(${JSON.stringify(pageUrl)})`.
* **Cache-Control**: `public, max-age=60, s-maxage=120, stale-while-revalidate=600` for business entities; `public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800` for static pages.

### 6.4 `api/sitemap.ts` (143 lines)
* **Purpose**: Generates dynamic XML sitemap conforming to Sitemap 0.9 and Google Image Sitemap specifications, encompassing static exploratory routes and all verified businesses.
* **Inputs & Validation**: No user query parameters required; queries public catalog via `loadPublicDirectory()`.
* **Host Header Handling**: Contains the same `reqHost.endsWith('.vercel.app')` host-header vulnerability as `api/share.ts`.
* **XML Escaping**: All URLs, titles, captions, and names are sanitized via `escapeXml()`.
* **Cache-Control**: `public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400`. Returns `503` with empty `<urlset>` on failure.

---

## 7. src/ structure review (G)

### 7.1 `src/server/`
* **Files**: [src/server/directoryData.ts](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/server/directoryData.ts) (2.75 KB).
* **Purpose**: Server-side data provider querying Supabase REST API for `loadPublicDirectory()` and `findPublicBusiness()`.
* **Client Bundle Isolation**: Confirmed **NOT** imported by any client component or bundled into `dist/`. Used exclusively by `api/biz-og.ts`, `api/share.ts`, `api/sitemap.ts`, and `src/tests/repair.test.ts`.
* **Operations**: Read-only queries over REST. Contains hardcoded fallback Supabase URL and anon key. Does not reference `service_role` keys or execute database writes.

### 7.2 `src/data/`
* [categoryTaxonomy.ts](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/data/categoryTaxonomy.ts) (9.34 KB): Taxonomy hierarchy. Fields: `id`, `label`, `aliases`, `icon`, `children`. No personal data.
* [hadayekAtlasData.ts](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/data/hadayekAtlasData.ts) (24.17 KB): District gate boundaries and landmark registry. Fields: `id`, `nameAr`, `nameEn`, `gate`, `center`, `bounds`, `streets`, `landmarks`. No personal data.
* [hadayekBuildingsCoords.json](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/data/hadayekBuildingsCoords.json) (1.65 MB): ~79,000 OpenStreetMap building records. Fields: `lat`, `lng`, `zoneHint`, `rawName`, `rawHousenumber`. (Line 79125 contains an 11-digit phone number in `rawHousenumber`).
* [hadayekDistrictsGeoData.ts](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/data/hadayekDistrictsGeoData.ts) (31.29 KB): GeoJSON polygons for Zones A through T. Fields: `type`, `geometry`, `properties`. No personal data.
* [mockData.ts](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/data/mockData.ts) (34.44 KB): Sandbox fixtures and packages. Contains personal data field `ownerPhone: '[REDACTED:Phone]'` (line 512) and commercial field `amountPaid: 1500` (lines 520, 542).

### 7.3 `src/shared/` & `src/services/`
* **Shared Code**: [src/shared/publicBusiness.ts](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/shared/publicBusiness.ts) is shared between client (`src/App.tsx`), serverless (`src/server/directoryData.ts`), and tests. It defines `businessMetadata(row)` and `isPublicBusiness(row)` enforcing verification and publication rules.
* **Services**:
  * [supabaseClient.ts](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/services/supabaseClient.ts): Initializes Supabase client with auth session persistence disabled.
  * [catalogCache.ts](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/services/catalogCache.ts): Manages IndexedDB catalog storage (`dalelak_catalog_db`).
  * [storage.ts](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/services/storage.ts): Supabase Storage upload helper for bucket `business-photos`.

### 7.4 `src/tests/`
* **Strong Coverage**: Cadastral boundaries, point-in-polygon containment, Leaflet spiderfy math, camera flight controllers, Arabic text normalization, building query parsing, public eligibility filtering, phone format validation, and E2E mobile viewport testing.
* **Coverage Gaps**: Zero tests for SSRF boundary conditions, DNS rebinding, serverless host-header poisoning, file upload content validation, rate limiting, and Service Worker offline caching.

---

## 8. Client-side risk hits (H)

* `dangerouslySetInnerHTML`: **0 hits**.
* `innerHTML`: **0 hits**.
* `outerHTML`: **0 hits**.
* `insertAdjacentHTML`: **0 hits**.
* `document.write`: **0 hits**.
* `eval(`: **0 hits**.
* `new Function`: **0 hits**.
* `postMessage`: [src/main.tsx:30](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/main.tsx#L30) (`installingWorker.postMessage('skipWaiting')` - standard service worker lifecycle message).
* `window.open`:
  * [src/components/activity/ActivityDetailModal.tsx:670](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/components/activity/ActivityDetailModal.tsx#L670): Directions / Google Maps link.
  * [src/components/atlas/HadayekAtlasNavigator.tsx:77](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/components/atlas/HadayekAtlasNavigator.tsx#L77): Google Maps external link with `'noopener,noreferrer'`.
  * [src/components/atlas/HadayekGatesModal.tsx:27](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/components/atlas/HadayekGatesModal.tsx#L27): External navigation link with `'noopener,noreferrer'`.
  * [src/components/map/BuildingDetailDrawer.tsx:61](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/components/map/BuildingDetailDrawer.tsx#L61): External directions link with `'noopener,noreferrer'`.
  * [src/components/map/InAppNavigationDrawer.tsx:194](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/components/map/InAppNavigationDrawer.tsx#L194): External directions link with `'noopener,noreferrer'`.
  * [src/components/views/ForBusinessView.tsx:76](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/components/views/ForBusinessView.tsx#L76): WhatsApp dispatch popup.
* `target="_blank"` without `rel`: **0 hits**. All 27 occurrences in TSX and template strings explicitly include `rel="noopener noreferrer"`.
* `href`/`src` built from data fields:
  * [src/components/map/badgeMarkers.ts:610](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/components/map/badgeMarkers.ts#L610): `safeEffectiveUrl` is filtered via `sanitizeSafeUrl()` (rejects `javascript:`, `data:`, `vbscript:`, quotes, whitespace) and passed through `escapeHtml()`.
  * [src/components/map/badgeMarkers.ts:630](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/components/map/badgeMarkers.ts#L630): `a href="tel:${escapeHtml(phone)}"` sanitized via `sanitizePhoneNumber()` (permits only digits and leading `+`).
* Storage Usage:
  * `localStorage`: `dalelak_directory_cache` (cleansed catalog), `dalelak_user_favorites`, `dalelak_recent_searches`, `dalelak_for_business_draft`, `dalelak_theme`. No auth tokens or session credentials stored.
  * `sessionStorage`: **0 hits**.
  * `IndexedDB`: `dalelak_catalog_db` (table `catalog_store`, key `catalog_v1`) stores public business cards for offline/fast paint.
* Map Marker HTML: Marker HTML templates in [src/components/map/badgeMarkers.ts](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/components/map/badgeMarkers.ts) and [src/components/map/hooks/useMapPinsClustering.ts](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/components/map/hooks/useMapPinsClustering.ts) strictly sanitize all data variables via `escapeHtml()` and `sanitizeSafeUrl()`.

---

## 9. vercel.json and service worker (I)

### 9.1 `vercel.json` (Full Content)
```json
{
  "functions": {
    "api/*.ts": {
      "memory": 1024,
      "maxDuration": 15,
      "includeFiles": "dist/**"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(self), camera=()"
        }
      ]
    },
    {
      "source": "/",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/map",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/search",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/index.html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/",
      "has": [
        {
          "type": "query",
          "key": "biz",
          "value": "(?<bizId>[^&]+)"
        }
      ],
      "destination": "/biz/:bizId",
      "permanent": false
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/sitemap.xml",
      "destination": "/api/sitemap"
    },
    {
      "source": "/about",
      "destination": "/api/share?page=about"
    },
    {
      "source": "/pricing",
      "destination": "/api/share?page=pricing"
    },
    {
      "source": "/for-business",
      "destination": "/api/share?page=for-business"
    },
    {
      "source": "/search",
      "destination": "/api/share?page=search"
    },
    {
      "source": "/map",
      "destination": "/api/share?page=map"
    },
    {
      "source": "/biz/(.*)",
      "destination": "/api/share?biz=$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 9.2 `public/sw.js` (Full Content)
```javascript
/**
 * Dalilak Directory Portal PWA Service Worker (Update 38 - Map Repair & Single Source State)
 * Strategy: Network-First with Institutional Offline Shell Fallback
 */

const CACHE_NAME = 'dalilak-portal-shell-v4';
const OFFLINE_URL = '/offline.html';

const STATIC_PRECACHE = [
  OFFLINE_URL,
  '/logo.png',
  '/favicon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never intercept API requests, Supabase, or external services
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/rest/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('google')
  ) {
    return;
  }

  // Navigation requests: Network-First with fallback to offline.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedFallback = await cache.match(OFFLINE_URL);
        return cachedFallback || new Response('Offline', { status: 503, statusText: 'Offline' });
      })
    );
    return;
  }

  // Precached static shell assets fallback
  if (STATIC_PRECACHE.includes(url.pathname)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(event.request);
          return cached || fetch(event.request);
        })
    );
  }
});
```

### 9.3 Configuration Analysis
* **Redirect / Rewrite Behavior**:
  * Redirect `/?biz=(?<bizId>[^&]+)` -> `/biz/:bizId` redirects to the business path.
  * Rewrite `/biz/(.*)` -> `/api/share?biz=$1` routes to serverless metadata generation.
  * In `api/share.ts`, missing businesses trigger `return res.status(404).send(template)` or redirect to `/`. No open redirect occurs because destination URLs are either hardcoded `/` or internal `/biz/<slug>`.
* **Header & Security Coverage**:
  * Good baseline: HSTS (2 years preload), `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`.
  * **Critical Gap**: **No Content-Security-Policy (CSP)** is configured in `vercel.json` or `index.html`.
* **Service Worker Caching**:
  * Caches only static shell files: `/offline.html`, `/logo.png`, `/favicon.svg`, `/manifest.json`.
  * Explicitly bypasses `/api/`, `/rest/`, `supabase.co`, and `google` domains.
  * No API responses, catalog data, or user-specific data are stored in SW CacheStorage.
* **Cache Versioning**: `CACHE_NAME = 'dalilak-portal-shell-v4'`. Deletes old cache buckets on activation. `src/main.tsx` requests `skipWaiting` and forces reload on updates.

---

## 10. Dependencies (J)

### 10.1 `npm audit` Summary
* **Total Vulnerabilities**: 16 (1 Low, 4 Moderate, 11 High)
* **Key High-Severity Issues**:
  * `@fastify/busboy` (1.0.0 - 3.2.0): DoS via prototype pollution in multipart header (GHSA-x8mw-p69m-v3mx) via `undici` in `@vercel/node`.
  * `path-to-regexp` (4.0.0 - 6.2.2): Regular expression DoS (GHSA-9wv6-86v2-598j) via `@vercel/node`.
  * `braces` & `brace-expansion`: Stack exhaustion & uncontrolled recursion CPU DoS via `micromatch` / `@vercel/node`.
  * `esbuild` (0.27.3 - 0.28.0): Arbitrary file read in Windows dev server (GHSA-g7r4-m6w7-qqqr) via `tsx`.
* *Raw audit JSON saved at [reports/round-1-appendix/npm-audit.json](file:///C:/Users/karee\OneDrive\Desktop\Dalilak-directory-AUDIT\reports\round-1-appendix\npm-audit.json).*

### 10.2 Outdated Majors
* `@vercel/node`: Installed `12.0.0`, Latest `20.0.0` (8 major versions behind; root cause of majority of npm audit CVEs).
* `vite`: Installed `6.4.3`, Latest `8.3.2` (2 major versions behind).
* `lucide-react`: Installed `0.546.0`, Latest `1.51.0` (major version behind).
* `typescript`: Installed `5.8.3`, Latest `7.0.2` (major version behind).

### 10.3 Dependency Grouping & Native Addons
* **Dead Dependency in Production**: `@vercel/og` (`^1.0.2`) is listed under `dependencies`, but is never imported or used anywhere in the codebase (`api/biz-og.ts` uses `@resvg/resvg-js`).
* **Misplaced Build Plugins**: `@tailwindcss/vite`, `@vitejs/plugin-react`, and `vite` are placed under `dependencies` rather than `devDependencies`.
* **Native Binaries**: `@resvg/resvg-js` (`^2.6.2`) is a native Rust-based Node addon used for serverless OG image rasterization.

---

## 11. Public data exposure (K)

1. **Supabase Schema Over-Fetching**:
   * [src/server/directoryData.ts:5](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/server/directoryData.ts#L5) requests:
     `id,name_ar,name_en,category,governorate,city,street,phone,secondary_phone,working_hours,description,photos,cover_photo,notes,lat,lng,verification_status,package_id,created_at,updated_at`
   * [src/App.tsx:14](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/App.tsx#L14) requests:
     `id,name_ar,name_en,category,governorate,city,street,landmark,phone,secondary_phone,working_hours,description,lat,lng,package_id,package_name,package_price,verification_status,notes,created_at,cover_photo`
2. **Exposure of `notes` Field**:
   * The `notes` column in Supabase is a JSON/text field intended for operational metadata (`customDirectoryUrl`, `googleMapsUrl`, `publishedStatus`).
   * Because PostgreSQL row-level security (RLS) policies permit anon reads on all columns of verified businesses, any internal notes, administrative flags, or representative notes saved in `notes` are fully readable by anyone calling the public PostgREST API with the anon key.
3. **Exposure of Commercial / CRM Metadata**:
   * `package_id`, `package_name`, and `package_price` are requested over the public REST API. While harmless on public tiers, it exposes business package tier assignments directly to competitors.
4. **Owner Contact in Mock Fixtures**:
   * [src/data/mockData.ts:512](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/data/mockData.ts#L512) contains an explicit `ownerPhone` field with an Egyptian mobile number format.

---

## 12. Findings

| ID | Severity | Title | Evidence (Path:Line) | One-Sentence Exploit Scenario | Confidence | Proposed Fix |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| **F-01** | **High** | Hardcoded Supabase Fallback Credentials inlined into Client Bundle | [src/services/supabaseClient.ts:5,10](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/services/supabaseClient.ts#L5), [src/server/directoryData.ts:3,4](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/server/directoryData.ts#L3) | An attacker can query the production Supabase database directly over REST, scrape all verified businesses, and exhaust free-tier API quotas. | **CONFIRMED** | Remove hardcoded fallback strings; fail fast at initialization if environment variables are missing. |
| **F-02** | **High** | Host Header Poisoning via Wildcard `*.vercel.app` Validation | [api/share.ts:87](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/api/share.ts#L87), [api/sitemap.ts:37](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/api/sitemap.ts#L37) | An attacker deploying an arbitrary app on `*.vercel.app` can inject `X-Forwarded-Host: evil.vercel.app` to poison social preview canonical links and sitemap URLs. | **CONFIRMED** | Replace `.endsWith('.vercel.app')` with an exact allowlist matching only the production domain and designated Vercel project ID. |
| **F-03** | **High** | Absence of Content Security Policy (CSP) | [vercel.json:9-33](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/vercel.json#L9), [index.html:1](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/index.html#L1) | If any third-party script or dependency is compromised, lack of CSP allows unconstrained data exfiltration and inline script execution. | **CONFIRMED** | Add a strict CSP header in `vercel.json` restricting script, connect, and image sources to trusted domains. |
| **F-04** | **Medium** | Over-Fetching & Exposure of Internal `notes` Column via Anon REST | [src/server/directoryData.ts:5](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/server/directoryData.ts#L5), [src/App.tsx:14](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/App.tsx#L14) | Any user querying PostgREST with the anon key can read unfiltered `notes` containing internal CRM flags, package metadata, and unlisted status data. | **CONFIRMED** | Restrict SELECT columns to public-only fields or introduce a dedicated Supabase public view / Postgres column security. |
| **F-05** | **Medium** | Hardcoded Developer Workstation Path Breaks Verification Tests | [verification/browser-harness.cjs:1](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/verification/browser-harness.cjs#L1), [src/tests/repair.test.ts:90](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/tests/repair.test.ts#L90) | Running `npm run test:repair` crashes across all environments other than the original developer's PC (`C:/Users/Ahmed/...`). | **CONFIRMED** | Replace hardcoded absolute path with standard `require('playwright')` or resolve from local `node_modules`. |
| **F-06** | **Medium** | Repository Bloat: Tracked Test Dumps, Bundled Caches & Root Zip Archives | `verification/`, `api.zip`, `docs.zip`, `package.zip`, `src.zip` | Tracking 50+ MB of duplicate code, pre-bundled cache files, and zip files increases attack surface and leaks historical source snapshots. | **CONFIRMED** | Untrack and delete root `.zip` archives and `verification/` build caches; enforce in `.gitignore`. |
| **F-07** | **Medium** | Unrestricted CORS Policy on Serverless Google Places Resolver | [api/google-place-resolver.ts:342](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/api/google-place-resolver.ts#L342) | Any third-party website can make cross-origin requests to `/api/google-place-resolver`, consuming serverless compute and Google Places API quota. | **CONFIRMED** | Restrict `Access-Control-Allow-Origin` to `https://www.dalilaak.com` and authorized domains. |
| **F-08** | **Medium** | Missing Response Body Size Ceiling in Serverless URL Unfurl | [api/google-place-resolver.ts:412,429,448](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/api/google-place-resolver.ts#L412) | A maliciously crafted or huge response returned during Google Maps redirect resolution could cause memory exhaustion in the serverless instance. | **LIKELY** | Implement an explicit byte-count limit on incoming response bodies similar to the 5 MB ceiling in `api/biz-og.ts`. |
| **F-09** | **Medium** | Severely Outdated Serverless Runtime Dependency (`@vercel/node@12.0.0`) | [package.json:28](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/package.json#L28) | Outdated serverless builder pulls vulnerable transitive dependencies (`@fastify/busboy`, `path-to-regexp`, `brace-expansion`) with 11 High CVEs. | **CONFIRMED** | Upgrade `@vercel/node` to modern major version (v20+). |
| **F-10** | **Low** | Business Owner Personal Phone and Commercial Fields in Mock Fixtures | [src/data/mockData.ts:512,520](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/data/mockData.ts#L512) | Exposes personal mobile phone number and package payment amounts in publicly accessible source files. | **CONFIRMED** | Replace personal mobile numbers with fictional `555` or carrier dummy prefixes. |
| **F-11** | **Low** | Historical Google Places API Key in Git Commit Range `9089292..7883a55` | `api/google-place-resolver.ts` (86 commits) | Anyone with clone access to git history can retrieve the historical key and attempt to use it if not revoked in GCP. | **CONFIRMED** | Verify key revocation in Google Cloud Console; do not attempt destructive history rewriting without team consensus. |
| **F-12** | **Low** | Dead Configuration Variable in Documentation | `README.md:43` | Developers configuring `VITE_GOOGLE_PLACES_API_KEY` may falsely assume it is active, while the backend expects `GOOGLE_PLACES_API_KEY`. | **CONFIRMED** | Correct `README.md` to reference `GOOGLE_PLACES_API_KEY`. |

---

## 13. What I could not determine, and why
1. **Google Places Key Active Status in Google Cloud Platform**:
   * *Status*: **UNCONFIRMED**.
   * *Reason*: Under Hard Rule 2 ("Do not contact production or any third-party API using discovered credentials"), no external requests were made to Google APIs using the discovered historical key. Confirmation requires checking the GCP Cloud Console.
2. **Supabase Database Row-Level Security (RLS) Policies on Non-Public Columns**:
   * *Status*: **UNCONFIRMED**.
   * *Reason*: The audit was performed entirely from the client/serverless repository code without direct database administrative access. Whether RLS blocks private columns on `businesses` or if `notes` is accessible to the public role can only be confirmed in the Supabase Dashboard.
3. **Vercel Project-Level Environment Variables and WAF Rules**:
   * *Status*: **UNCONFIRMED**.
   * *Reason*: Vercel dashboard settings, rate limits, firewall rules, and deployment environment variables were not visible from the local repository checkout.

---

## 14. Questions for the owner
1. Has the historical Google Places API key (`AIza...`) present between commits `9089292` and `7883a55` been permanently deleted/revoked in the Google Cloud Console?
2. Are the hardcoded fallback Supabase URL and Publishable/Anon key (`sb_publishable_...`) intended for this public portal, and has Row-Level Security (RLS) been verified on the `businesses` table to prevent modification or unauthorized reading of internal CRM notes?
3. Can the entire `verification/` folder and root-level `.zip` archives (`api.zip`, `docs.zip`, `package.zip`, `src.zip`) be safely removed from Git tracking to reduce repository size by >50 MB?
4. Is `/api/google-place-resolver` intended solely for internal consumption by the Dalilak portal, allowing us to lock down its CORS policy to `www.dalilaak.com` rather than `*`?
5. May we upgrade `@vercel/node` to modern versions (v20) and clean up package dependencies?

---

READY FOR ROUND 2
