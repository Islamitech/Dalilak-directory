# 02 — Map Behavior & Interaction Logic Audit

**Date:** 2026-10-02  
**Scope:** Production Leaflet map; partial review of the parallel `directory-experience` map.  
**Method:** Source-only review. No application code or tests were changed/run; no live browser reproduction was performed. Findings are “from code only” unless otherwise stated. The prior inventory’s screenshot evidence is identified separately.

## 1. Intended map state machine inferred from source

View mode initializes at Hadayek coordinates and zoom 14, then fits Hadayek view bounds with max zoom 14.5. Limits are 12.8 mobile / 13.2 desktop through 19.5. Background activity layers are empty until category is active or there is a nonempty search override; the selected business uses a separate layer. Evidence: `src/components/map/hooks/useMapInstance.ts:35-46,253-269`; `src/components/map/hooks/useMapPinsClustering.ts:869-883,991-1001,915-978`.

| Zoom/state | Eligibility and culling | Pin appearance | Clustering |
|---|---|---|---|
| `<15`, city overview | With active category/search, `filterBusinessesForMap` returns Hadayek-wide businesses even if a zone is selected. With neither, no background pins. | Overview horizontal cards for the top three prominent in-view businesses; remaining or colliding items are compact dots. Scale is clamped 0.78–1.0. | Screen-space grouping radius 58 px plus geographic max distance 100 m. Groups of 2+ render a numbered cluster. |
| `15–<15.5` | Selected zone is enforced; otherwise Hadayek-wide. Still requires category/search to display. | Overview cards unless a zone is selected, in which case renderer already switches to district style. | Same grouping; cluster click zooms to group bounds. |
| `>=15.5`, district/local view | Selected zone enforced if set; otherwise Hadayek-wide. Still requires category/search. | Rich vertical district cards; collision suppression may replace a card with a dot. | Same grouping; click flies to member bounds up to 19, or opens a member chooser at max zoom / coincident members. |
| Selected business | Excluded from background clusters, represented in a dedicated selected pane at any zoom. | Compact selected card and bottom drawer are both eligible in State 1. Clicking compact card flies to 17.5 and expands; expanded card invokes business details. | Selection is isolated from ordinary groups. |

Evidence: `src/utils/hadayekZoneHelper.ts:260-295`; `src/components/map/hooks/useMapPinsClustering.ts:869-883,991-1026,1077-1136,1142-1199`; `src/components/map/utils/spatialActivityGroups.ts:1-31`; `src/components/map/utils/cameraPlanner.ts:96-145`.

**Intent unclear:** The helper’s “city overview” rule intentionally disables zone culling below 15, while the pin renderer changes layout at 15.5 and treats an active zone as district view at any zoom. The 0.5 zoom band and selected-zone overview can therefore combine city-wide eligibility with district styling. Comments do not clarify whether retaining city-wide results while a zone is selected is a product requirement. The “no filter = no background pins” rule also lacks explanatory UX intent.

### Selection and camera states

District selection frames its polygon; clearing it flies to Hadayek overview `[29.9683,31.1002]`, zoom 14. Category changes are intended not to move the camera. Selecting a business pans at overview zoom `<=15`, otherwise flies to a local zoom floor of 16.5; expanding the selected card flies to 17.5. Cluster click zooms or opens a chooser. Evidence: `useMapPinsClustering.ts:243-257,474-535,555-613,1111-1131`; `cameraPlanner.ts:30-93,96-145`.

The prior inventory documents a screenshot-confirmed defect: compact selected marker and bottom drawer can appear together because `setSelectedBiz` always resets expansion false. This audit did not reproduce it. Evidence: inventory §8; `useMapState.ts:27-33`; `InteractiveMap.tsx:423-446`; `useMapPinsClustering.ts:931-978`.

## 2. Interaction conflict matrix

Pair IDs in cells refer to the scenario table. The matrix is symmetric; each unordered pair appears once.

|  | Zoom | Pan | Filter | Search | Select | Cluster | Popup/sheet | Locate | Resize/rotate |
|---|---|---|---|---|---|---|---|---|---|
| **Zoom** | — | I01 | I02 | I03 | I04 | I05 | I06 | I07 | I08 |
| **Pan** | I01 | — | I09 | I10 | I11 | I12 | I13 | I14 | I15 |
| **Filter** | I02 | I09 | — | I16 | I17 | I18 | I19 | I20 | I21 |
| **Search** | I03 | I10 | I16 | — | I22 | I23 | I24 | I25 | I26 |
| **Select** | I04 | I11 | I17 | I22 | — | I27 | I28 | I29 | I30 |
| **Cluster** | I05 | I12 | I18 | I23 | I27 | — | I31 | I32 | I33 |
| **Popup/sheet** | I06 | I13 | I19 | I24 | I28 | I31 | — | I34 | I35 |
| **Locate** | I07 | I14 | I20 | I25 | I29 | I32 | I34 | — | I36 |
| **Resize/rotate** | I08 | I15 | I21 | I26 | I30 | I33 | I35 | I36 | — |

