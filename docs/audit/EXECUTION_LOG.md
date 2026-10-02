# Map Repair Execution Log

Branch: `fix/map-full-repair` (created from local `main` at `5c24236`; upstream main was `origin/main` at that commit).  
No `docs/audit/07-decisions.md` was present; use the defaults from the execution request and `06-repair-plan.md`.  
This log is the continuation point after context resets. Update after each batch.

## Current status — Batch 2b and Batch 3 complete locally; remote checkpoint publishing blocked

- Step 0 reading: audit reports 01–06, project `TECH_LOG.md`, `DEFINITION.md`, `CORE_DIRECTIVE.md`, `package.json`, and `vercel.json` reviewed. Source files cited by 06 were inspected against current code. `CameraController` remains unimplemented; Batch 1 introduced the zoom policy and viewport snapshot.
- Decision defaults applied: overview remains city-wide below zoom 15; local LOD starts at 15.5; selected result retains surrounding search context; outside-zone suggestions get an explicit all-zones action; excluded selection remains a context card outside result count; current map remains primary; no results tray, tile switch, backend viewport API, Canvas/WebGL or `directory-experience` changes.
- Existing history replayed onto requested branch: `28b7c96` (audit 01–06), `5ac56c0` (prior Batch 0 tests), `3b7fa69` (prior claimed Batches 1–6). The prior “complete” commit does **not** implement the target single-source state/pipeline/ZoomPolicy/CameraController; its Batch 0 assertions include mocked logic. Treat it as inherited code under verification, not as completion evidence.
- `docs/audit/06a-reconciliation.md` written. RC-01/02/03/05/06 are already fixed or intentional; RC-04 remains broad address substring matching; RC-07 duplicate gate catalogs conflict on served-zone data and is held for an explicit data decision.
- Batch 0 changed test/tooling only: added Vitest, Playwright Test, `@types/node`, map-specific unit/E2E entry points and three mobile browser scenarios; adjusted legacy U3 navigation to `domcontentloaded` so it tests browser history rather than network idle/load timing.
- New unit suite has 6 production-linked map contracts passing after Batch 2a. Search/filter/selection UI persistence, selected isolation, pan stability, popup cleanup, stale building request and GPS-vs-gesture still need browser-level or direct production-side-effect tests; current legacy SAFETY-03/04/05/06/07/09 tests locally mock the behavior and are not proof.
- New E2E suite: 3/3 pass on installed Chrome at 390×844 and 360×640. Coverage confirms map visibility during search entry, no horizontal overflow at narrow viewport, and retained query when dismissing suggestions via outside click. This does not yet assert marker contents or camera motion because live directory fixtures are not deterministic in this harness.
- Batch 1 added `src/utils/mapZoomPolicy.ts` and `MapViewportSnapshot` in `src/components/map/state/mapViewport.ts`. Zone filtering, camera planning and pin presentation use the centralized 15.0 / 15.5 policy. Filtering and rendering now use the same settled viewport snapshot (center, zoom, bounds, size, revision); search-dependent visibility memo also invalidates when snapshot or map zoom changes.
- Batch 1 checks passed: lint; map unit 4 passed + RC-04 expected failure; map suite 42/42; legacy safety 19/19; mobile E2E 3/3; full `test:repair` including U3/U4/U7/B4 and preview 13/13; production build to isolated output.
- Bundle size vs baseline: InteractiveMap 144.93 → 145.42 kB (+0.49 kB; gzip +0.21 kB); entry 185.51 → 185.93 kB (+0.42 kB; gzip +0.14 kB). Buildings chunk unchanged at 937.87 kB / 97.46 kB gzip.
- Batch 2a search repairs: map suggestions use the public searchable catalog rather than only category-filtered pins; explicit text matching ignores residual category filters; selection remains as a context marker while its search query matches; an explicit “عرض في كل المناطق” action clears the selected zone and selects that business. Selection keeps the query. Building drawer and building-result counts now use exact parsed address identity plus a 90m geospatial radius for nearby context, never name digit substrings.
- Batch 2a validation passed: lint, map unit 6/6, map suite 42/42, safety contracts 19/19, full `test:repair`, E2E 3/3, production build. Bundle: InteractiveMap 146.05 kB (39.08 gzip), entry 185.94 kB (52.40 gzip); buildings chunk unchanged.
- Batch 2b introduced the `mapStateReducer` as the `InteractiveMap` interaction snapshot for query, zone, category, selected activity/expanded state, and viewport. Parent-controlled search/filter values sync into this reducer; map handlers dispatch through it. The selected bottom drawer now contains contextual quick actions only, leaving the selected pin as the visible identity card. Seven map/state tests passed at the 2b checkpoint. The viewport reducer hookup and CameraController use the same map hook; for a buildable checkpoint those tightly related changes are committed together with Batch 3.
- Batch 3 added the sole Leaflet camera mutation owner `CameraController`, priority arbitration (selection > building/route/locate > cluster > zone > initial), and pointer/drag cancellation of in-flight camera commands. All non-test application calls to Leaflet `flyTo`, `flyToBounds`, `fitBounds`, `panTo`, `panBy`, `zoomIn`, and `zoomOut` now occur only in that controller. Camera unit test verifies preemption and gesture cancellation.
- Combined 2b/3 validation passed: lint; unit 8/8; map suite 42/42; legacy safety 19/19; E2E 3/3; full `test:repair` including browser U3/U4/U7/B4 and 13 preview checks; production build. Bundle currently 150.07 kB InteractiveMap (40.44 gzip) vs clean baseline 144.93 (+5.14 kB, +1.88 gzip); entry 185.94 kB (52.40 gzip) vs 185.51 (+0.43 kB, +0.14 gzip); large coordinates chunk unchanged.

