# Map Repair Execution Log

Branch: `fix/map-full-repair` (created from local `main` at `5c24236`; upstream main was `origin/main` at that commit).  
No `docs/audit/07-decisions.md` was present; use the defaults from the execution request and `06-repair-plan.md`.  
This log is the continuation point after context resets. Update after each batch.

## Current status — Batch 0, safety net established; checkpoint publishing pending

- Step 0 reading: audit reports 01–06, project `TECH_LOG.md`, `DEFINITION.md`, `CORE_DIRECTIVE.md`, `package.json`, and `vercel.json` reviewed. Source files cited by 06 were inspected against current code; `ZoomPolicy`, `MapViewportSnapshot`, and `CameraController` do not exist in the inherited implementation. Focused full-path review remains ongoing for UI/test fixtures and deleted-code decisions.
- Decision defaults applied: overview remains city-wide below zoom 15; local LOD starts at 15.5; selected result retains surrounding search context; outside-zone suggestions get an explicit all-zones action; excluded selection remains a context card outside result count; current map remains primary; no results tray, tile switch, backend viewport API, Canvas/WebGL or `directory-experience` changes.
- Existing history replayed onto requested branch: `28b7c96` (audit 01–06), `5ac56c0` (prior Batch 0 tests), `3b7fa69` (prior claimed Batches 1–6). The prior “complete” commit does **not** implement the target single-source state/pipeline/ZoomPolicy/CameraController; its Batch 0 assertions include mocked logic. Treat it as inherited code under verification, not as completion evidence.
- `docs/audit/06a-reconciliation.md` written. RC-01/02/03/05/06 are already fixed or intentional; RC-04 remains broad address substring matching; RC-07 duplicate gate catalogs conflict on served-zone data and is held for an explicit data decision.
- Batch 0 changed test/tooling only: added Vitest, Playwright Test, `@types/node`, map-specific unit/E2E entry points and three mobile browser scenarios; adjusted legacy U3 navigation to `domcontentloaded` so it tests browser history rather than network idle/load timing.
- New unit suite: 4 contracts pass and one explicit `it.fails` documents current loose building-name substring association. Search/filter/selection persistence, category/search collision, selected isolation, pan stability, stale building request and GPS-vs-gesture still need higher-fidelity fixtures; current legacy SAFETY-03/04/05/06/07/09 tests locally mock the behavior and are not proof. Keep Batch 0 open until these matrix scenarios are covered by production-linked tests or document the tested constraints precisely.
- New E2E suite: 3/3 pass on installed Chrome at 390×844 and 360×640. Coverage confirms map visibility during search entry, no horizontal overflow at narrow viewport, and retained query when dismissing suggestions via outside click. This does not yet assert marker contents or camera motion because live directory fixtures are not deterministic in this harness.

### Baseline before new fixes

- `npm ci`: **failed** after dependency extraction at Windows `EPERM spawn` while lifecycle scripts attempted to start child processes. `npm ci --ignore-scripts`: **passed**, 234 packages. Later builds/tests requiring esbuild/Chrome passed when run with the approved elevated process capability.
- `npm run build -- --outDir .baseline-dist`: **passed** on Vite 6.4.3, 11.16s; output was isolated from tracked `dist`. Existing warning: `hadayekBuildingsCoords` chunk 937.87 kB (97.46 kB gzip); app JS chunks sum/paths recorded in baseline build output.
- `npm run lint`: initial clean-worktree baseline passed; after adding Vitest, missing `@types/node` produced existing test/server typing errors. Added `@types/node`; lint passed again.
- `npm run test:map`: **passed**, 42/42.
- `npm run test:safety-net`: **passed**, 9/9 baseline + 10/10 target assertions; source review shows several target tests simulate logic locally and do not exercise production effects.
- `npm run test:repair`: **passed** in serialized run: TypeScript, safety net, map 42/42, activity/progressive/spatial/data suites, browser U3/U4/U7/B4 4/4, preview 13/13. U3 passed after changing its navigation wait condition.
- `npm run test:map:unit`: 4 passed, 1 expected failure (current building address association issue).
- `npm run test:map:e2e`: 3/3 passed against installed Chrome; first run exposed missing browser binary under Playwright, so config now uses the machine's Chrome installation.
- Bundle baseline: `.baseline-dist/assets/InteractiveMap-CTDG5AcE.js` 144.93 kB (38.56 kB gzip); `index-BESPZDY6.js` 185.51 kB (52.26 kB gzip); total emitted JS/assets as in clean build. Record exact final comparison after the final build.
- Build after Batch 0 tooling changes passed to `.batch0-dist`; browser app bundle unchanged versus baseline (InteractiveMap 144.93 kB, entry 185.51 kB; no production dependency imported by app bundle). Temporary outputs were removed.
- Vercel/PR/tag/push: not attempted. Remote `origin` exists; auth/CLI not checked yet.

## Batch ledger

| Batch | Status | Commit/tag | Verification | Notes |
|---|---|---|---|---|
| 0A reconciliation | done | pending combined Batch 0 commit | source checks in `06a-reconciliation.md` | RC-04 live; RC-07 unresolved data conflict. |
| 0B safety net | in progress | none | lint/build/map/safety/repair/unit/browser passed as listed above | More production-linked interaction coverage needed for conflict matrix cases. U3 timeout resolved by using DOM-ready navigation. |
| 1 ZoomPolicy + viewport + visible-pin pipeline | not started | — | — | Preserve 15/15.5 semantics. |
| 2a Search scope | not started | — | — | Keep surrounding pins and offer explicit all-zone action. |
| 2b State reducer + selection presentation | not started | — | — | Preserve Definition's selected pin and action drawer; eliminate duplicate name/actions without removing either role. |
| 3 CameraController | not started | — | — | User gesture cancels pending locate; apply requested priority; retain existing normal zone choreography. |
| 4 Group/cull/marker registry | not started | — | — | Preserve dots/cards/clusters/chooser/selected isolation. |
| 5 Mobile/overlay/accessibility | not started | — | — | Keep map primary; no results tray or layer-control scope expansion. |
| 6 Dedup/dead code | not started | — | — | Delete only after import-graph proof and tests; gate catalog awaits served-zone decision. |

## Required checkpoint template

For every batch, record: code/tests changed, before/after results, build/lint/all-suite status against baseline, emitted bundle delta, commit SHA, tag, push result, Vercel preview check/log/URL, decision, and anything skipped. If a checkpoint is blocked, record the exact command/error and continue independent work only where safe. Never claim a batch complete if one required checkpoint is unresolved.
