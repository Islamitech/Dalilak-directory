# Independent adversarial verification report

Date: 2026-09-29  
Scope: repaired tree versus `verification/baseline`; no source fixes and no commit.  
Verdict: **the “100% complete / all items resolved and verified” claim is false.** Important repairs work, but accessibility, map recovery, request timeout, publication projection, and owner-form failure handling remain incomplete.

## Evidence boundary

- The existing 19-probe suite and five-timezone Cairo run were not rerun. Their saved outputs are inherited evidence.
- I independently reviewed every probe, added stronger probes, ran Chrome at 390×844 and 1280×900, compared baseline and repaired behavior, and ran nine mutations in `verification/mutation-copy`.
- The detailed original audit was not supplied. Its U/B/A inventory came from `docs/REPAIR_EXECUTION_REFERENCE.md`; the executive report was supplied at `C:\Users\Ahmed\Downloads\FINAL_AUDIT_REPAIR_EXECUTIVE_REPORT.md`.
- “Yes” below means I reproduced the baseline defect. “Inherited” is prior saved evidence. “Not run” means no claim of reproduction.

## Highest-impact findings

1. **U8/A6 partial:** PhotoLightbox and VideoPlayerModal do not use `useAccessibleDialog`. Both let Tab leave, do not focus inside initially, and do not restore focus. Escape in PhotoLightbox also closed the parent activity dialog. Its opener is a non-focusable `div`.
2. **U14 not fixed:** the Leaflet error card appears, but Retry caused zero new script requests on mobile and desktop.
3. **B10 not fixed:** an OG image response that yielded one byte then stalled was still pending after 5.7 seconds, with no aborted signal. The timeout is cleared after headers, before body consumption.
4. **B1 partial/schema-dependent:** server projection omits `is_deleted` and `published_status`. A mock honoring the real `select` published deleted and row-level draft records with HTTP 200. Production RLS/schema was not inspected.
5. **U9 partial:** phone validation, WhatsApp target, draft, retry, and edit work. If `window.open()` returns `null`, the UI still claims the message opened.
6. **U1 overstated:** baseline did not bypass filters for normal `حدائق الأهرام`; it did for alias `هضبة الأهرام`. The original broad claim is a partial false positive.
7. **New:** `catalogsEqual` is key-order sensitive because it uses `JSON.stringify`.

## Probe integrity

Full notes: `verification/PROBE_REVIEW.md`.

| Probe | Assessment |
|---|---|
| BE-01 | Useful for draft disclosure, but stops at first failure and supplies fields the real query does not select. Does not prove every state or RLS. |
| BE-02 | Negative checks discriminate; positive case is weak because anything other than 404 passes. |
| BE-03 | Strong for 503/no-store/no business URLs. |
| BE-03b | Redundant subset of BE-03. |
| BE-04 | Weak cap model and occurrence counting; does not require unique IDs. Stronger capped-page test passed 73 unique IDs over five requests. |
| BE-04b | Same weakness; omits even the multi-request assertion. |
| BE-05 | Useful oversized-stream check, but rejecting every image can pass. No valid-small-image control. |
| BE-05b | Weak/non-discriminating: zero bytes passes if image is never fetched; baseline passes. |
| BE-06 | Redirect mock does not emulate native redirects. Baseline failure proves response semantics, not internal-host access. Deny-all passes. |
| BE-06b | Non-discriminating; passes baseline and has the same mock limitation. |
| BE-07 | Good helper vectors; missing baseline export does not prove exploitability. No handler positive redirect control. |
| BE-08 | Useful negatives; always-closed passes unless paired with BE-08b. |
| BE-08b | Useful positive/boundary cases. |
| BE-09 | Strong mixed Cairo DST vectors across host zones; result inherited. |
| BE-09b | Non-discriminating positive-only test; passes baseline. Excluded. |
| BE-10 | Useful helpers; missing baseline module proves no old defect. Does not cover App interleaving or tabs. |
| BE-11 | Useful rule vectors; cannot prove one rule or every consumer. Missing module proves no defect. |
| BE-12 | Weak positive controls; cannot prove UI integration or one pipeline. Missing module proves no defect. |
| BE-13 | Useful malformed/legacy/custom cases; semantic check merely `includes(id)`. No history/U3/U4 integration. |

No versioned pre-edit probe copy was available, so historical weakening after the ten failures is indeterminate. Current weaknesses are demonstrable; author intent is not.

