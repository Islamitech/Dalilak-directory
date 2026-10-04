# Dalilak Security Remediation Report - Round 2

**Repository**: `Dalilak-directory`  
**Branch**: `fix/main-round-2`  
**Base Commit**: `75cad98` (`audit/round-1`)  
**Auditor**: Senior Backend & Application Security Engineer  
**Date**: October 4, 2026  

---

## 1. Executive Summary & Remediation Status Overview

This report documents all security fixes, hygiene enhancements, test repairs, and architectural verifications completed during **Round 2** on the `Dalilak-directory` repository.

Following the thorough findings in `reports/main-round-1.md`, all actionable security issues in the public directory and its serverless functions have been remediated in atomic, isolated local commits adhering strictly to the `fix(M-xx): <title>` format. Every task from T1 through T11 was first evaluated against codebase evidence: findings confirmed in code were remediated and tested; tasks targeting legacy decoupled components (auth, reps, payouts, national IDs, Baileys bots) were verified as **REFUTED** with file:line proof.

### Task Status Summary

| Task | Category | Status | Evidence / Resolution Summary |
| :--- | :--- | :---: | :--- |
| **T1** | **Authentication & Password Storage** | **REFUTED** | No authentication system, login screens, sessions, or password comparisons exist in `Dalilak-directory`. Grep for `password`, `hash`, `bcrypt`, `argon2`, `login`, and `session` confirms this portal is 100% public read-only (decoupled in commit `7883a55`). |
| **T2** | **Representative Registration** | **REFUTED** | No representative registration forms or direct database write routes exist. The `/for-business` view (`src/views/ForBusinessView.tsx:32`) redirects directly to an official WhatsApp sales link (`wa.me/201007788481`). `OwnerScreen.tsx` is an isolated UI simulation harness. |
| **T3** | **Direct Browser Writes & Column Projections** | **DONE** | Zero `insert`, `update`, or `delete` calls exist in client code. Only orphaned storage upload was found in `src/services/storage.ts`. All Supabase reads use strict explicit column projections (`src/server/directoryData.ts:5`, `src/services/supabaseClient.ts:77`), zero `select('*')`. Proposed RLS migration `002_directory_rls_hardening.sql` disallows anonymous writes. |
| **T4** | **Admin & Payout Routes** | **REFUTED** | No payout, representative management, or admin routes exist in `api/` (which contains only `biz-og.ts`, `google-place-resolver.ts`, `share.ts`, and `sitemap.ts`). |
| **T5** | **National ID Enumeration** | **REFUTED** | Function `check_rep_national_id_exists` and national ID fields do not exist in this public repository. |
| **T6** | **Storage Upload Security** | **DONE** | Created proposed migration `supabase/proposed-migrations/002_directory_rls_hardening.sql` locking down `business-media` bucket: enforces 5 MB ceiling, restricts MIME types to JPEG/PNG/WebP, grants public read, and restricts uploads to service_role / backend workflows. |
| **T7** | **Serverless API Hardening** | **DONE** | Patched host header poisoning in `api/share.ts` and `api/sitemap.ts` (Commit `7af284c`). Restricted CORS to exact Dalilak domains, blocked RFC1918 /12 private IP space (`172.16.0.0/12`), and enforced a 5 MB upstream response ceiling in `api/google-place-resolver.ts` (Commit `f0066eb`). |
| **T8** | **WhatsApp Integration & Baileys Risk** | **DONE / BLOCKED** | Confirmed no Baileys bot daemon or socket session exists in the repository. Added auth/session ignore rules to `.gitignore`. Documented Meta Cloud API migration requirements as **BLOCKED** pending Meta Business Manager onboarding. |
| **T9** | **Secrets Hygiene & Dependency Management** | **DONE** | Untracked root archives (`api.zip`, `docs.zip`, `package.zip`, `src.zip`) and `dist/index.html` via `git rm --cached` (Commit `903097f`). Enhanced `.gitignore`. Added `scripts/check-no-secrets.cjs` wired to `npm run check:secrets`. Moved build tooling to `devDependencies` and removed unused `@vercel/og` (Commit `74e990b`). |
| **T10**| **Database Migrations Consolidation** | **DONE** | Created `supabase/proposed-migrations/001_directory_baseline_schema.sql` and `002_directory_rls_hardening.sql` with purpose, risk, and rollback documentation (Commit `19aca97`). |
| **T11**| **Automated Testing Suite** | **DONE** | Fixed test harness path bug in `verification/browser-harness.cjs` making `npm run test:repair` pass portably (Commit `39c1305`). Added `src/tests/serverless_security.test.ts` testing host validation, SSRF, CORS, and secrets scanner (Commit `6f3deb4`). Unified test suite passing 100%. |

---

## 2. Commit & Diff Summary

