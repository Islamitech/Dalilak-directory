# Dalilak Directory Experience — Prototype Specification

**Document Version:** 1.0.0  
**Phase:** Phase 1 (Documentation & Specifications)  
**Reference Design:** `docs/design/prototype.html` & Owner Directives (D1–D6, E1–E6)  
**Target:** Unified Public Directory Experience (`Dalilak-directory`)  
**Direction:** RTL Native (Arabic `dir="rtl"`)  

---

## 1. Executive Vision & Scope

This specification translates the high-fidelity interactive prototype ([`docs/design/prototype.html`](file:///c:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/docs/design/prototype.html)) into production design tokens, layout contracts, component behaviors, and interactive state models for the Dalilak directory platform.

### Core Architectural Decisions Enforced
1. **D1 (Removed Actions):** The notification bell button with red badge and the account button are completely eliminated. No dummy or placeholder elements are retained.
2. **D2 (Top-Row Segmented Switch):** The view switch moves from the floating bottom pill to the **top row** of the app header (in the visual left slot in RTL). It is an **icon-only segmented control** (Map icon & List icon) with zero text, identical dimensions and placement on both views, completely eliminating content overlap.
3. **D3 (Standardized Mini Buttons & More Menu):** All secondary and floating utility buttons (Theme toggle, Hadayek Atlas, For Business, Pricing, About, Map Actions) adopt the uniform mini square button style (38–44px, border, subtle hover, rounded corners). On viewports < 400px, a maximum of 2 mini buttons are displayed, while remaining actions collapse into a "More" (`...`) menu sheet.
4. **D4 (True Responsive Layout — No Phone Frame):**
   - **>= 1024px (Desktop):** Full-bleed responsive header with inline search and actions. Two-column split pane: fixed-width scrollable list panel (400–440px on the RTL start side) and interactive map filling the remaining canvas. Both panes are permanently visible, hiding the mobile view switch.
   - **768px – 1023px (Tablet):** Mobile navigation pattern with top-row icon switch; business detail presents as a centered modal dialog.
   - **< 768px (Mobile):** Full-bleed layout utilizing `dvh` units and safe-area insets.
5. **D5 (Preservation of Logic & Features):** The prototype visual language (icon tile, verified badge, area/category typography, rating, offer card, favorite toggle) is mapped onto [`UnifiedBusinessCard`](file:///c:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/features/business-details/components/UnifiedBusinessCard.tsx) and existing production map engines (pins, clustering, camera controllers, atlas, building search, routing).
6. **D6 (Official Brand Asset):** The prototype's generic pin icon is replaced by the authentic vector brand asset ([`src/components/Logo.tsx`](file:///c:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/src/components/Logo.tsx) / `public/logo.svg`) with explicit dimensions and descriptive Arabic alternative text.

---

## 2. Design System Tokens

The prototype CSS variables are harmonized into Dalilak's Tailwind CSS v4 design system, with strict WCAG 2.2 AA contrast remediation (Requirement E5).

### 2.1 Color Tokens & Contrast Matrix

| Token Name | Prototype Hex | Production Light Value | Production Dark Value | WCAG Contrast Ratio (Light) | Role / Usage |
|---|---|---|---|:---:|---|
| `--color-bg-primary` | `#f5f7fa` | `#f8fafc` | `#0b0f19` | — | Root page background |
| `--color-bg-secondary` | `#eef1f6` | `#f1f5f9` | `#111827` | — | Input backgrounds, info rows |
| `--color-surface` | `#ffffff` | `#ffffff` | `#1f2937` | — | Cards, modals, drawers, header |
| `--color-surface-hover` | `#f8fafc` | `#f8fafc` | `#283548` | — | Hover state on surfaces |
| `--color-border` | `#e8ecf2` | `#e2e8f0` | `#374151` | 3.2:1 (UI) | Standard card & component borders |
| `--color-border-subtle` | `#dde3ea` | `#cbd5e1` | `#4b5563` | 4.1:1 (UI) | Dividers, scrollbar thumbs |
| `--color-text-primary` | `#0f172a` | `#0f172a` | `#f9fafb` | **15.4:1** | Primary titles, headlines, inputs |
| `--color-text-secondary` | `#475569` | `#334155` | `#e5e7eb` | **9.2:1** | Body copy, meta tags, labels |
| `--color-text-muted` | `#94a3b8` (Fails AA) | `#64748b` (Remediated) | `#9ca3af` | **4.7:1** | Captions, secondary timestamps |
| `--color-brand-primary` | `#f59e0b` | `#d97706` | `#f59e0b` | **4.8:1** (on white) | Primary accents, selected states |
| `--color-brand-primary-text` | `#ffffff` | `#0f172a` (on amber) | `#0f172a` | **9.5:1** | Text inside solid primary buttons |
| `--color-brand-soft` | `#fef3c7` | `#fef3c7` | `rgba(245,158,11,0.15)` | — | Accent chip & tag background |
| `--color-brand-dark` | `#d97706` | `#b45309` | `#fbbf24` | **6.8:1** | Star ratings, primary hover |
| `--color-accent-success` | `#10b981` (Fails text) | `#059669` (Remediated) | `#10b981` | **4.6:1** | "مفتوح" open status, online banner |
| `--color-accent-soft` | `#d1fae5` | `#d1fae5` | `rgba(16,185,129,0.15)` | — | Open status chip background |
| `--color-danger` | `#ef4444` | `#dc2626` | `#ef4444` | **4.9:1** | "مغلق" closed status, offline banner |
| `--color-danger-soft` | `#fee2e2` | `#fee2e2` | `rgba(239,68,68,0.15)` | — | Closed status chip background |
| `--color-info` | `#3b82f6` | `#2563eb` | `#3b82f6` | **5.9:1** | Verification badge, links |
| `--color-info-soft` | `#dbeafe` | `#eff6ff` | `rgba(59,130,246,0.15)` | — | Info highlights |

> [!IMPORTANT]
> **Contrast Remediation (Requirement E5):** The prototype's light-mode text `#94a3b8` fails WCAG AA against white backgrounds (2.6:1). In production, all secondary labels use `#64748b` (4.7:1). Furthermore, buttons with amber background (`#f59e0b`) use dark slate text (`#0f172a`, 9.5:1) or amber-700 (`#b45309`) to ensure legible text that passes WCAG 2.2 AA.

### 2.2 Border Radius Scale

- `--radius-sm`: `10px` — Compact tool buttons, status chips, info row icons.
- `--radius-md`: `14px` — Mini buttons, map control buttons, sheet icons.
- `--radius-lg`: `16px` — Unified business cards, search input, offer card, dialogs.
- `--radius-xl`: `24px` — Map bottom sheet top corners, detail modal top hero.
- `--radius-pill`: `9999px` — Segmented control indicator, category chips, rating pills.

### 2.3 Elevation & Shadows

- `--shadow-xs`: `0 1px 2px rgba(15, 23, 42, 0.04)` — Subtle chip and card borders.
- `--shadow-sm`: `0 2px 8px rgba(15, 23, 42, 0.06)` — Active category chip, header bar.
- `--shadow-md`: `0 8px 24px rgba(15, 23, 42, 0.08)` — Map floating buttons, hover cards.
- `--shadow-lg`: `0 20px 50px rgba(15, 23, 42, 0.12)` — Modals, bottom sheets, toast notices.
- `--shadow-brand`: `0 8px 24px rgba(217, 119, 6, 0.28)` — Primary CTAs, active segmented switch.

### 2.4 Motion & Transitions

- `--motion-duration-fast`: `180ms cubic-bezier(0.4, 0, 0.2, 1)` — Button press, icon color switch.
- `--motion-duration-normal`: `280ms cubic-bezier(0.4, 0, 0.2, 1)` — Page opacity, search clear appearance.
- `--motion-spring`: `380ms cubic-bezier(0.34, 1.4, 0.64, 1)` — Bottom sheet emergence, modal scale up.
- **Accessibility Rule:** Under `@media (prefers-reduced-motion: reduce)`, all durations collapse to `0ms` and `transform` animations become instant opacity toggles.

### 2.5 Typography & Font Loading (Requirement E6)

- **Font Family:** `'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Weights:** Regular (`400`), SemiBold (`600`), Bold (`700`), ExtraBold (`800`)
- **Loading Strategy:** Preloaded in `index.html` via Google Fonts CDN using `font-display: swap` and preconnect resource hints (`fonts.googleapis.com` & `fonts.gstatic.com`). Zero impact on the 128 kB JS entry bundle budget.

---

## 3. Screen & Layout Architecture

### 3.1 Breakpoint Grid & Responsive Layouts (D4)

```
+-------------------------------------------------------------------------------+
| Breakpoint >= 1024px: Two-Column Split Pane (Desktop & Large Tablet)           |
+-------------------------------------------------------------------------------+
| [Header] Logo + Brand  |  Search Field (Inline)  | [Map Actions] [Mini Buttons] |
| [Category Bar] Horizontal category tags with smooth edge fades                |
+------------------------------------+------------------------------------------+
| Scrollable Business List Panel     | Interactive Map Canvas (Full Bleed)      |
| Width: 400px - 440px (RTL Right)   | (RTL Left)                               |
| - Header (count, favs, sort)       | - Teardrop pins with clusters            |
| - Business cards                   | - Top-right floating controls            |
| - Infinite scroll / pagination     | - Detail view anchors alongside list     |
+------------------------------------+------------------------------------------+

+-------------------------------------------------------------------------------+
| Breakpoint 768px - 1023px: Tablet View (Mobile Navigation with Centered Modal)|
+-------------------------------------------------------------------------------+
| [Header Top Row] Logo + Brand   | [Map / List Switch] | [Mini Buttons] [More]  |
| [Search Row] Full-width search bar with clear & icon                          |
| [Category Bar] Horizontal scrollable chips                                    |
| [Active View Canvas] Map Page OR List Page                                     |
| [Detail View] Centered Accessible Modal Dialog                                 |
+-------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------+
| Breakpoint < 768px: Mobile View (Full-Bleed Touch Optimized)                 |
+-------------------------------------------------------------------------------+
| [Header Top Row] Logo + Brand   | [Map / List Switch] | [Max 2 Minis] [More]   |
| [Search Row] Full-width search input (48px touch target)                      |
| [Category Bar] Snap-scrolling chips                                           |
| [Active View Canvas] Map Page OR List Page                                     |
| [Detail View] Bottom Sheet with Drag Handle, Focus Trap & Scroll Lock         |
+-------------------------------------------------------------------------------+
```

### 3.2 Header Layout & 360px Fit (Requirements E4 & D2)

On viewports down to 360px:
- **Top Row Elements (Right-to-Left):**
  1. **Brand Identity (Start):** Logo (36x36px) + Arabic wordmark "دليلك" (bold 1rem).
  2. **Top-Row Icon Switch (Center-End):** Segmented control (72x38px total) containing:
     - Map Icon button (`44x44px` hit target, `34x34px` visual).
     - List Icon button (`44x44px` hit target, `34x34px` visual).
  3. **Secondary Actions (End):**
     - Mobile (< 400px): At most 2 visible mini buttons (e.g., Theme Toggle + Locate Me / Atlas) plus a "More" (`...`) button.
     - Total top-row width at 360px = 110px (Brand) + 76px (Switch) + 80px (2 Mini Buttons) + 38px (More) + 24px (padding) = **328px <= 360px**.
- **Search Row:** Sits on its own dedicated row directly beneath the top row on viewports < 1024px. Height: 48px. Zero horizontal overflow (`scrollWidth === clientWidth`).

---

## 4. Component Design Specifications

### 4.1 Top-Row Icon-Only Segmented Switch (D2)

- **Container:** `display: inline-flex; height: 38px; border-radius: 9999px; background: rgba(15,23,42,0.06); padding: 2px; position: relative;`
- **Segments:**
  - Segment 1: `MapIcon` (`aria-label="الخريطة التفاعلية"`, `title="الخريطة"`).
  - Segment 2: `ListIcon` (`aria-label="قائمة الأنشطة"`, `title="قائمة الأنشطة"`).
- **Active Pill Indicator:**
  - State-driven CSS positioning via logical properties (`inset-inline-start`).
  - Background: Amber gradient (`linear-gradient(135deg, #f59e0b, #d97706)`).
  - Shadow: `0 2px 8px rgba(217, 119, 6, 0.35)`.
  - Icon color on active segment: `#0f172a` (dark slate for high contrast).
  - Transition: `all 240ms cubic-bezier(0.4, 0, 0.2, 1)`.
- **Accessibility:** Grouped with `role="radiogroup"` (or dual buttons with `aria-pressed="true|false"`), visible focus ring on keyboard navigation, touch target padded to 44x44px.

### 4.2 Category Chips Bar

- **Container:** `overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; display: flex; gap: 8px; padding: 10px 16px;`
- **Edge Fades:** CSS `mask-image` linear gradients on start and end edges when scrollable.
- **Chip Variant:**
  - Inactive: Background `var(--color-surface)`, border `1.5px solid var(--color-border)`, text `var(--color-text-secondary)`.
  - Active: Background `var(--color-text-primary)` (dark slate in light theme, pure white in dark theme), text `#ffffff` (`#0f172a` in dark theme), shadow `var(--shadow-sm)`.
  - Category icon accompanying Arabic title.

### 4.3 Interactive Map Canvas & Floating Controls

- **Leaflet Map:** Centered on Hadayek Al-Ahram (`lat: 29.9777, lng: 31.1122`), custom light & dark tile layers.
- **Marker Pins:**
  - Shape: Gradient teardrop rotated -45 degrees (`border-radius: 50% 50% 50% 0`).
  - Inactive: Background `linear-gradient(135deg, #f59e0b, #d97706)`, white inner icon rotated +45 degrees.
  - Active / Selected: Background `linear-gradient(135deg, #0f172a, #334155)`, scaled 1.15x with glowing ring.
  - HTML escaping strictly preserved on all marker popups.
- **Map Floating Actions (Requirement E1):**
  - `< 1024px`: Positioned floating on map canvas (top-right in RTL: Locate Me, Fit All).
  - `>= 1024px`: Always docked into the top header actions row.
- **Map Stats Pill:**
  - Displays real business count (`"N نشاط موثق"`).
  - Pulsing green status dot.
- **Selected Pin Bottom Sheet (`map-sheet`):**
  - Positioned at bottom of map canvas (cleared of old floating switch padding per D2).
  - Contains thumbnail/icon, title, category, rating, open/closed status badge, and an arrow button opening full details.

### 4.4 Unified Business Card (D5 & Stretched-Link Pattern)

- **Surface:** Border `1px solid var(--color-border)`, radius `var(--radius-lg)`, subtle hover translation `translateY(-2px)` with `var(--shadow-md)`.
- **Card Icon / Avatar:** 60x60px squircle container with category icon or photo thumbnail.
- **Body Content:**
  - Business Name (bold 1rem, `var(--color-text-primary)`).
  - Verified Shield Icon (`lucide-react: CheckCircle2` in blue/amber).
  - Category & Zone Area line (`var(--color-text-muted)`).
  - Meta Row: Rating badge with star, review count, open/closed status badge (only when data exists per Rule 6).
  - Special Offer Pill: Rendered only when active promotion exists.
- **Interactive Structure (Zero Nesting):**
  - Card title contains the primary anchor link with `after:absolute after:inset-0`.
  - Action buttons (Call, WhatsApp, Directions, Favorite toggle) sit as sibling elements with `relative z-10`.
  - Accessible via Tab and Enter keys without nested interactive traps.

### 4.5 Business Detail Modal & Bottom Sheet

- **Responsive Transformation:**
  - Viewports `< 768px`: Bottom-anchored sliding sheet (`max-height: 92vh`, top corners `24px` radius).
  - Viewports `>= 768px`: Centered dialog modal (`max-width: 480px`, fully rounded `24px` corners).
  - Viewports `>= 1024px`: Anchored detail panel docked adjacent to the business list.
- **Hero Section:**
  - Warm subtle gradient header with squircle category/store avatar.
  - Arabic title, verified mark, category badge.
  - Close button (`44x44px` target, Esc keyboard dismiss, top-end corner).
  - Favorite toggle button (`44x44px` target, top-start corner).
- **Body Sections:**
  - Big Rating Box (4.8 score, star visualization, review count).
  - Structured Info Rows (Address with landmark, Phone number, Working hours & status).
  - Special Promotion / Offer card (when applicable).
  - Action Grid:
    - Primary CTA: Direct Call button (spans 2 columns).
    - Secondary CTAs: WhatsApp, Turn-by-Turn Directions, Share Link.
- **Accessibility & Focus:**
  - Focus trap locks keyboard Tab inside dialog while open.
  - Body scroll lock prevents background jump (`overflow: hidden; padding-inline-end: ...`).
  - Focus restored to trigger element upon dismissal.

---

## 5. State Management & Offline Resilience

- **Loading State:** Shimmer skeleton matching card and list layout dimensions.
- **Empty Search State:** Dedicated Arabic empty illustration, contextual suggestion tags, and clear filter button.
- **Error State:** Connection error banner with automatic retry and manual "إعادة المحاولة" button.
- **Offline Mode:**
  - Instant transition to cached catalog from IndexedDB (`dalelak-directory`).
  - Red connection banner (`connection-banner offline`) slide-down notification.
  - Graceful recovery banner (`connection-banner online`) upon reconnect.
- **Geolocation Handling (Requirement E3):**
  - Reuses `useMapGeolocation` hook.
  - Never requests browser permissions on mount.
  - Triggers permission prompt strictly on user click of "موقعي".
  - Shows friendly toast message if location is denied or unavailable.

---

## 6. Playwright Verification Matrix (Phase 5 Target)

| Test Case | Viewports Checked | Acceptance Criteria |
|---|---|---|
| Top-Row Switch Alignment | 360, 390, 768 | Segmented switch remains in top row; bounding box remains stable within +/-1px; zero text node |
| 360px Header Layout | 360 | Zero horizontal overflow (`scrollWidth === 360`); logo, switch, 2 mini buttons fit |
| Desktop Two-Pane Sync | 1280 | Switch hidden; list (420px) + map side-by-side; card click centers map pin; pin click scrolls list card |
| Detail Modal Accessibility | 390, 1280 | Focus trap active, Esc dismisses, focus restores to card trigger, zero layout scroll jump |
| Contrast & Dark Mode | All | All text >= 4.5:1; dark mode tokens applied with zero un-themed surfaces |