### Pair traces (actual, expected, conflict)

| ID | Scenario and actual behavior from code | Expected | Conflict / evidence |
|---|---|---|---|
| I01 | Zoom during pan/zoom; settled map events refresh pins. Progressive drops cancel on gesture start. | Render against final camera once settled. | No direct conflict seen. `useMapInstance.ts:304-333`; `useMapPinsClustering.ts:1244-1287`. |
| I02 | Select zone, then zoom across 15/15.5. Renderer reads live zoom, but filtered set is memoized without zoom or viewport revision. | Recompute eligibility and LOD after every settled zoom. | **Conflict, BHV-01.** `useMapPinsClustering.ts:869-883,1003-1013,1242-1243`; helper `hadayekZoneHelper.ts:269-294`. |
| I03 | Browse search is suggestion/client filtering, not geocoding; zoom affects map culling, not candidate text list. | Stable search candidates; map pins adapt to viewport. | No camera conflict; culling can inherit I02. `InteractiveMap.tsx:196-200,227-255,299-324`; pins hook `869-883`. |
| I04 | Selected business is isolated from clustering and remains in selected layer through zoom; it does not auto-expand solely from zoom. | Keep selected item visible; auto-expansion policy is unclear. | No disappearance; visual-scale policy unclear. `useMapPinsClustering.ts:915-978,1015-1019`. |
| I05 | Clusters use 58 px/100 m grouping; click flies to bounds up to 19, otherwise member chooser. | Zoom should progressively expose individual items. | Intended interaction; chooser may remain in narrow 19–19.5 band. `useMapPinsClustering.ts:1021-1026,1111-1136`; `useMapInstance.ts:253-256`. |
| I06 | Zoom while cluster popup open triggers reconciliation; no explicit close on zoom. | Keep valid chooser or close if cluster disappears. | Suspected Leaflet lifecycle issue; test popup while zooming cluster out of bounds. `useMapPinsClustering.ts:1058-1069,1111-1131,1280`. |
| I07 | Locate fix flies to GPS at zoom 17. | Locate centers the map and exposes accuracy. | No direct conflict; locate takes camera on completion. `useMapGeolocation.ts:63-76`; `useMapInstance.ts:183-199`. |
| I08 | Resize/rotate invalidation and map refresh are RAF-coalesced. | Use final size and zoom without center drift. | No code conflict; mobile layout unverified. `useMapInstance.ts:385-417`; pins hook `1244-1287`. |
| I09 | Pan with filter active updates bounds; same-filter path prunes out-of-view markers and retains in-view ones. | Preserve filter set, update viewport subset. | No direct conflict in settled path. `useMapPinsClustering.ts:1041-1071,1280`. |
| I10 | Search then pan: text candidates derive from query/props; pins are culled by bounds. | Candidate list stable; pins reflect viewport. | No silent candidate mutation found. `MapModernTopBar.tsx:81-94`; `useMapPinsClustering.ts:1003-1026,1280`. |
| I11 | Pan after selecting does not clear selection; map background click does. | Preserve selection while user repositions map. | No conflict; selected card can leave viewport without keep-in-view state. `useMapPinsClustering.ts:537-553,555-613,915-978`. |
| I12 | Gesture start cancels progressive pin work; moveend starts fresh render. | Stop old-coordinate drops and render settled viewport. | Deliberate temporary under-population. `progressiveWork.ts:13-25`; pins hook `1244-1287`. |
| I13 | Pan with popup/sheet: sheet stays tied to selection; popup has no explicit close. | Keep sheet; close/re-anchor invalid cluster popup. | Popup lifecycle suspected; `InteractiveMap.tsx:423-446`; pins hook `1058-1069,1111-1131`. |
| I14 | Locate, pan before GPS result: watch continues and final callback still flies. Drag stops only an already-running flight. | Decide whether pending locate wins or user gesture cancels it. | **Suspected conflict / missing state, BHV-06.** `useMapGeolocation.ts:46-99`; `useMapInstance.ts:183-199,299-302`. |
| I15 | Resize during pan invalidates size with `pan:false`; observers/events share pending frame. | Preserve geographic center and gesture. | No code conflict apparent. `useMapInstance.ts:385-417`. |
| I16 | Search candidates apply category but not selected zone; choosing outside-zone business sets selection which cleanup then clears. | Scope suggestions to zone or signal scope replacement. | **Conflict, BHV-03.** `MapModernTopBar.tsx:81-94,135-142`; `InteractiveMap.tsx:324,330-333`; pins hook `259-273`. |
| I17 | Filter change clears selection explicitly on category selection; hook also clears if selection no longer matches category/zone. Zone/category change clears background layers. | Retain matching selection; clear excluded selection without duplicate/stale surface. | State guard exists; selected card/drawer double-display remains prior BUG-VISUAL-01. `InteractiveMap.tsx:317-320`; pins hook `259-273,1041-1056`; state `27-33`. |
| I18 | Category/zone change clears old card/cluster layers and registries before progressive redraw. | No stale groups; clusters from new filter. | No stale-cluster conflict evident; redraw blank interval not measured. `useMapPinsClustering.ts:1036-1071,1086-1136`. |
| I19 | Filter identity change closes popup before clearing layers. But early return when no filter clears layers before `filterChanged` close call. | Close invalid popup when clearing the last filter. | **Suspected, BHV-05:** Leaflet may close it as source is removed; verify. `useMapPinsClustering.ts:991-1001,1041-1056,1111-1131`. |
| I20 | Locate does not reset active filter; zoom-dependent zone rules still apply. | Keep active filter while centering or explicitly reset by policy. | No reset conflict; I02 may stale culling. `useMapGeolocation.ts:63-76`; pins hook `869-883`. |
| I21 | Resize emits viewport refresh; filter state unchanged. | Same filter with updated bounds. | No direct conflict; mobile padding appearance unverified. `useMapInstance.ts:385-417`; pins hook `1003-1026,1280`. |
| I22 | Select search suggestion clears query; with category=all renderer clears background cards/clusters. Selected card/drawer remains. | Keep context around selected result. | **Conflict, BHV-02.** `MapModernTopBar.tsx:135-142`; `InteractiveMap.tsx:330-333`; pins hook `991-1001,915-978`. |
| I23 | Search changes eligible set, but popup-close identity only compares category/zone. Reconciliation may remove popup’s cluster without explicit close. | Refresh/close popup if members cease to match query. | **Suspected, BHV-07**, Leaflet runtime needed. `useMapPinsClustering.ts:869-883,1036-1071,1111-1131`. |
| I24 | Search selection clears query and surrounding results, while selected marker remains isolated. | Keep search context until user dismisses selection. | Context loss is BHV-02; no selected-state loss for valid candidate. `MapModernTopBar.tsx:135-142`; pins hook `915-978`. |
| I25 | GPS completion and picker search can both call `updateSelectedPosition`/`flyTo`; no shared camera intent arbitration. Browse search is not geocoding. | Define which explicit action wins. | Suspected race / missing state. `InteractiveMap.tsx:191-200,227-255`; `useMapGeolocation.ts:63-99`; `useMapSearch.ts:34-83`. |
| I26 | Resize does not close React search suggestions; Leaflet size is invalidated separately. | Keep search panel in viewport and usable with mobile keyboard. | Data stable; clipping/keyboard issue unverified. `MapModernTopBar.tsx:195-226,256-...`; `useMapInstance.ts:385-417`. |
| I27 | Click chooser member closes popup and selects business; it is excluded from cluster set and promoted to selected pane. | Promote one result, preserve other members. | Coordinated; selected drawer/card issue remains. `useMapPinsClustering.ts:1015-1019,1122-1131,915-978`. |
| I28 | Select another pin replaces current selection, setter resets expanded state, camera recenters. | Show one selected detail surface. | **Conflict; prior screenshot-confirmed BUG-VISUAL-01.** `useMapState.ts:27-33`; pins hook `915-978`; `InteractiveMap.tsx:423-446`. |
| I29 | Locate moves camera but does not clear selected business; its card may remain offscreen. | Clarify whether selection remains when camera relocates. | Missing product state/unclear intent. `useMapGeolocation.ts:63-76`; pins hook `555-613,915-978`. |
| I30 | Resize preserves React selection and invalidates map without pan; no selected-card resize handling. | Keep card and drawer usable on mobile. | Visual fit cannot be proven without browser. `useMapInstance.ts:385-417`; `InteractiveMap.tsx:423-446`. |
| I31 | Cluster chooser member click closes popup then sets selection. | Close chooser and promote chosen result. | Explicitly coordinated. `useMapPinsClustering.ts:1111-1134,1122-1131,915-978`. |
| I32 | Locate changes camera; groups recalculate from new bounds/projected points. | Clusters dissolve/reform at new position. | Expected; I02 applies across zoom 15. `useMapGeolocation.ts:63-76`; pins hook `1021-1026,1280`. |
| I33 | Resize refreshes bounds; grouping recomputes. `inViewBusinesses` is a fresh array each run, so identity cache likely misses. | Recluster in new screen geometry. | Correct output path, avoidable regrouping cost (unmeasured). `useMapPinsClustering.ts:1021-1026,1280`. |
| I34 | Locate does not close popup/sheet. | Keep relevant sheet; close/re-anchor map popup if anchor moves away. | Popup risk suspected, sheet policy unclear. `useMapGeolocation.ts:63-76`; pins hook `1111-1131`; `InteractiveMap.tsx:423-482`. |
| I35 | Resize invalidates Leaflet while React overlays persist. | Reflow overlays and keep controls reachable. | State persists; clipping unverified. `useMapInstance.ts:385-417`; `InteractiveMap.tsx:423-482`. |
| I36 | GPS completion flies to zoom 17 while resize/orientation invalidation runs separately. | Apply final camera using post-rotation viewport dimensions. | No explicit exclusion; timing unverified. `useMapGeolocation.ts:63-76`; `useMapInstance.ts:385-417`. |