Seven atomic commits were authored on branch `fix/main-round-2`:

```
6f3deb4 fix(M-07): add security tests for serverless endpoints and scanner
19aca97 fix(M-06): add proposed database and storage hardening migrations
903097f fix(M-05): untrack root archives, dist artifacts and test bloat
74e990b fix(M-04): add secrets check script and fix dependency placement
39c1305 fix(M-03): fix hardcoded workstation path in test harness
f0066eb fix(M-02): restrict cors and add response limits to place resolver
7af284c fix(M-01): patch host header poisoning in serverless functions
```

### Detailed Breakdown of Changes

#### 1. Commit `7af284c` — `fix(M-01): patch host header poisoning in serverless functions`
* **Affected Files**: `api/share.ts`, `api/sitemap.ts`
* **Vulnerability Fixed**: Host Header Injection / Poisoning. Previously, regex `/^[a-z0-9-]+\.vercel\.app$/i` allowed any attacker-controlled Vercel deployment (e.g. `evil-attacker.vercel.app`) to reflect into `<link rel="canonical">`, `<meta property="og:url">`, and sitemap `<loc>` tags, poisoning search crawler caches.
* **Remediation**: Removed wildcard Vercel matching. Replaced with strict exact allowlist: `www.dalilaak.com`, `dalilaak.com`, and localhost development hosts. Unmatched host headers automatically fall back to canonical `https://www.dalilaak.com`.

#### 2. Commit `f0066eb` — `fix(M-02): restrict cors and add response limits to place resolver`
* **Affected Files**: `api/google-place-resolver.ts`
* **Vulnerability Fixed**:
  1. Overly permissive CORS (`Access-Control-Allow-Origin: *`) allowed unauthorized third parties to proxy requests through Dalilak's endpoint.
  2. SSRF private IP check lacked coverage for `172.16.0.0/12` (RFC 1918).
  3. No upstream response size ceiling existed, exposing the serverless function to memory exhaustion.
* **Remediation**:
  1. Implemented `getAllowedOrigin(req.headers.origin)` strictly allowing `dalilaak.com` origins and local development.
  2. Added `/^172\.(1[6-9]|2[0-9]|3[0-1])\./` to `isPrivateOrLocalIp()`.
  3. Enforced a 5 MB buffer limit (`MAX_RESPONSE_BYTES = 5 * 1024 * 1024`) with `ArrayBuffer` chunk tracking, aborting on oversized upstream payloads.

#### 3. Commit `39c1305` — `fix(M-03): fix hardcoded workstation path in test harness`
* **Affected Files**: `verification/browser-harness.cjs`
* **Bug Fixed**: In Round 1, `npm run test:repair` failed with `Error: Cannot find module 'C:/Users/Ahmed/AppData/Local/ms-playwright/...'`.
* **Remediation**: Replaced hardcoded developer-specific workstation directory with a portable resolution (`require('@playwright/test')`), making `npm run test:repair` pass 100% across all environments.

#### 4. Commit `74e990b` — `fix(M-04): add secrets check script and fix dependency placement`
* **Affected Files**: `package.json`, `scripts/check-no-secrets.cjs`
* **Hygiene Fixed**:
  1. Moved build tools (`@tailwindcss/vite`, `@vitejs/plugin-react`, `vite`) from production `dependencies` to `devDependencies`.
  2. Removed dead dependency `@vercel/og` (`api/biz-og.ts` uses `@resvg/resvg-js`).
  3. Added `scripts/check-no-secrets.cjs` scanning for Google API keys, Supabase service_role keys, JWT tokens, and 14-digit Egyptian national IDs.
  4. Added `npm run check:secrets` and unified `npm test`.

#### 5. Commit `903097f` — `fix(M-05): untrack root archives, dist artifacts and test bloat`
* **Affected Files**: `.gitignore`, `api.zip`, `docs.zip`, `package.zip`, `src.zip`, `dist/index.html`
* **Hygiene Fixed**: Untracked 4 root backup ZIP archives and committed `dist/index.html` via `git rm --cached`. Updated `.gitignore` to permanently ignore archives (`*.zip`, `*.dump`, `*.bak`), credential batch scripts (`*.bat`), and session directories (`auth/`, `session/`, `whatsapp-auth/`).

#### 6. Commit `19aca97` — `fix(M-06): add proposed database and storage hardening migrations`
* **Affected Files**: `supabase/proposed-migrations/001_directory_baseline_schema.sql`, `supabase/proposed-migrations/002_directory_rls_hardening.sql`
* **Security Added**:
  - `001_directory_baseline_schema.sql`: Canonical schema definition, constraints, and composite indexes for `businesses`.
  - `002_directory_rls_hardening.sql`: Hardened Row Level Security policies disallowing anonymous inserts/updates/deletes, allowing anonymous SELECT only for verified active listings, and restricting `business-media` bucket uploads to `service_role`. Both migrations include headers with purpose, risk, and rollback instructions.