The old `src/tests/repair.test.ts` duplicates the phone regex and only checks hook types. Mutation showed it still passes after removing U1, U3, U4, U7, and B4 fixes.

## Secrets

Full redacted list: `verification/SECRETS_REVIEW.md`.

- The hardcoded value is opaque `sb_publishable_…`, not JWT. It has no decodable `role` or `exp`. Role and expiry are unavailable from this token.
- 401 text files were scanned excluding `.git`/`node_modules`; values are redacted. Hits include env/example, built bundle, server/client Supabase files, and baseline API/client files.
- No credential was sent remotely. Live scope and RLS were not tested.

## Browser results

| Scenario | Result |
|---|---|
| a. details/back/forward/close | Pass mobile+desktop; exact background query preserved. |
| a. direct link close + refresh | Pass; modal stayed closed. |
| b. A photos → B no photos | Pass; A image did not persist. |
| c. ActivityDetailModal | Pass role/aria, trap, Escape, return. |
| c. FilterDrawer | Pass role/aria, trap, Escape, return. |
| c. PhotoLightbox | **Fail:** no initial focus, Tab escapes, no return, non-keyboard opener, Escape also closes parent. |
| c. VideoPlayerModal | **Fail:** no initial focus, Tab escapes, no return; role/aria and Escape exist. |
| d. 503 and favorites failure | Pass; retry/error shown, no false empty, then recovery. |
| e. two-tab favorites | Pass with Web Locks; no-lock fallback remains unverified/racy. |
| f. owner form | Partial; popup-blocked case falsely reports success. |
| g. Leaflet blocked | **Fail:** card appears, Retry sends zero new script requests. |
| g. slow/denied GPS | Pass in actual hook/map picker: visible nonblocking message, UI responsive, no alert. |
| h. offline | Fallback and recovery pass; favorites unavailable offline. Offline files match baseline after line-ending normalization, so this is not proven as a repair. |
| i. unknown/missing | Pass with explicit states. |

Expected failures from deliberately blocked analytics/fonts/images/map/websocket appear in logs. No application page exception appeared in successful targeted runs. First-pass state-leak harness errors were superseded by isolated checks.

## Traceability matrix

| ID | Baseline reproduction | Status | Evidence |
|---|---|---|---|
| U1 | No for normal area; yes for alias via mutation | Fixed-verified, audit overbroad | Shared filter; alias mutant fails, old suite misses it. |
| U2 | Yes via baseline-parser mutation; inherited BE-08/08b/09 | Fixed-verified | Mixed open/closed mutation fails. BE-09b excluded. |
| U3 | Yes mobile+desktop | Fixed-verified | Repaired history passes; mutation fails; old suite passes mutant. |
| U4 | Yes: direct modal reopened after refresh | Fixed-verified | URL-derived selection stays closed; mutation fails; old suite misses it. |
| U5 | Not run | Fixed-verified | Repaired 503 browser shows retry/error, not empty. |
| U6 | Not run | Fixed-verified | Favorites failure states retained saved context. |
| U7 | Yes: A image remained on B | Fixed-verified | Repaired browser and corrected mutation pass/fail; old suite misses it. |
| U8 | Not run | **Partial** | 2/4 dialogs pass; photo/video fail focus behavior. |
| U9 | Not run | **Partial** | Validation/draft/retry verified; blocked popup falsely succeeds. |
| U10 | Not run | Fixed-verified with limitation | Two-tab Web Locks scenario passes; no-lock fallback unverified. |
| U11 | Not run | Fixed-unverified | Preservation code exists; no depth browser test/mutation. |
| U12 | Not run | Fixed-unverified | Clipboard error code exists; browser path not exercised. |
| U13 | Malformed decode inherited; missing ID not baseline-compared | Fixed-verified | Repaired unknown/missing browser states pass. |
| U14 | Not run | **Not fixed** | Error state exists; Retry does not retry. |
| U15 | Not run | Fixed-verified | Slow/denied actual map runs pass. |
| B1 | Draft disclosure inherited; mutation catches rule removal | **Partial** | Shared rule exists; real projection omits possible guard columns; RLS unknown. |
| B2 | Yes: absent-ID UPDATE lost | Fixed-verified | Repaired App upserts; mutation fails. |
| B3 | Yes: description change ignored | Fixed-verified | Repaired cache changes; mutation fails; key-order issue remains. |
| B4 | Yes: stale REST overwrote realtime | Fixed-verified | Repaired overlay survives; mutation fails; old suite misses it. |
| B5 | Not run | **Partial** | Environment client exists, hardcoded publishable token remains; scope/RLS unchecked. |
| B6 | Inherited | Fixed-verified | 503/no-store inherited evidence; BE-03b duplicate. |
| B7 | Inherited | Fixed-verified | Stronger genuine-cap test passed 73 unique IDs/5 requests. |
| B8 | Helper inherited; browser history tested | Fixed-verified | Sample old-ID/malformed/history pass; not exhaustive canonicals. |
| B9 | No exploit; BE-06b passes baseline | **Partial** | Guards exist, but mocks do not establish exploit or complete defense. |
| B10 | Not run | **Not fixed** | OG image body remains pending beyond 5s. |
| B11 | Full buffer inherited; BE-05b passes baseline | Fixed-verified for size ceiling | Ceiling/cancel evidence; small positive and timeout gap remain. |
| B12 | Missing module is not proof | Fixed-verified current behavior | 503/partial/recovery exercised in Chrome. |
| A1 | Architectural | **Partial** | Shared rule exists; server can omit row flags; RLS uninspected. |
| A2 | Two baseline listeners; U3 reproduced | Fixed-verified | One repaired popstate owner; browser pass. |
| A3 | B4 race reproduced | Fixed-verified | Merge primitive and overlay exercised. |
| A4 | U4/U7 reproduced | Fixed-verified | Selection resolved from current URL/catalog. |
| A5 | Alias bypass mutation | Fixed-verified | One imported predicate; mutation discriminates. |
| A6 | Architectural | **Partial** | Hook used by 2/4 claimed dialogs; real failures. |
| A7 | Not rerun | Fixed-unverified | Code matches simulation boundary; 13/13 is inherited only. |

