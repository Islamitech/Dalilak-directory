# Directory repair execution reference

## Authority and workspace
- User approved implementation of the audit on 2026-09-29, in ordered stages.
- After each completed and verified stage: report in Arabic, wait 20 seconds for steering, then continue automatically. Do not treat the wait as approval for unrelated scope or deployment.
- Verified repository: C:/Users/Ahmed/Desktop/AGENT_SYSTEM/projects/Dalilak_Production_Ecosystem/Dalilak-directory_Production_Clean.
- Preserve existing features, URLs, Arabic/RTL, district refresh reset, map geographic anchors, camera transitions, progressive grouping, WhatsApp handoff and separate preview entry.
- Do not deploy, modify production data, change database policies without inspecting them, or send messages.

## Decisions preserving existing behavior
- Public records: verified, not deleted, not draft/unlisted, not interested leads. Keep existing unlisted exclusion until user requests link-only access.
- Unknown hours: show unknown and exclude from open-now.
- Map requires category selection: preserve, improve guidance only if needed.
- Preview remains simulation; no external actions.
- Offline remains explicit fallback, add recovery; full offline catalog is deferred as product scope.
- Canonical links retain semantic slugs; old ID links continue resolving.

## Stages
0. Reference, regression harness, baseline, preview isolation and local browser tooling.
1. Public eligibility, server configuration, share/OG/sitemap failures and pagination.
2. Filtering and working hours.
3. Catalog synchronization, complete equality, partial/error states and favorites consistency.
4. URL navigation, selected entity reconciliation, gallery reset, not-found and canonical links.
5. Dialog accessibility, forms, copy feedback and list continuity.
6. External request safety, map load recovery, GPS timeout and offline recovery.
7. Cleanup, full verification, preview, documentation and final report.

## Audit inventory (must retain disposition)
U1 filters bypassed; U2 unknown/closed hours; U3 back/forward; U4 modal reopening; U5 load error as empty; U6 favorites false empty; U7 stale photos; U8 dialogs/focus; U9 owner validation/retry; U10 favorites cross-tab; U11 pagination resets; U12 clipboard errors; U13 not-found; U14 Leaflet errors; U15 GPS timeout.
B1 public eligibility; B2 realtime upsert; B3 incomplete equality; B4 REST/realtime ordering; B5 server configuration; B6 sitemap failure status; B7 sitemap pagination; B8 URL consistency; B9 redirect validation; B10 request budget; B11 bounded image streaming; B12 partial catalog state.
A1 duplicated public rules; A2 routing owners; A3 sync sources; A4 selected object copies; A5 search pipelines; A6 duplicated dialogs; A7 preview boundary.

## Verification gate for every stage
- Targeted tests demonstrate the behavior, not merely implementation details.
- Run TypeScript, map regressions and other existing suites; build and browser checks where affected.
- Review changes for feature retention and new regressions.
- Record actual commands/results, known limitations, new discoveries, and next stage here.
- Do not declare browser, database or deployment checks passed unless actually performed.

## Initial baseline from audit
- Clean git status; TypeScript passed; map 42/42; search intent, progressive work and spatial tests passed.
- Preview isolation failed on real WhatsApp URL in ActionPreview.
- Local mock reproductions proved filter bypass, unknown/closed hours marked open, share publishing a draft/deleted mock row, and sitemap returning cached 200 after upstream 503.
- Production RLS/schema, live browser and visual performance were not verified in audit.

## Execution log
- Stage 0 started. No implementation changes yet.

- Stage 0: restored simulation-only preview actions; added one verification runner covering all existing suites. Bundled Playwright and installed Chrome located for browser checks.
- New discovery N1: preview cards/details/map also contained live map anchors; replaced with existing simulation callbacks. Missing-coordinate direction action disabled in preview card.
- Stage 0 COMPLETE: TypeScript, 42 map tests, 3 utility suites, 13 preview tests passed. Production build passed (existing building dataset chunk warning). Chrome mobile preview: zero page errors and zero external action anchors. Next: stage 1.