## 3. Camera ownership and jumps

| Trigger | Actual camera behavior | Assessment |
|---|---|---|
| Initial view | `fitBounds(HADAYEK_VIEW_BOUNDS, maxZoom:14.5, animate:false)`; stores fitted center/zoom. | Symmetric 12 px fit padding is not aware of mobile search bar/drawer; visual result unverified. `useMapInstance.ts:253-269`. |
| External coordinates | Updates stored lat/lng and `liveCenterRef`; only picker flies. | View mode does not snap on every parent prop update. `useMapInstance.ts:72-93`. |
| Zone select/clear | Planner flies to bounds max 16.5; clear flies to fixed centroid/zoom14. Intermediate pin refresh suppressed until moveend +160 ms. | Intended single planner for zones; can interrupt another independent camera effect. `useMapPinsClustering.ts:414-535,218-238`; `cameraPlanner.ts:30-82`. |
| Business select | Pans at overview scale or flies to local scale; deselect preserves current user-panned camera. | Good explicit user-autonomy comment. Saved preselection center is not restored in inspected path. `useMapPinsClustering.ts:555-613`. |
| Expanded card | Calls `flyTo` 17.5; selection effect can also evaluate on expanded-state change. | Possible double/competing animation; suspected, test in browser. `useMapPinsClustering.ts:568-613,943-952`; planner `116-145`. |
| Building/route | Independent effects fly to building (max current/17) or route bounds (max16.5). | Multiple camera writers exist outside the planner; simultaneous prop updates may make final position effect-order dependent. Suspected. `useMapPinsClustering.ts:651-678,680-750`; planner comment `cameraPlanner.ts:1-14`. |
| Search/locate | Picker results fly to zoom18; GPS final fix to zoom17; browse business suggestion invokes selection camera. | No shared pending-camera priority; BHV-06 and I25. `useMapInstance.ts:183-199`; `useMapSearch.ts:34-83`; `useMapGeolocation.ts:63-99`. |
| Interruption/reset | Dragstart stops active Leaflet transition. Reset flies to parent `lat/lng` at zoom16. | Drag does not cancel async locate not yet delivered. Reset is prop-coordinate based. `useMapInstance.ts:299-302,436-441`. |

