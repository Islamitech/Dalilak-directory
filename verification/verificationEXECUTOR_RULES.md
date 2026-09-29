EXECUTOR RULES (binding for every task)

1. SCOPE LOCK: you may edit ONLY the files listed as ALLOWED in the task. Any other file is forbidden, including "harmless" cleanups, formatting, renames and dependency changes. If you believe another file must change, STOP and ask me; do not decide alone.
2. TEST FIRST: for each fix, first write a real test that imports the real function/component (no copied regex, no typeof/existence-only checks, no mocking the thing under test). Run it and show that it FAILS on the current code. Only then fix. Then show it PASSES.
3. NO WEAKENING: never edit, delete, skip, or loosen an existing test or assertion to make something pass. If an existing test breaks, report it and ask.
4. NO SHORTCUTS: no TODO, no placeholders, no stubbed functions, no "left as future work", no commented-out code. Every item in the task must be fully implemented or explicitly reported as NOT DONE with the reason.
5. NO ASSUMPTIONS: if a database column, env variable, or behavior is unknown, ask me. Do not invent.
6. MINIMAL DIFF: change the smallest amount of code that fixes the defect. Do not refactor.
7. EVIDENCE OR IT DID NOT HAPPEN: you may write "fixed" or "passes" only for things you actually ran, and you must paste the command and its output. Never write "should work".
8. DEFINITION OF DONE (all must be true): (a) new test failed before, passes after; (b) `npx tsc --noEmit` passes; (c) all existing suites pass (test:map, test:repair, preview tests, plus your new tests); (d) `git diff --stat` shows ONLY allowed files; (e) no secrets printed anywhere.
9. Do not commit, do not deploy, do not touch the database, do not read the whole repo. Read only the files you need.
10. FINAL REPORT format: for every item -> STATUS (DONE / NOT DONE / BLOCKED), files+lines changed, the failing-before output, the passing-after output. End with `git diff --stat` output. Then STOP and wait for me.