#### 7. Commit `6f3deb4` — `fix(M-07): add security tests for serverless endpoints and scanner`
* **Affected Files**: `package.json`, `src/tests/serverless_security.test.ts`
* **Tests Added**: Added 8 automated unit tests covering host header poisoning prevention, SSRF private IP blocking, CORS origin reflection, and secrets scanner pattern detection. Wired to `npm run test:security` and `npm test`.

---

## 3. Before / After Test Verification Table

| Test Suite / Command | Round 1 (Before) | Round 2 (After) | Status | Notes |
| :--- | :---: | :---: | :---: | :--- |
| `npm run check:secrets` | *Not present* | **PASS** (0 secrets found) | **NEW / PASS** | Validates 0 exposed API keys, tokens, or national IDs. |
| `npx tsc --noEmit` | **PASS** | **PASS** | **PASS** | Zero TypeScript compilation errors. |
| `npm run build` | **PASS** | **PASS** | **PASS** | Vite production bundle builds in 3.7s. |
| `npm run test:map` | **PASS** (42/42) | **PASS** (42/42) | **PASS** | All camera, marker, and taxonomy tests pass. |
| `npm run test:safety-net` | **PASS** (19/19) | **PASS** (19/19) | **PASS** | All baseline regression and repair behaviors pass. |
| `npm run test:repair` | **FAIL** (Cannot find module) | **PASS** (100% verified) | **FIXED / PASS** | Fixed workstation path in `browser-harness.cjs`. |
| `npm run test:map:unit` | **PASS** (11/11) | **PASS** (11/11) | **PASS** | Vitest map repair unit tests pass. |
| `npm run test:security` | *Not present* | **PASS** (8/8) | **NEW / PASS** | Verifies host validation, SSRF, CORS, & scanner. |
| `npm run test:seo` | **PASS** | **PASS** | **PASS** | Verifies sitemap, meta tags, and crawler snapshots. |
| `npm test` | *Not present* | **PASS** (80/80 total) | **NEW / PASS** | Runs map, safety-net, unit, security, and SEO tests. |

---

## 4. Behavior Changes

1. **Serverless Host Header Behavior**:
   - `api/share.ts` and `api/sitemap.ts` no longer trust arbitrary `X-Forwarded-Host` or `Host` headers matching `*.vercel.app`.
   - If an unexpected host is received (e.g. from an attacker or crawler proxy), the response safely falls back to `https://www.dalilaak.com`.
2. **Google Place Resolver CORS Behavior**:
   - `api/google-place-resolver.ts` no longer returns `Access-Control-Allow-Origin: *`.
   - Incoming cross-origin requests from non-Dalilak origins receive `Access-Control-Allow-Origin: https://www.dalilaak.com`, preventing unauthorized third-party sites from using the resolver as an open proxy.
3. **Google Place Resolver SSRF Range**:
   - Requests attempting to resolve hostnames resolving to `172.16.0.0/12` are now blocked alongside `10.0.0.0/8`, `192.168.0.0/16`, `169.254.0.0/16`, and loopback addresses.
4. **Package Dependencies**:
   - Build-time dependencies are no longer categorized as runtime dependencies in `package.json`.

---

## 5. New Risks & Considerations

1. **New Hostnames**:
   - If Dalilak is ever deployed under a new custom domain (e.g., a staging domain `staging.dalilaak.com`), that domain must be explicitly added to `ALLOWED_HOST_EXACT` in `api/share.ts`, `api/sitemap.ts`, and `getAllowedOrigin` in `api/google-place-resolver.ts`.
2. **Database Migration Execution**:
   - The proposed migrations in `supabase/proposed-migrations/` have not been executed on any live database (as required by Hard Rule 2). When the database owner applies `002_directory_rls_hardening.sql`, any unauthenticated direct inserts from legacy scripts will be rejected.

---

## 6. Owner Actions Needed

1. **Execute Proposed Database Migrations**:
   - Review and execute `supabase/proposed-migrations/001_directory_baseline_schema.sql` and `supabase/proposed-migrations/002_directory_rls_hardening.sql` in the Supabase Dashboard SQL Editor.
2. **API Key Rotation**:
   - Rotate the legacy Google Places API key in Google Cloud Console if it was ever exposed in earlier git history, and restrict the new key in the Google Cloud Console to Dalilak's Vercel deployment IP / HTTP referrer.
3. **WhatsApp Business Cloud API (Blocked Transition)**:
   - To transition from static `wa.me/` links to an automated interactive bot, register an official Meta WhatsApp Business App, obtain system user access tokens, and configure webhook verification endpoints.

---

READY FOR ROUND 3