## 4. Rendering, z-order, and performance

- Zone/category filter changes close popup, clear layer groups/registries, then progressively add work; pan/zoom/search use incremental stale-marker pruning and identity retention. Four groups per frame / 3.5 ms cap. `useMapPinsClustering.ts:1036-1071,1086-1136`; `progressiveWork.ts:1-25`.
- Marker registries retain Leaflet marker identity when icon key matches; selected marker is independently updated. Hook’s inline registry path coexists with exported `reconcileMarkerRegistry`; inventory §2 notes that utility is not the production implementation. `markerReconciliation.ts:19-33,42-89`; pins hook `1181-1229`.
- Pane ordering: districts 360, labels 460, ordinary pins 600, selected pane 700; cluster z-index offset 600, cards 300, dots 100, selected marker offset 1200. Selection should visually dominate ordinary pin layer. `useMapPinsClustering.ts:280-300,1102-1135,1213-1218,968-975`.
- Selected marker is excluded from clusters and separate from background rendering. Prior inventory reports double display of selected marker + drawer. `useMapPinsClustering.ts:1015-1019,915-978`; `InteractiveMap.tsx:423-446`.
- Grouping cache compares `items` by reference, but `inViewBusinesses` is newly filtered on each effect run, so it is unlikely to hit; repeated grouping is a performance risk, not a measured slowdown. `useMapPinsClustering.ts:1021-1026`; `spatialActivityGroups.ts:5-31`.
- No duplicate-marker or flicker was observed. Filter rebuild plus staggered progressive insertion could cause a brief transition, but that visual symptom is **unproven** and requires a browser recording.

## 5. Async race checks

| Path | Guard | Result |
|---|---|---|
| Picker place search | 400 ms debounce and request id; stale response ignored; timeout canceled on clear/unmount. | Race guarded; no abort of in-flight request but stale data is discarded. `useMapSearch.ts:17-32,34-77,79-95`. |
| GPS | Clears old watch/timer; best-accuracy sample; finalize-once flag. | Internal result guarded; camera intent after user pan is not. `useMapGeolocation.ts:28-44,46-145`. |
| Topbar building lookup | Request id gates valid successive requests; clearing input returns before incrementing/invalidation. | Pending request can repopulate hidden coordinate state after clear; no rendered target without active zone+building is proven. `MapModernTopBar.tsx:101-120`; target derivation `MapView.tsx:147-161`. |
| Progressive work | RAF cancellation on dependencies/gesture; next settled viewport starts a new run. | No out-of-order renderer callback found. `progressiveWork.ts:13-25`; `useMapPinsClustering.ts:1230-1287`. |
| Browse search vs zone | Candidate filter omits zone; post-selection effect validates it. | Visible selection can be immediately cleared: BHV-03. `MapModernTopBar.tsx:81-94,135-142`; `useMapPinsClustering.ts:259-273`. |