### Baseline before new fixes

- `npm ci`: **failed** after dependency extraction at Windows `EPERM spawn` while lifecycle scripts attempted to start child processes. `npm ci --ignore-scripts`: **passed**, 234 packages. Later builds/tests requiring esbuild/Chrome passed when run with the approved elevated process capability.
- `npm run build -- --outDir .baseline-dist`: **passed** on Vite 6.4.3, 11.16s; output was isolated from tracked `dist`. Existing warning: `hadayekBuildingsCoords` chunk 937.87 kB (97.46 kB gzip); app JS chunks sum/paths recorded in baseline build output.
- `npm run lint`: initial clean-worktree baseline passed; after adding Vitest, missing `@types/node` produced existing test/server typing errors. Added `@types/node`; lint passed again.
- `npm run test:map`: **passed**, 42/42.
- `npm run test:safety-net`: **passed**, 9/9 baseline + 10/10 target assertions; source review shows several target tests simulate logic locally and do not exercise production effects.
- `npm run test:repair`: **passed** in serialized run: TypeScript, safety net, map 42/42, activity/progressive/spatial/data suites, browser U3/U4/U7/B4 4/4, preview 13/13. U3 passed after changing its navigation wait condition.
- `npm run test:map:unit`: now 6/6 pass after Batch 2a fixed the expected building address association failure.
- `npm run test:map:e2e`: 3/3 passed against installed Chrome; first run exposed missing browser binary under Playwright, so config now uses the machine's Chrome installation.
- Bundle baseline: `.baseline-dist/assets/InteractiveMap-CTDG5AcE.js` 144.93 kB (38.56 kB gzip); `index-BESPZDY6.js` 185.51 kB (52.26 kB gzip).
- Build after Batch 0 tooling changes passed to `.batch0-dist`; browser app bundle unchanged versus baseline (InteractiveMap 144.93 kB, entry 185.51 kB; no production dependency imported by app bundle). Temporary outputs were removed.
- Batch 0 commit `8188955` and local tag `map-batch-0-done` created. Direct SSH push failed with Windows `couldn't create signal pipe, Win32 error 5`. Escalated `git push` was rejected by auto-review because destination ownership/trust was not verified; no workaround attempted. `vercel` and `gh` CLIs are absent, so preview and PR are not available from this environment without a trusted publishing route.

## Batch ledger