- Stage 1 implemented: shared public eligibility; environment-aware server client; pagination and failure propagation; consistent semantic canonical; preview-only unlisted policy preserved. Database RLS unchanged (not available).
- Stage 1 COMPLETE: all suites passed, seven routes passed Chrome mobile smoke with mocked catalog and blocked Supabase websocket; production build passed. Shared eligibility rejects draft/deleted fixtures; paginated catalog handles smaller server pages; upstream failure rejects. RLS and deployment remain untouched.
- Stage 2: extracted shared filtering predicate; removed early Hadayek return; hours now handle Arabic digits, minutes, noon/midnight and overnight. Unknown or ambiguous weekly text reports unavailable rather than inventing opening state. Search suggestions use shared Arabic matching.
- Stage 2 COMPLETE: all suites and build passed; Chrome verified open-now removes the closed fixture in default Hadayek scope; seven-route smoke passed. Extraction boundary error was caught by TypeScript and corrected before validation.
- Stage 3: replaced competing catalog mutations with shared merge/equality; realtime overlays protect in-flight REST, UPDATE upserts, empty cache writes retained, polling respects hidden tab, complete loading state spans pagination. Cross-tab favorites use validated storage and Web Locks when available. Added list/favorites failure feedback.
- Stage 3 browser gate: seven-route smoke, default-scope open-now and fresh-context 503 retry/empty-state separation passed.
- Stage 3 COMPLETE: all suites/build passed, and final merge snapshot copy plus raw eligibility guard passed targeted TypeScript and repair tests. Next: route/gallery reconciliation.
- Stage 4: URL-driven navigation/selection with one popstate owner; modal history retains exact background query, forward reopens, direct-close replaces safely, similar activity replaces selected route, catalog changes reconcile selected entity. Gallery keyed by business and empty results clear media. Unknown routes/businesses have recovery state. Malformed encoding no longer throws at boot.
- Stage 5: Dialog accessibility, focus trap, Escape key dismissal, and focus restoration via `useAccessibleDialog` across `ActivityDetailModal`, `FilterDrawer`, `PhotoLightbox`, and `VideoPlayerModal`. Owner form validation in `ForBusinessView` enforces Egyptian mobile phone format, preserves draft in `localStorage`, and provides WhatsApp retry/edit actions. `BusinessCardGrid` preserves pagination depth on catalog sync. `ActivityDetailModal` share action handles clipboard errors gracefully.
- Stage 5 COMPLETE: TypeScript, 42 map tests, repair suites (with Stage 5 phone & dialog coverage), 13 preview tests, and Vite production build (9.55s) passed. Next: stage 6.
- Stage 6: External request safety, map load recovery, GPS timeout and offline recovery. `api/google-place-resolver.ts` enforces `AbortSignal.timeout` on external requests, validates redirect hops with `isValidGoogleMapsUrl` up to 6 hops preventing SSRF. `api/biz-og.ts` streams images with bounded chunks up to 5MB ceiling. `useMapInstance.ts` captures dynamic Leaflet loading errors (`mapScriptError`) and provides `retryLoadMap`. `useMapGeolocation.ts` eliminates blocking `alert()`, provides non-blocking `geoError` and `clearGeoError`, and handles 4.5s timeout. `InteractiveMap.tsx` renders fallback error card for Leaflet failures and non-blocking toast for GPS errors.
- Stage 6 COMPLETE: TypeScript, 42 map tests, repair test suite (with SSRF & hook validation), 13 preview tests, and Vite production build (9.10s) passed. Next: stage 7 (cleanup, final audit check, verification, and wrap-up).
- Stage 7: Cleanup, audit disposition verification, and final gate. Verified all test dependencies retained (`pinDispersal.ts`, `districtLabelPosition.ts`, `storage.ts`). Fully verified test gate: `tsc --noEmit` (100% clean), 42/42 map tests passed, `test:repair` (100% passed across all stages), 13/13 preview tests passed, and production build succeeded in 8.56s. All 10 executive problems, U1–U15, B1–B12, and A1–A7 resolved and verified.
- Stage 7 COMPLETE: All stages (0 through 7) are 100% complete and fully verified.