## 6. Findings

Severity: High = wrong entities/state can dominate map; Medium = common interaction loses/contradicts context; Low = limited UX/debt. Classification uses requested (a) bug, (b) UX flaw, (c) architectural debt, (d) missing state. All findings are **from code only** unless explicitly stated.

### BHV-01 — Zoom-dependent culling uses a stale memoized business set

- **Class/severity:** (a) bug; High. **Status:** from code only.
- **Repro:** Select zone at zoom >=15 then zoom below 15; or select zone below 15 then zoom above 15.
- **Expected:** Recompute zone eligibility on settled zoom and coordinate the 15/15.5 LOD boundary.
- **Actual/symptom:** Renderer rereads live zoom on viewport refresh, but `visibleBusinesses` memo does not depend on zoom/viewport revision. Filter helper receives zoom only when memo runs. City-wide eligibility may remain after zooming in, or zone-only eligibility after zooming out; likely visible symptom is pins from the wrong zones appearing or disappearing.
- **Evidence:** `src/components/map/hooks/useMapPinsClustering.ts:869-883,1003-1013,1242-1243`; `src/utils/hadayekZoneHelper.ts:269-294`.
- **Inventory link:** §3 threshold conflict; §4.4–4.5.

### BHV-02 — Choosing search suggestion clears the query that keeps surrounding pins visible

- **Class/severity:** (a) bug; Medium. **Status:** from code only. Prior inventory §5 Chain C labels its blank-map flash confirmed; not reproduced here.
- **Repro:** With category `all`, type business name and select its suggestion.
- **Expected:** Keep the selected item and nearby search context visible.
- **Actual/symptom:** Handler clears search; renderer sees neither category nor search and clears background layers. Dedicated selected marker/drawer remains, so user loses surrounding pins (not all map elements).
- **Evidence:** `src/components/map/MapModernTopBar.tsx:135-142`; `src/components/InteractiveMap.tsx:330-333`; `src/components/map/hooks/useMapPinsClustering.ts:991-1001,915-978`.
- **Inventory link:** §5 Chain C.

### BHV-03 — Search can offer a business that active zone filtering then rejects

- **Class/severity:** (a) bug and (d) missing state; Medium. **Status:** from code only.
- **Repro:** Select zone A; search for a matching-category business in zone B; select it.
- **Expected:** Scope suggestions to selected zone or clearly offer switching to city-wide search.
- **Actual/symptom:** Suggestions use category/name/category/street, not zone. The selection cleanup effect clears the out-of-zone business, making the chosen result seem ignored.
- **Evidence:** `src/components/map/MapModernTopBar.tsx:81-94,135-142`; `src/components/InteractiveMap.tsx:324,330-333`; `src/components/map/hooks/useMapPinsClustering.ts:259-273`.
- **Inventory link:** §4.2 search state; §5 Chain C.

### BHV-04 — Count pill and visible eligible-pin set use different zoom rules

- **Class/severity:** (b) UX flaw and (c) architectural debt; Low. **Status:** from code only.
- **Repro:** Select zone at overview zoom and compare result count/empty notice with map pins.
- **Expected:** Count describes rendered eligible markers or is labeled as a different total.
- **Actual/symptom:** Count calls `filterBusinessesForMap` without zoom; marker set passes live zoom. Helper changes zone treatment below 15, so count and map can disagree.
- **Evidence:** `src/components/InteractiveMap.tsx:69-76,400-406`; `src/components/map/hooks/useMapPinsClustering.ts:869-883`; `src/utils/hadayekZoneHelper.ts:260-294`.
- **Inventory link:** §2 duplicate filtering; §4.5.

### BHV-05 — Clear-to-all path does not explicitly close cluster popup

- **Class/severity:** (a) suspected bug; Medium. **Status:** suspected from code only.
- **Repro:** Open cluster chooser, clear final category/search.
- **Expected:** Close chooser when its cluster disappears.
- **Actual/symptom:** No-filter early return clears layers and exits before later `filterChanged` branch calls `map.closePopup()`. Whether Leaflet closes popup on source removal is version-dependent; stale chooser over empty map is suspected.
- **Evidence:** `src/components/map/hooks/useMapPinsClustering.ts:991-1001,1041-1056,1111-1131`.
- **Inventory link:** §5 event map and Chain C.
- **Verify:** Browser: open multi-item chooser, clear last filter/query, observe popup lifecycle.

### BHV-06 — Pending GPS result may override a later user pan

