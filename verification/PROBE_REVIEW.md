# Probe integrity review — Task 0
Reviewed current verification/run.ts, lib/harness.ts, tz-probe.ts and src/tests/repair.test.ts. Existing results were read, not rerun. No versioned authoring history for untracked verification files was supplied. Therefore **whether an assertion was weakened during authoring is indeterminate for every probe**; current strength does not establish historical integrity. Need pre-edit probes/diffs to resolve that question.

| Probe | Current discriminating strength and limitations |
|---|---|
| BE-01 | Real handler, positive public control and negative HTTP/body assertions. Discriminates draft disclosure. Stops at first failure, so baseline result establishes draft only, not every negative variant. Mock does not enforce upstream visibility filters; RLS is untested. |
| BE-02 | Negative 404 assertions discriminate. Positive assertion only `!=404`: 500, undefined or bad redirects pass. No image validity/content check. |
| BE-03 | Real handler 503/no-store/no business URLs discriminates error semantics; no success control here. |
| BE-03b | Duplicate strict subset of BE-03, not independent coverage. |
| BE-04 | Weak pagination model: respects requested Range without actually capping its size. Counts `/biz/` occurrences, not unique expected IDs. Duplicates can replace missing records. More-than-one fetch asserted but not correct ranges. |
| BE-04b | Same missing server cap and uniqueness weakness; even request-count assertion omitted. Duplicate coverage. `Number(toRaw) ?? ...` does not catch NaN. |
| BE-05 | Real stream cancellation and byte ceiling discriminate full buffering. Does not assert image fetch occurred, minimum bytes, or useful fallback; unconditional cancellation of every image passes. Need valid-small-image positive control. |
| BE-05b | Weak: zero bytes also passes when photo fetch never occurs. No fetch/status/fallback assertion. Baseline already passes; not evidence of a repair. |
| BE-06 | Mock returns raw 302 regardless of redirect mode, unlike native fetch automatic redirect behavior. Baseline failure is 200 versus 4xx, NOT observed internal access. Deny-all implementation passes. Needs allowed redirect control and faithful automatic redirect emulation/local transport. |
| BE-06b | Same mock limitation, no positive fetch control, passes baseline: non-discriminating for repair, no exploit proof. |
| BE-07 | Good mixed allow/deny inputs for actual exported helper. Baseline fails because export missing: does not prove old validator defect. Handler integration, ports and redirect paths untested. |
| BE-08 | Actual function, useful negative cases, always-closed implementation passes this probe alone. BE-08b supplies positive controls. |
| BE-08b | Actual function with positive/negative boundaries. Discriminates always-open/closed; baseline stops at first failed case; does not independently prove every format broken. |
| BE-09 | Actual function child process, explicit positive/negative expectations across zones; meaningful DST probe. Existing results inherited, not rerun. |
| BE-09b | Only positive cases; baseline always-open behavior passes. Non-discriminating, exclude from repair evidence. |
| BE-10 | Actual merge/equality helpers, meaningful unit assertions; missing baseline module is not old-logic proof. No REST/realtime interleaving, subscriptions/cache persistence or browser favorites. Key-order comparison only logged, not asserted; finding rather than B3 failure. |
| BE-11 | Actual eligibility function mixed controls; missing baseline module not defect proof. Does NOT establish single shared rule or all consumers using it. |
| BE-12 | Actual filter with positive base control and negative toggles; all-reject-on-any-toggle can pass. No positive matching records per toggle. Does NOT prove UI uses predicate or single pipeline; baseline missing-module failure irrelevant. |
| BE-13 | Actual helpers, malformed/legacy/custom examples discriminate; semantic check only `includes(id)` weakly permits junk. No router/history/canonical HTTP integration. Comment references U3/U4, probe does not test them. |

## Harness and repair-suite findings
- Fetch mock does not assert route consumption, HTTP method, signal, timeout, header correctness, or native redirect semantics.
- mockRes defaults status to undefined rather than native 200; BE-02 positive arm permits undefined.
- Count 19 includes duplicate/subset/non-discriminating probes; 19/19 is not 19 independent repairs.
- Phone regex/normalizer in repair.test.ts tests its own copy, not the form: tautological as integration evidence.
- Accessible dialog/map/GPS hook tests only typeof=function: do not exercise any hook behavior.
- BE-10 cannot prove B4 ordering; BE-11 cannot prove A1 architecture; BE-12 cannot prove A5 integration.
- No evidence sufficient to accuse an author of weakening assertions; current weaknesses are documented independently.
