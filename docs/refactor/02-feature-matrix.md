# Feature Unification Matrix — Dalilak Directory

**Date**: October 4, 2026  
**Branch**: `refactor/ux-architecture`  
**Reference Document**: [`docs/refactor/00-baseline.md`](file:///C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/docs/refactor/00-baseline.md)  

---

## Unified Features Matrix

| Feature | Before (Files) | After (Unified File) | Behavior Differences Resolved | Test Verification |
| :--- | :--- | :--- | :--- | :--- |
| **Phone Normalization & WhatsApp URL** | `src/utils/phone.ts`<br>`src/components/cards/BusinessCard.tsx:95`<br>`src/components/activity/ActivityDetailModal.tsx:180`<br>`src/components/views/ForBusinessView.tsx:32` | `src/shared/lib/phone.ts`<br>`src/shared/lib/whatsapp.ts` | Consolidated international prefix parsing (+20, 0020, 01x), Arabic-Indic digits conversion, and message encoding into canonical `getWhatsAppUrl` and `cleanPhoneForWhatsApp`. | `src/tests/phone_validator.test.ts`<br>`src/tests/shared_lib.test.ts` |
| **Google Maps & Geo Directions** | `src/utils/hadayekRouting.ts`<br>`src/components/activity/ActivityDetailModal.tsx:240`<br>`src/components/cards/BusinessCard.tsx:240` | `src/shared/lib/directions.ts` | Standardized GPS coordinate resolution vs. destination address fallback, guarded against Null Island `(0, 0)` coordinates, and eliminated conflicting query string generators. | `src/tests/safety_net_batch0.test.ts` (SAFETY-10)<br>`src/tests/shared_lib.test.ts` |
| **Arabic Search & Numeral Normalization** | `src/utils/arabicSearch.ts`<br>`src/components/map/ZoneScopedSearchBar.tsx:45`<br>`src/utils/hadayekBuildingSearch.ts` | `src/shared/lib/arabic.ts` | Unified Hindi-to-Western numeral conversion (٠-٩ -> 0-9), Tashkeel stripping, and Alef/Hamza/Teh Marbuta normalization into a single zero-dependency utility. | `src/tests/safety_net_batch0.test.ts` (A3.2)<br>`src/tests/activity_search_intent.test.ts` |
| **Business Card & Action Presentation** | `src/components/cards/BusinessCard.tsx`<br>`src/components/map/MapSelectedBusinessDrawer.tsx`<br>`src/directory-experience/discovery/PlaceCard.tsx` | `src/features/business-details/components/UnifiedBusinessCard.tsx` | Enforced strict RTL action button ordering: Call -> WhatsApp -> Directions. Unified favorite toggle, video badge, verification badge, and responsive card sizing. | `src/tests/safety_net_batch0.test.ts` (A2.1, A2.2)<br>`src/tests/map_fixes.test.ts` |
| **Static Geography & Packages Data** | `src/data/mockData.ts:1-496` (bundled with sandbox fixtures) | `src/shared/data/geography.ts`<br>`src/shared/data/categories.ts`<br>`src/shared/data/packages.ts` | Decoupled static production constants from sandbox test fixtures (`MOCK_SANDBOX_BUSINESSES`), removing ~34 kB of mock data from production bundle imports. | `src/tests/map_fixes.test.ts` (Taxonomy contracts)<br>`npm run build` |
| **Application Composition Root** | `src/App.tsx` (382 lines: fetch, cache, realtime, routing) | `src/App.tsx` (31 lines)<br>`src/features/catalog/hooks/useCatalogLifecycle.ts`<br>`src/app/router/useInitialRouteParams.ts` | Separated application bootstrap shell from catalog data fetching, local caching, and realtime sync, reducing `App.tsx` by >90% without breaking any state lifecycles. | `npm test`<br>`npm run test:repair`<br>`scripts/test-seo-endpoints.ts` |
| **Design System UI Primitives** | Ad-hoc HTML buttons, divs, and custom drawer overlays | `src/shared/ui/` (`Button`, `IconButton`, `Card`, `Chip`, `Modal`, `Drawer`, `Skeleton`, `EmptyState`, `SearchField`, `Toast`) | Standardized WCAG 2.2 AA compliant primitives: min 44x44px touch targets, visible focus rings, focus trap + Esc handling, and semantic ARIA landmarks. | `src/tests/dialog_accessibility.playwright.cjs`<br>`npm test` |