- **Class/severity:** (d) missing state and (b) UX flaw; Medium. **Status:** suspected from code only.
- **Repro:** Press locate; pan before GPS fix; then allow callback.
- **Expected:** Explicit arbitration: locate remains a pending command or user gesture cancels it.
- **Actual/symptom:** Watch continues and final result flies to location at zoom17. `dragstart` stops only an already-running animation; no pending-locate gesture cancellation exists.
- **Evidence:** `src/components/map/hooks/useMapGeolocation.ts:46-99,132-145`; `src/components/map/hooks/useMapInstance.ts:183-199,299-302`.
- **Inventory link:** §4.4 viewport state; §5 events.
- **Verify:** Delay permission/fix, pan while locating, then allow callback.

### BHV-07 — Open cluster chooser may retain members after search narrows

- **Class/severity:** (a) suspected bug and (d) missing popup validity state; Medium. **Status:** suspected from code only.
- **Repro:** Open cluster chooser, narrow/clear query without changing category/zone.
- **Expected:** Update chooser or close it if members are invalid.
- **Actual/symptom:** Search changes eligible businesses, but popup close key checks only category/zone; marker reconciliation may remove cluster without explicit popup close. Leaflet behavior unverified.
- **Evidence:** `src/components/map/hooks/useMapPinsClustering.ts:869-883,1036-1071,1111-1131`; `MapModernTopBar.tsx:81-94`.
- **Inventory link:** §4.2 and §5 Chain C.
- **Verify:** Change query while chooser open and inspect content/anchor.

### BHV-08 — Independent camera effects can override one another

- **Class/severity:** (c) architectural debt; possible (a) bug; Medium. **Status:** suspected from code only.
- **Repro:** Change zone with route/business/building target in same update; or update route while selecting a business.
- **Expected:** One shared camera planner chooses destination and cancels/queues other movement.
- **Actual/symptom:** Zone, selected business, target-building and route effects each call `map.stop()` plus independent fly methods. Shared token is not an arbiter for every path; final camera may depend on effect order.
- **Evidence:** `src/components/map/hooks/useMapPinsClustering.ts:474-535,555-613,651-678,680-750`; planner’s single-owner claim `src/components/map/utils/cameraPlanner.ts:1-14`.
- **Inventory link:** §4 state map; §5 trigger chains.
- **Verify:** Log camera calls while simultaneous props update.


- **Class/severity:** (b) UX flaw; Medium. **Status:** from code only.
- **Repro:** Select a search suggestion with no category active.
- **Expected:** Keep a useful surrounding result context until user dismisses selection.
- **Actual/symptom:** Background pins clear when query clears; selected surface stays. Prior screenshot-confirmed duplicate drawer/card can compound the context loss.
- **Evidence:** `src/components/map/hooks/useMapPinsClustering.ts:991-1001,915-978`; `src/components/InteractiveMap.tsx:423-446`; `src/components/map/hooks/useMapState.ts:27-33`.
- **Inventory link:** §8 BUG-VISUAL-01 and §5 Chain C.


- **Class/severity:** (b) UX behavior / intent ambiguity; Low. **Status:** from code only, not a confirmed bug.
- **Repro:** Pan while a zone is selected, then clear zone.
- **Expected:** Unclear: preserve user camera or return to overview; source explicitly picks overview.
- **Actual/symptom:** Camera flies to fixed Hadayek centroid, zoom14. Business deselection, in contrast, explicitly keeps current pan position.
- **Evidence:** `src/components/map/utils/cameraPlanner.ts:73-82`; `src/components/map/hooks/useMapPinsClustering.ts:521-530,560-565`.
- **Inventory link:** §5 Chain A; §4.4.


- **Class/severity:** (c) architectural debt; possible (a) bug if route is user-facing; Medium. **Status:** from code only.
- **Repro:** Reach `directory-experience` map; compare category aliases and change area/search while selected.
- **Expected:** If both maps are user-facing, maintain consistent category semantics and selection behavior.
- **Actual/symptom:** Local `area/category/query/selected` state, exact string category match, and input changes clear selection. Gate directions invokes `onAction('directions')` without destination data (inventory suspected P11); product impact depends on route and callback wiring, not reviewed here.
- **Evidence:** `src/directory-experience/map/MapScreen.tsx:13-46,53-55,79-117,279-286`.
- **Inventory link:** §2 category matching; §6 P11.

## 7. Coverage and confidence

### Read

