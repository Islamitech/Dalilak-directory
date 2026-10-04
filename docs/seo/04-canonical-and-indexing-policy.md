# Canonicalization, Faceted Indexing, and De-duplication Policy

## 1. Executive Summary
This document establishes the definitive canonicalization, URL structure, indexing hygiene, and de-duplication policies for the Dalilak Public Directory (`www.dalilaak.com`), fulfilling **Phase E (Items 5 & 6)** of the SEO overhaul specification.

---

## 2. Canonical URL Decision & Architecture

### 2.1 Static Landing Pages
| Page | Route | Canonical URL | Indexing Directive |
| :--- | :--- | :--- | :--- |
| Home | `/` | `https://www.dalilaak.com/` | `index, follow` |
| About | `/about` | `https://www.dalilaak.com/about` | `index, follow` |
| Pricing | `/pricing` | `https://www.dalilaak.com/pricing` | `index, follow` |
| Add Business | `/for-business` | `https://www.dalilaak.com/for-business` | `index, follow` |
| Search Main | `/search` | `https://www.dalilaak.com/search` | `index, follow` |
| Interactive Map | `/map` | `https://www.dalilaak.com/map` | `index, follow` |
| Privacy Policy | `/privacy` | `https://www.dalilaak.com/privacy` | `index, follow` |

### 2.2 Category & Zone Facets Decision
* **Decision**: Index high-intent category hubs (`/search?cat=<cat>`) and primary zone hubs (`/search?zone=<zone>`) with **self-referential canonicals**, unique meta titles, unique meta descriptions, and semantic server-side crawler snapshots.
* **Why**: Users in Egypt frequently search for localized intents like *"مطاعم في حدائق الأهرام"* or *"صيدليات البوابة الرابعة"*. Canonicalizing category pages back to `/search` would cause Google to treat them as duplicates of the generic directory root, discarding valuable high-intent landing pages.
* **Rule**:
  - `https://www.dalilaak.com/search?cat=food` has `<link rel="canonical" href="https://www.dalilaak.com/search?cat=food" />`.
  - `https://www.dalilaak.com/search?zone=%D8%A3` has `<link rel="canonical" href="https://www.dalilaak.com/search?zone=%D8%A3" />`.
  - Sub-filters (sorting, arbitrary query terms `q=...`, pagination) that generate thin or duplicate results MUST serve `<meta name="robots" content="noindex, follow" />`.

### 2.3 Business Detail Pages (`/biz/:slug`)
* Canonical format: `https://www.dalilaak.com/biz/<publicBusinessSlug>`
* Example: `https://www.dalilaak.com/biz/%D9%85%D8%B7%D8%B9%D9%85-%D8%A3%D9%86%D8%AF%D9%84%D8%B3%D9%8A%D8%A9-biz_sample_restaurant_1`
* Query parameters on business pages (e.g. tracking `?utm_source=...`, `?ref=...`) are stripped from the canonical tag, ensuring clean consolidation of link equity.

---

## 3. Indexing Hygiene: 410 Gone vs 404 Not Found

### 3.1 Deleted Businesses (HTTP 410 Gone)
* When a business record exists in the database with `is_deleted = true`, the serverless renderer (`api/share.ts` via `findPublicBusinessWithStatus`) returns **HTTP 410 (Gone)** with:
  ```html
  <meta name="robots" content="noindex, nofollow" />
  ```
* **Rationale**: Googlebot recognizes HTTP 410 as permanent removal, removing the URL from Google Search index faster and with fewer re-crawls than a standard 404.

### 3.2 Non-Existent Records (HTTP 404 Not Found)
* Unknown identifiers or invalid IDs return standard HTTP 404 (Not Found).

### 3.3 Hostile Input / Exploit Defense
* Inputs exceeding 250 characters or containing `<script>`, `onerror=`, `alert(`, or SQL injection syntax are intercepted immediately before DB lookup and return HTTP 404 without reflecting raw unescaped payloads.

---

## 4. De-duplication & 301 Permanent Redirect Mapping

When identical businesses exist due to rapid duplicate submissions, they are merged by redirecting the duplicate entity ID to the primary canonical entity via HTTP 301.

### Current Mapping Table (`api/share.ts`)
```typescript
const DUPLICATE_REDIRECTS: Record<string, string> = {
  // Same dentist clinic submitted twice 10s apart
  'biz_atlas_1789859443844_ocx4v': 'biz_atlas_1789859433981_gagii',
};
```
* **Response Header**: `Cache-Control: public, max-age=31536000, immutable`
* **Status**: `301 Moved Permanently`
* **Destination**: `/biz/<targetId>`

---

## 5. Sitemap XML Rules & Hygiene

1. **No Duplicate Parameter URLs**: Each indexable URL appears exactly once.
2. **Exclusion of Non-Indexables**:
   - `is_deleted = true` records are strictly excluded.
   - `publishedStatus = 'draft'` or `'unlisted'` records are strictly excluded.
   - Lead packages (`pkg_interested_lead`) are strictly excluded.
3. **Truthful `lastmod`**:
   - Static pages use the actual deployment / release timestamp (`2026-10-04`).
   - Business URLs use the real `updated_at` or `created_at` timestamp.
   - Dynamic `new Date().toISOString()` is prohibited to prevent false freshness penalties in Google Search Console.
4. **Size and Scale Limit**:
   - Current count: ~2,050 URLs (< 5,000 threshold).
   - If directory grows past 5,000 URLs, automatic sitemap index chunking will activate.