## Mutation sensitivity

All mutations were confined to `verification/mutation-copy` and restored.

| Item | Strong control | Mutant | Old suite without fix |
|---|---:|---:|---:|
| U1 | Pass | Fail | **Pass — worthless here** |
| U2 | Pass | Fail | Fail |
| U3 | Pass | Fail | **Pass — worthless** |
| U4 | Pass | Fail | **Pass — worthless** |
| U7 | Pass | Fail | **Pass — worthless** |
| B1 | Pass | Fail | Fail |
| B2 | Pass | Fail | Fail |
| B3 | Pass | Fail | Fail |
| B4 | Pass | Fail | **Pass — worthless** |

## Claim audit

Unsupported/overstated:

- “100% complete”, “all resolved/verified”, and “all new scenarios pass” conflict with U8/A6, U14, B10 and partial B1/B5/B9.
- “All dialogs use the hook” and complete focus behavior are false.
- “Leaflet recovery with retry” is false; only the error card works.
- External request safety is incomplete because OG body consumption outlives its timeout.
- Strict public eligibility cannot be claimed without selected guard columns and RLS/schema inspection.
- Owner-form failure handling does not detect blocked WhatsApp popup.
- Full preservation of all old/canonical URLs has sample evidence, not exhaustive coverage.

Supported with meaningful evidence: history/direct-close/gallery, realtime upsert/equality/order, sitemap status/pagination, Cairo hours, and nonblocking GPS.

Explicitly deferred/unverified: full offline catalog/favorites, unlisted link-only policy, RLS/schema/database, deployment/production.

## Stage verdicts

| Stage | Verdict | Confidence |
|---|---|---|
| 0 | Mostly verified; preview result inherited | Medium |
| 1 | Partial: eligibility projection/RLS/token gaps | High |
| 2 | Verified with narrowed U1 claim | High |
| 3 | Verified with no-lock/U11 limitations | High |
| 4 | Verified | High |
| 5 | Partial: two dialogs and popup-block flow fail | High |
| 6 | Partial: GPS passes; Leaflet retry and OG timeout fail | High |
| 7 | Failed as an acceptance claim | High |

## Product-owner decisions

- Whether `unlisted` is link-only or excluded.
- Whether offline remains recovery-only or caches favorites/catalog.
- Authoritative publication columns plus production schema/RLS review.
- Desired blocked-WhatsApp behavior.
- Whether Web Locks are required or a lock-free merge is needed.
- Whether all four dialogs must share the accessibility primitive, as the current requirement says.

## Preservation

- Evidence and screenshots are under `verification/` and `verification/evidence/`.
- SHA-256 recheck of 208 pre-captured files outside `verification` found **zero changed and zero missing**.
- The repository was already dirty before this review. No commit was created.