- `docs/audit/01-map-inventory.md` in full.
- `src/components/map/hooks/useMapPinsClustering.ts`: behavior-relevant ranges 1–210, 243–257, 259–273, 275–412, 414–613, 630–678, 680–750, 760–801, 869–1289. Not every line 614–629 was inspected.
- `src/components/map/hooks/useMapInstance.ts`: initialization/prop coordinates, tile layer, lifecycle, camera controls and resize behavior (35–93, 95–181, 183–199, 218–340, 342–417, 419–471).
- `src/components/InteractiveMap.tsx`: imports/props, state wiring, map hook setup, search/filter/drawer areas (1–55, 60–160, 162–209, 211–280, 282–350, 400–493). Lines 351–399 not read in detail.
- `src/components/map/hooks/useMapState.ts` full; `src/components/map/utils/cameraPlanner.ts`, `markerReconciliation.ts`, `spatialActivityGroups.ts`, `progressiveWork.ts` full.
- `src/components/map/MapModernTopBar.tsx` search/candidate/handler/overlay ranges 55–193, 195–226, 256–449; `src/components/views/MapView.tsx` 1–275.
- `src/utils/hadayekZoneHelper.ts` filtering function 250–295 only; `src/components/map/hooks/useMapSearch.ts` and `useMapGeolocation.ts` full.
- `src/directory-experience/map/MapScreen.tsx` relevant state/filter/query and gate ranges only; parallel route activation not traced.

### Not read

`src/components/map/badgeMarkers.ts`; `MapFloatingControls.tsx`, `MapHeaderBar.tsx`, `MapSearchBox.tsx`, `MapSelectedBusinessDrawer.tsx`, `BuildingDetailDrawer.tsx`, `InAppNavigationDrawer.tsx`; `leafletLoader.ts`, `districtLabelPosition.ts`; `directory-experience/map/GeographicCanvas.tsx`, `MapActivityCards.tsx`, `useMapViewport.ts`, `mapGeometry.ts`, `map.css`; data/taxonomy files, `geocoding.ts`, building-search and tile-preloader helpers, parent route registration, and runtime Leaflet popup behavior. Earlier inventory reports some interface-only knowledge; this audit did not re-read those modules. No asserted runtime symptom depends solely on their uninspected internals.

**Runtime coverage:** None. Source project resides outside current workspace path; no browser run or mobile viewport reproduction. All findings are “from code only” except the prior inventory’s screenshot-confirmed BUG-VISUAL-01, which is not independently reproduced here. Popup closure, mobile fit/clipping, animation interruption, flicker, and measured performance need manual verification.

**Confidence:** High for BHV-01–04 source dataflow and selected-card state conditions; medium for independent camera writers and GPS precedence; low/suspected for popup lifecycle and mobile visual fit pending runtime checks. Coverage is broad across production filtering, rendering, camera and async hooks, but partial for visual factories, controls, data helpers and the parallel route.
### BHV-09 — Mobile zone flight does not reserve drawer space

- **Class/severity:** (b) UX flaw; Medium. **Status:** from code only.
- **Repro:** At mobile viewport, select a district while the selected-business drawer is open.
- **Expected:** The destination district is framed in the visible map area, accounting for the bottom drawer.
- **Actual/symptom:** Zone flight always calls the padding helper with `hasBottomDrawer=false`, so it reserves 45px rather than the helper's 165px bottom inset; district focus may sit behind the drawer.
- **Evidence:** `src/components/map/hooks/useMapPinsClustering.ts:487-488,503-519`; `src/components/map/utils/cameraPlanner.ts:158-171`.
- **Inventory link:** §3 camera padding utility and §5 camera transitions.

### BHV-10 — Independent camera effects can cancel or replace each other

- **Class/severity:** (c) architectural debt; possible (b) UX flaw; Medium. **Status:** suspected from code only.
- **Repro:** Change selected zone while a building target/route is also updated, or click a cluster during another active flight.
- **Expected:** One ordered camera intent should own movement and resolve competing targets.
- **Actual/symptom:** Zone, business, building, and cluster handlers independently call `map.stop()` and start their own flights. The shared camera token is incremented but has no read sites, and cluster/building flights do not use the same flight-marking lifecycle; the later command can cancel/replace the earlier movement.
- **Evidence:** `src/components/map/hooks/useMapPinsClustering.ts:186-194,483-535,555-613,671-677,1111-1115`; token writes at 485, 592, 947 and no reads; `cameraPlanner.ts:1-14`.
- **Inventory link:** §5 Trigger Chains A/D and §6 P1/P10.
- **Verify:** Trigger overlapping transitions during an active animation and record final camera center/zoom.

### BHV-11 — Build search requests have no latest-request guard

- **Class/severity:** (a) suspected bug / (d) missing state; Medium. **Status:** suspected from code only.
- **Repro:** Submit building lookup A, then lookup B before A's exact-coordinate promise resolves; reverse the completion order.
- **Expected:** The last submitted building remains the active target, and loading remains active until all current work completes.
- **Actual/symptom:** Each `handleSelectBuildingItem` awaits exact coordinates then fallback, with no generation ID/cancellation. A late earlier completion can call `onSelectBuilding` after the newer one and replace its target; the older `finally` may clear the spinner while newer work is pending. MapView's separate coordinate effect has a request ID guard, but does not guard this top-bar callback path.
- **Evidence:** `src/components/map/MapModernTopBar.tsx:113-132,145-159`; `src/components/views/MapView.tsx:101-120`.
- **Inventory link:** §2 building lookup duplicate callers/no shared cache.
- **Verify:** Delay exact lookup responses and return them out of order.

