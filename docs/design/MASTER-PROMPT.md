ROLE: Senior product engineer (React 19 / Vite / Tailwind 4 / Leaflet, Arabic RTL).
SCOPE: Dalilak-directory only (verify with `git remote -v`). Create branch `feat/prototype-experience`
from `refactor/ux-architecture`.
INPUTS: docs/design/prototype.html (design spec, NOT code to paste), docs/design/annotated-1.png and
annotated-2.png (owner's markup of what to remove), docs/refactor/*, reports/ux-round-2.md.
GOAL: convert the whole application to the prototype's experience, reusing the existing architecture,
real data and map logic. Change presentation, layout and composition only.

HARD RULES
1. Local commits only. No push, no history rewrite, no network calls to live services, no secrets printed,
   no DB access. SQL ideas = proposed files only.
2. Stage explicit paths only. One commit per step: feat(px-xx) / refactor(px-xx) / fix(px-xx).
   Moves use git mv and are separate commits from behavior changes.
3. Do NOT change: api/*.ts, vercel.json rewrites/headers, URL structure (/biz/:id, /?biz=, /map, /search,
   /about, /pricing, /for-business), sitemap/OG output, service worker strategy, SELECT column lists,
   map engine logic (camera controller, spiderfy, clustering, building/atlas logic), storage key names,
   marker HTML escaping.
4. After EVERY commit run and paste real results: npx tsc --noEmit && npm run build && npm test &&
   npm run test:ux:e2e && npm run check:architecture && npm run check:bundle && npm run check:secrets.
   If red, revert that commit and report. Never weaken a test or guard to make it pass; if a test must
   change, show the diff and justify it.
5. No new runtime dependencies. Icons: lucide-react (no Font Awesome, no CDN CSS/JS).
6. Never invent data: rating, review count, open/closed, offer chips appear ONLY if the real mapped model
   has those fields; the prototype's values are placeholders.
7. Reuse what exists: shared/ui (IconButton, Modal, Drawer, Toast, useAccessibleDialog), SearchField +
   useUnifiedSearch, UnifiedBusinessCard variants, useFavorites, useNetworkStatus, useMapGeolocation.
   Do not recreate them.
8. Anything needing an owner decision not covered below -> BLOCKED with options. Do not guess.

PHASE 0 AMENDMENTS (replace the matching items; evidence required as RAW command output):
a) Run `(git ls-files verification | Measure-Object).Count` and list tracked folders. git rm -r --cached
   verification/baseline, mutation-copy, vite-cache, evidence and any other copy of source/artifacts, but KEEP
   the scripts referenced by package.json (e.g. browser-harness.cjs). Add the rest to .gitignore. Also stop
   tracking screenshots under reports/evidence if they are large; keep a short index file instead.
d) UnifiedBusinessCard: remove nested interactive elements (no role=button container holding buttons).
e) First-load: print the exact modulepreload/script list of dist/index.html. atlas-geodata is currently
   preloaded, so it is NOT lazy: make district geodata a real dynamic import loaded when the map/atlas first
   opens, and re-show the preload list. Make HomeView eager (or preloaded) so first paint has no second
   waterfall. Report TOTAL first-load JS raw+gzip vs baseline 621.4/175.1 kB and FAIL the step if larger.
   Report whether supabase-vendor (222 kB) is needed before first paint; do not change if risky.
f) Guard: extend the physical-direction regex to ml-auto, mr-auto, ml-[..], mr-[..], left-[..], right-[..],
   left-full, right-full, float-left, float-right, rounded-tl/tr/bl/br, space-x-, divide-x-; allowlist
   centering idioms (left-1/2 with -translate-x-1/2) with comments.
g) Security: stripping `notes` inside businessMapper is NOT a fix. Print file:line of every SELECT string
   (catalogFetcher, directoryData, anything else) and whether `notes` is still requested; list all consumers
   (publicBusiness.ts publishedStatus, customDirectoryUrl, googleMapsUrl, googleRating, videos). If the UI
   needs them, write a proposed public VIEW as SQL (not applied) and mark the code change BLOCKED; do not
   break public eligibility. Print every literal `sb_publishable` occurrence with file:line; remove the
   hard-coded fallbacks and fail fast if env vars are missing, update .env.example, and add a
   sb_publishable literal check to check:secrets.
h) Favorites: merge useFavorites and useShowcaseFavorites into one hook; same key and same stored JSON
   shape as 716b654; add a test that reads data written in the old format. Also verify the IndexedDB name
   dalelak_catalog_db and any non-underscore key names (grep dalelak[-_.A-Za-z]*).
i) Prove with git grep which files under src/directory-experience/ are reachable from the production
   entry; if only sandbox/test, exclude them from the production bundle (separate commit).
j) Commit hygiene: explicit paths only; one concern per commit (not storage keys + guard + refactor
   together); paste raw outputs, not summaries.
Write docs/design/00-preflight.md with PASS/FAIL per item and real command outputs.

PHASE 1 - SPEC AND FEATURE MAP (docs only)
docs/design/00-prototype-spec.md: every token (colors, radii, shadows, motion, spacing, type), screen,
component, state and interaction in the prototype. docs/design/01-feature-map.md: prototype element ->
existing feature/file -> action (reuse / restyle / replace / drop / BLOCKED), including features the
prototype lacks (Hadayek atlas, building/street search, in-app navigation drawer, WhatsApp, share links,
for-business, pricing, about, offline page, theme toggle). Reflect all decisions D1-D6 and E1-E6 below.

OWNER DECISIONS (final, override anything else)
D1 REMOVE the notification button (red dot) and the account button. No placeholders.
D2 The map/list switch moves from the floating bottom pill to the TOP ROW, in the exact slot where the
   notification/account buttons were (visual left in RTL; logo stays on the right). It becomes an
   ICON-ONLY compact segmented control (map icon, list icon), no text, same position and size on BOTH
   pages, never overlapping content.
   - Remove the bottom floating pill and all bottom padding reserved for it (list 100px, map sheet
     offsets); re-check the map bottom sheet and the end of the list.
   - Active segment uses the amber fill; indicator is state-driven (CSS logical properties /
     ResizeObserver, no manual rect math); works in RTL and dark theme.
   - Each button: Arabic aria-label + title ("الخريطة" / "قائمة الأنشطة"), aria-pressed (or radiogroup),
     visible focus ring, hit area >= 44x44.
D3 EVERY other side/floating/secondary button becomes a simple square icon button in the old
   notification-button style (38-44px, border, soft hover, radius): theme toggle, Hadayek atlas,
   for-business, pricing, about, and map actions (locate me, fit all). Leaflet's native zoom +/- stays
   on the map. Max 2 visible mini buttons below 400px; the rest collapse into one "more" (...) button
   opening a menu/sheet (focus trap, Esc, aria-label). Every icon button has aria-label + title.
D4 DESKTOP/TABLET (remove the phone-frame mockup entirely):
   - >=1024px: full-width header (logo + name at the start side, wide search field, mini buttons at the
     end side, category bar beneath). Below: two panes, a fixed-width list panel (400-440px, scrollable,
     start side in RTL) + the map filling the rest. Both visible, so the map/list switch is hidden.
     Card select -> map flies to it and highlights the pin; pin select -> list scrolls/highlights the
     card; detail opens as a side panel/modal anchored to the list panel.
   - 768-1023px: mobile pattern with the icon switch, detail as a centered modal.
   - <768px: mobile pattern, full-bleed, dvh and safe-area insets.
   - Same components across breakpoints; only layout composition changes.
D5 KEEP the card look (icon tile, name, verified mark, category/area line, meta chips, offer chip,
   favorite) and ALL map features and interactions (pins, clusters, selected-pin sheet, camera
   controller, search scope, atlas, building/street search, navigation drawer, favorites filter, sort,
   deep links). Restyle only where tokens require; wire them into the new header and layouts.
D6 LOGO: replace the prototype's pin tile with the real project logo from public/ (verify what exists;
   do not invent). width/height set, Arabic alt text, kept as the home link. Carry over from the old
   design anything still needed (brand name, menu entries, theme toggle, offline page link) without
   changing the construction pattern (components, folders, hooks, state ownership).
E1 At >=1024px map actions (locate me, fit all) are ALWAYS visible in the top row; "map-only while map
   active" applies below 1024px only.
E2 annotated-1.png / annotated-2.png are the owner's markup of D1-D3 (removed buttons and removed pill).
E3 Locate-me reuses useMapGeolocation, shows a toast on denied/unavailable, and never asks for location
   on page load (only on tap).
E4 At 360px the header must fit: logo + name, 2-icon switch, max 2 mini buttons, "more" button, no
   horizontal overflow; the search field sits on its own row below 1024px.
E5 Contrast fixes are required: all text >= 4.5:1; white-on-amber buttons use a darker amber or dark
   text; muted text passes AA. Full dark theme with equal polish.
E6 Self-host Cairo (woff2 subset, font-display swap) or keep existing font loading if already
   compliant; justify with bundle numbers.

PHASE 2 - TOKENS AND SHELL
Move prototype tokens into the single Tailwind 4 theme/CSS-variable set in src/shared/. Build the app
shell, header (logo, search, mini buttons, "more"), category bar (horizontal scroll, snap, edge fades),
the icon-only switch, and the desktop two-pane layout per D1-D4 and E1-E6.

PHASE 3 - COMPONENTS
Restyle BusinessCard variants (list/compact/map-popup/detail) to the prototype look via the existing
UnifiedBusinessCard. MapBottomSheet using existing selection state and camera controller (no overlap
with controls; keep the selected-card pin overlap fix). Detail sheet/modal: hero, info rows (address,
phone, hours), offer card, actions (call, WhatsApp, directions in-app + external, share, favorite);
focus trap, focus restore, Esc, swipe-down close, aria-labelledby, scroll lock without layout jump.
Pins restyled to the gradient teardrop with category icon (active inverted); keep escaping and tests.
Map buttons, stats pill ("N نشاط") wired to real counts. Sort cycle and favorites filter chips. Toast
stack and connection banner (aria-live polite). Empty/error(retry)/loading/offline states everywhere.
Motion: transform/opacity only, fully disabled under prefers-reduced-motion.

PHASE 4 - INTEGRATION
Place atlas, building/street search, navigation drawer, for-business, pricing, about, theme toggle per
01-feature-map.md. One SearchField with Arabic normalization, recent searches, result count, clear;
results include businesses AND building/street matches. Deep links (/biz/:id, ?biz=) open the detail
over the right map state; Back closes the sheet before leaving; share URL is canonical /biz/:id.

PHASE 5 - TESTS AND EVIDENCE
Playwright (mobile 360/390, tablet 768, desktop 1280): switch in the top row on both pages, no text
node, same bounding box when switching pages (+/-1px), keyboard operable; no element overlaps the
bottom sheet; header fits at 360 with no overflow; at 1280 both panes visible, switch hidden, card<->pin
sync works; search -> open business -> call/WhatsApp/directions links are safe; deep link /biz/:id;
favorites persist after reload; offline banner; Esc/keyboard open-close; no horizontal overflow at
360/390/768/1280. First-load JS must not grow >10% vs the Phase 0 total. If axe-core is installed run
it on home/list/map/detail/dark and report counts, else BLOCKED (do not claim WCAG compliance).
Screenshots at 390 and 1280 for map, list, selected sheet, detail, dark theme and the "more" menu,
saved OUTSIDE tracked paths (ignored), plus a written list of intentional differences from the
prototype (contrast fixes, real data, desktop layout).

DELIVERABLE: reports/prototype-experience.md with: phase status (DONE/PARTIAL/BLOCKED/DROPPED), the
feature-map table status, before/after first-load JS, test table with real outputs, intentional
deviations, owner decisions needed, residual risks, commit list. End with: READY FOR REVIEW.