| Batch | Status | Commit/tag | Verification | Notes |
|---|---|---|---|---|
| 0A reconciliation | done | `8188955` + local tag `map-batch-0-done` | source checks in `06a-reconciliation.md` | RC-04 live; RC-07 unresolved data conflict. |
| 0B safety net | complete locally | `8188955` + local tag `map-batch-0-done` | lint/build/map/safety/repair/unit/browser passed as listed above | Some matrix contracts still depend on simulated behavior in legacy suite. Push/preview blocked. |
| 1 ZoomPolicy + viewport + visible-pin pipeline | complete locally | `a92217e` + local tag `map-batch-1-done` | lint/build/map/safety/repair/unit/browser passed | Preserves 15/15.5 behavior. |
| 2a Search scope | complete locally | `8ce22e6` + local tag `map-batch-2a-done` | lint/build/map/safety/repair/unit/browser passed | Search uses public catalog; selection stays context; building association exact address or ≤90m proximity. |
| 2b State reducer + selection presentation | complete locally | combined checkpoint with Batch 3, pending commit/tag | combined verification listed above | Pin remains identity card; drawer retains quick actions without repeated identity block. Reducer carries query/filter/selection/viewport. |
| 3 CameraController | complete locally | combined checkpoint with Batch 2b, pending commit/tag | combined verification listed above | All production camera mutations centralized; user pointer/drag cancels active flight and priority ordering is enforced. |
| 4 Group/cull/marker registry | not started | — | — | Preserve dots/cards/clusters/chooser/selected isolation. |
| 5 Mobile/overlay/accessibility | not started | — | — | Keep map primary; no results tray or layer-control scope expansion. |
| 6 Dedup/dead code | not started | — | — | Delete only after import-graph proof and tests; gate catalog awaits served-zone decision. |

## Required checkpoint template

For every batch, record: code/tests changed, before/after results, build/lint/all-suite status against baseline, emitted bundle delta, commit SHA, tag, push result, Vercel preview check/log/URL, decision, and anything skipped. If a checkpoint is blocked, record the exact command/error and continue independent work only where safe. Never claim a batch complete if one required checkpoint is unresolved.

## Later batch detail

- Batch 4 commit `8d540bb48e6ca0248bd5e752d49140b08099851b`, tag `map-batch-4-done`. `useMapPinsClustering` consumes a pure visible-pin pipeline: viewport-culled groups, singleton/cluster targets, and card/dot presentation after selected-business isolation. Existing 58px projected grouping, 100m ground guard, 3 prominent overview cards, collision dimensions and 15.5 local presentation policy are preserved. Added two pipeline tests.
- Batch 4 checks: lint; map unit 10/10; map suite 42/42; legacy safety 19/19; full `test:repair`; E2E 3/3; production build. InteractiveMap bundle 150.42 kB / 40.63 gzip (Batch 3: 150.07 / 40.44; baseline 144.93 / 38.56). Entry 185.94 / 52.40; coordinates chunk unchanged 937.87 / 97.46 gzip.
- Batch 5 changes: quick category chips; suggestion height tracks the on-screen keyboard; safe-area top padding; map zoom controls stack above suggestions; touch targets >=44px; drawer bottom safe area; view mode exposes existing GPS flow through a locate control (zoom remains 17). Browser regression proves zoom works with query active and query remains intact.
- Batch 5 checks: lint; map unit 10/10; full `test:repair` including U3/U4/U7/B4 and 13 preview checks; E2E 4/4 at 390x844 and 360x640; final build.
- Batch 6 uses browser-native IndexedDB instead of adding `idb-keyval`. It reads/migrates `dalelak_directory_cache`, and writes to localStorage only as a fallback when IndexedDB is unavailable. Existing public-business sanitization is retained.
- Batch 6 checks: lint; full `test:repair`; E2E 4/4; production build. Final bundle: InteractiveMap 152.11 kB / 41.01 gzip (baseline +7.18 / +2.45 gzip); entry 187.59 / 52.96 (baseline +2.08 / +0.70); coordinates chunk unchanged.
- Deferred from plan 06: three-position gesture-driven sheet, recent-search UI, ARIA virtual pin list, cache expiry policy and database recommendation SQL. No deletion where source/test/runtime consumers remain: `MapFooterBar` is used by picker; `pinDispersal` and `districtLabelPosition` have test consumers; `markerReconciliation` supplies live icon-key logic. `directory-experience` was left untouched per user instruction. Official/atlas gate served-zone disagreement remains unresolved.
- Batch 4–6 push, preview and PR remain unavailable under the previously recorded publishing block. No publish retry was made.