### BHV-12 — Active selection remains geographically offscreen after user pans

- **Class/severity:** (b) UX flaw / (d) missing state; Low. **Status:** from code only.
- **Repro:** Select a business and pan to a distant part of Hadayek.
- **Expected:** Either keep selection in view, dismiss the map card, or transition it to an explicitly anchored sheet state.
- **Actual/symptom:** Selection layer is excluded from normal viewport culling and is removed only when selection becomes null. Pan does not clear selection; the floating card/drawer can remain while its map anchor is beyond bounds.
- **Evidence:** `src/components/map/hooks/useMapPinsClustering.ts:537-553,915-978,1015-1026`; `src/components/InteractiveMap.tsx:423-445`.
- **Inventory link:** §4.3 selected business state; §5 pan/moveend handlers.

### BHV-13 — Category/zone change replaces all result markers before progressive redraw

- **Class/severity:** (b) UX flaw / (c) architectural debt; Low to Medium at high result counts. **Status:** from code only; visual impact unverified.
- **Repro:** Show many results, switch category or zone repeatedly.
- **Expected:** New filter appears promptly without a visible empty or sparse interval, while invalid old pins disappear.
- **Actual/symptom:** Filter identity change clears both result layers and registries synchronously, then schedules at most four marker additions per frame. The user may briefly see an empty/sparse layer; this report did not observe a recording.
- **Evidence:** `src/components/map/hooks/useMapPinsClustering.ts:1036-1072,1086-1087,1235-1242`; `src/components/map/utils/progressiveWork.ts:1-27`.
- **Inventory link:** §5 Chain B and §6 progressive-work notes.

### BHV-14 — The parallel map uses different category and selection rules

- **Class/severity:** (c) architectural debt; possible (a) bug if route is user-facing; Medium. **Status:** from code only.
- **Repro:** Reach the `directory-experience` map and compare an alias category with the Leaflet map; type in search while a place is selected.
- **Expected:** If both routes are intended for users, matching category semantics and documented selection persistence.
- **Actual/symptom:** This implementation matches exact category strings and clears selection when area/category/query changes; results may diverge from the alias-aware Leaflet map, and selected detail disappears during query edits.
- **Evidence:** `src/directory-experience/map/MapScreen.tsx:13-46,53-55,79-117`; category predicate at lines 28-38.
- **Inventory link:** §2 duplicate category filtering and §7 parallel implementation.

## 7. Coverage and confidence

### Read

- `docs/audit/01-map-inventory.md` in full.
- Production behavior paths: `src/components/map/hooks/useMapPinsClustering.ts` (camera, selection, building target, clustering, marker reconciliation and refresh); `useMapInstance.ts` (initialization, prop changes, controls, movement events and resize); `useMapState.ts`, `useMapSearch.ts`, `useMapGeolocation.ts`; `src/components/InteractiveMap.tsx`; `src/components/views/MapView.tsx`; parent search/filter wiring in `src/components/PublicShowcase.tsx`; `src/components/map/MapModernTopBar.tsx`; `cameraPlanner.ts`, `markerReconciliation.ts`, `spatialActivityGroups.ts`, `progressiveWork.ts`; `src/utils/hadayekZoneHelper.ts` filter implementation.
- Parallel map: relevant filtering/selection sections of `src/directory-experience/map/MapScreen.tsx`.

### Not read

`badgeMarkers.ts`; `MapFloatingControls.tsx`, `MapHeaderBar.tsx`, `MapSearchBox.tsx`, `MapSelectedBusinessDrawer.tsx`, `BuildingDetailDrawer.tsx`, `InAppNavigationDrawer.tsx`; `leafletLoader.ts`, `districtLabelPosition.ts`; `directory-experience/map/GeographicCanvas.tsx`, `MapActivityCards.tsx`, `useMapViewport.ts`, `mapGeometry.ts`, `map.css`; taxonomy and map data files; geocoding/building lookup/tile-preloader helper internals; route activation for `directory-experience`; Leaflet runtime popup behavior. Relevant caller interfaces were traced where necessary, but these module internals were not reviewed.

**Runtime coverage:** No browser run; desktop and mobile scenarios were not reproduced. All findings are **from code only** in this pass. The prior inventory §8 records screenshots for the duplicate selected card/drawer (BUG-VISUAL-01), but they were not independently reproduced here. Popup closure, clipping, perceived flicker, and measured performance need runtime verification.

**Coverage:** intended zoom/LOD rules, scope filtering, the full interaction matrix, camera command paths, pin grouping/culling/reconciliation, async geocoding/GPS/building-search paths, responsive invalidation, and independent parallel map filtering.  
**Confidence:** High for code-level state transitions, zoom thresholds, parent data flow and conditional rendering; medium for cross-effect timing; low/suspected for Leaflet popup teardown, visual mobile fit, GPS-vs-gesture result and actual flicker/performance.  

**Read-only maintained: no application code changed. This report is the only file changed.**
