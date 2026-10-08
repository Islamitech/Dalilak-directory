/* Bidi-truncate verification probe (verification only — no source changes).
   Renders the REAL card/info/drawer components (bundled with esbuild, production
   React, real compiled Tailwind CSS from dist) inside dir=rtl containers narrowed
   to force ellipsis truncation, then asserts CLIPPER-level geometry:

     pass = clipper computed direction matches the text's first-strong direction
            AND the first character's range rect is fully inside the clipper box
            AND truncation actually engaged (scrollWidth or first/last char rect
            proves the line overflows the clipper).

   The defective pattern `<clipper class="truncate"><bdi dir="auto">LATIN…` inside
   an RTL block places the bdi at the line's inline-start (RIGHT edge) and overflows
   LEFT, so the ellipsis clips the name START — detected here as firstCharRect.left
   < clipperRect.left. The canonical fix (doc-20, CompactVariant:50) puts
   dir="auto" on the CLIPPER itself: Latin-first resolves LTR → start at left edge.

   Name clipper cases under test:
     MapPopupVariant h4, SearchSuggestionsDropdown p, ActivityDetailFooter p,
     BuildingDetailDrawer div  (bdi-only — expected to FAIL before the fix)
   Span fixes from this batch (expected PASS):
     GridVariant area/offer spans, MapPopup location span, ActivityDetailInfo address
   Controls: CompactVariant h4[dir="auto"] with Arabic-first (rtl) and Latin-first (ltr).
   Temp entry/bundle/html are deleted on completion; screenshot + results.json stay. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = 'C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT';
const PW = path.join(ROOT, 'node_modules', 'playwright');
const { chromium } = require(PW);
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'verification', 'evidence', 'bidi');
fs.mkdirSync(OUT, { recursive: true });

const cssFile = fs.readdirSync(path.join(DIST, 'assets')).find((f) => /^index-.*\.css$/.test(f));
if (!cssFile) {
  console.error('dist/assets/index-*.css not found — run npm run build first');
  process.exit(1);
}

const ENTRY = path.join(ROOT, 'verification', '.tmp-bidi-entry.tsx');
const BUNDLE = path.join(ROOT, 'verification', '.tmp-bidi-bundle.js');
const HTML = path.join(ROOT, 'verification', '.tmp-bidi.html');

/* ---------- temp harness entry (deleted after the run) ---------- */
const entrySrc = String.raw`
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BusinessCardGridVariant } from '../src/features/business-details/components/BusinessCardGridVariant';
import { BusinessCardMapPopupVariant } from '../src/features/business-details/components/BusinessCardMapPopupVariant';
import { BusinessCardCompactVariant } from '../src/features/business-details/components/BusinessCardCompactVariant';
import { ActivityDetailInfo } from '../src/components/activity/ActivityDetailInfo';
import { ActivityDetailFooter } from '../src/components/activity/ActivityDetailFooter';
import { SearchSuggestionsDropdown } from '../src/features/search/components/SearchSuggestionsDropdown';
import { BuildingDetailDrawer } from '../src/components/map/BuildingDetailDrawer';
import type { Business } from '../src/types';

const noop = () => {};

const LONG_LATIN_STREET = 'Palm District St — Block C, Second Floor, Villa 12, Apartment 8, Suite 4-B';

const latinBiz = {
  id: 'bidi_latin',
  nameAr: 'Swan Clinic | د. إبراهيم بده للتغذية وعلاج السمنة والنحافة التكميلية',
  category: 'صيدلية',
  city: 'New Cairo',
  street: LONG_LATIN_STREET,
  governorate: 'القاهرة',
  notes: JSON.stringify({ offer: '20% OFF on all nutrition consultations this month only at Swan Clinic branches' }),
  workingHours: '',
} as unknown as Business;

const arabicBiz = {
  id: 'bidi_ar',
  nameAr: 'صيدلية الشفاء الدولية الحديثة لخدمات الرعاية الصحية المتكاملة على مدار الساعة بالكامل',
  category: 'صيدلية',
  city: 'حدائق الأهرام',
  street: 'منطقة ب — المحور المركزي',
  governorate: 'الجيزة',
  notes: JSON.stringify({ offer: 'خصم عشرون بالمئة على جميع خدمات التغذية العلاجية والاستشارات المجانية هذا الشهر فقط' }),
  workingHours: '',
} as unknown as Business;

/* Drawer fixture: no GPS on the business → zone match via street text
   'عمارة 77 منطقة ب' (matches zone ب) and exact building association via
   parseHadayekBuildingAddress → buildingNumber '77', zoneLetter 'ب'. */
const drawerBiz = {
  id: 'bidi_drawer',
  nameAr: 'Swan Clinic | د. إبراهيم بده للتغذية وعلاج السمنة والنحافة التكميلية',
  category: 'صيدلية',
  city: 'حدائق الأهرام',
  street: 'عمارة 77 منطقة ب',
  governorate: 'الجيزة',
} as unknown as Business;

const drawerBuilding = { buildingNumber: '77', zoneLetter: 'ب', lat: 29.979161, lng: 31.110693 };

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <div className="case" id="case-grid-latin">
      <BusinessCardGridVariant business={latinBiz} onOpenBusiness={noop} />
    </div>
    <div className="case" id="case-popup-latin">
      <BusinessCardMapPopupVariant business={latinBiz} onOpenBusiness={noop} onStartNavigation={noop} onClose={noop} />
    </div>
    <div className="case" id="case-info-latin">
      <ActivityDetailInfo business={latinBiz} effectiveUrl={null} />
    </div>
    <div className="case" id="case-compact-ar">
      <BusinessCardCompactVariant business={arabicBiz} onOpenBusiness={noop} />
    </div>
    <div className="case" id="case-compact-latin">
      <BusinessCardCompactVariant business={latinBiz} onOpenBusiness={noop} />
    </div>
    <div className="case" id="case-footer-latin">
      <ActivityDetailFooter
        business={latinBiz}
        similarPlaces={[latinBiz]}
        effectiveUrl={null}
        onShare={noop}
        copied={false}
        copyError={false}
        vCardSaved={false}
        onSaveContact={noop}
      />
    </div>
    <div className="case" id="case-suggest-latin">
      <div className="relative">
        <SearchSuggestionsDropdown
          suggestions={[latinBiz]}
          recentSearches={[]}
          searchQuery="swan"
          onSelectQuery={noop}
          onClearRecent={noop}
        />
      </div>
    </div>
    <div className="case" id="case-drawer-latin">
      <BuildingDetailDrawer
        building={drawerBuilding}
        onClose={noop}
        businesses={[drawerBiz]}
        onSelectBusiness={noop}
        onStartNavigation={noop}
      />
    </div>
  </React.StrictMode>
);
`;

(async () => {
  fs.writeFileSync(ENTRY, entrySrc);
  try {
    execFileSync(
      process.execPath,
      [
        path.join(ROOT, 'node_modules', 'esbuild', 'bin', 'esbuild'),
        ENTRY,
        '--bundle',
        '--jsx=automatic',
        '--format=iife',
        '--outfile=' + BUNDLE,
        '--define:process.env.NODE_ENV="production"',
        '--loader:.tsx=tsx',
      ],
      { stdio: 'inherit' }
    );

    const cssHref = 'file://' + path.join(DIST, 'assets', cssFile).replace(/\\/g, '/');
    const jsHref = 'file://' + BUNDLE.replace(/\\/g, '/');
    fs.writeFileSync(
      HTML,
      '<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">' +
        '<link rel="stylesheet" href="' + cssHref + '">' +
        '<style>body{background:#f8fafc;padding:12px}.case{width:300px;margin:14px auto}</style>' +
        '</head><body><div id="root"></div><script src="' + jsHref + '"></script></body></html>'
    );

    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 380, height: 2200 }, deviceScaleFactor: 2 });

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await page.goto('file://' + HTML.replace(/\\/g, '/'));
    await page.waitForSelector('#case-compact-latin h4', { timeout: 15000 });

    /* open the drawer's associated-businesses collapsible so its name rows mount */
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('#case-drawer-latin button')).find((b) =>
        (b.textContent || '').includes('الأنشطة والخدمات في نفس المبنى')
      );
      if (btn) btn.click();
    });
    await page.waitForSelector('#case-drawer-latin bdi', { timeout: 5000 });
    await page.waitForTimeout(500);

    const report = await page.evaluate(() => {
      const T = 1.5;

      function charRect(tn, idx) {
        const range = document.createRange();
        try {
          range.setStart(tn, idx);
          range.setEnd(tn, idx + 1);
        } catch {
          return null;
        }
        const rects = range.getClientRects();
        return rects.length ? rects[0] : null;
      }

      function checkOne(caseId, clipper, textEl, expectedDir) {
        const cs = getComputedStyle(clipper);
        const cr = clipper.getBoundingClientRect();
        const tn = textEl.firstChild;
        const len = (tn && tn.textContent ? tn.textContent.length : 0) || 0;
        const fr = tn ? charRect(tn, 0) : null;
        const lr = tn && len > 1 ? charRect(tn, len - 1) : fr;
        const inX = (r) => r && r.left >= cr.left - T && r.right <= cr.right + T;
        const outX = (r) => r && (r.right > cr.right + T || r.left < cr.left - T);
        const startVisible = inX(fr);
        const overflowActive =
          clipper.scrollWidth > clipper.clientWidth + 1 || outX(fr) || outX(lr);
        const dirAttr = clipper.getAttribute('dir');
        return {
          caseId,
          clipperClass: typeof clipper.className === 'string' ? clipper.className.slice(0, 60) : '',
          dirAttr: dirAttr === null ? '(none)' : dirAttr,
          direction: cs.direction,
          expectedDir,
          textHead: (textEl.textContent || '').slice(0, 15),
          clipperWidth: Math.round(cr.width),
          scrollWidth: clipper.scrollWidth,
          clientWidth: clipper.clientWidth,
          firstChar: fr ? { left: Math.round(fr.left * 10) / 10, right: Math.round(fr.right * 10) / 10 } : null,
          lastChar: lr ? { left: Math.round(lr.left * 10) / 10, right: Math.round(lr.right * 10) / 10 } : null,
          clipperBox: { left: Math.round(cr.left * 10) / 10, right: Math.round(cr.right * 10) / 10 },
          dirOk: cs.direction === expectedDir,
          startVisible,
          overflowActive,
          pass: cs.direction === expectedDir && startVisible && overflowActive,
        };
      }

      /* spec: find clipper(s) in case; textEl = inner bdi when textSel given, else clipper */
      const specs = [
        { caseId: '#case-grid-latin', clipperSel: 'span.truncate[dir="auto"]', textSel: null, expectedDir: 'ltr', label: 'grid: area + offer spans (dir=auto fix)' },
        { caseId: '#case-popup-latin', clipperSel: 'h4.truncate', textSel: 'bdi', expectedDir: 'ltr', label: 'map popup: Latin-first name (bdi-only clipper)' },
        { caseId: '#case-popup-latin', clipperSel: 'div.truncate', textSel: 'span[dir="auto"]', expectedDir: 'ltr', label: 'map popup: location line (explicit dir on truncating div)' },
        { caseId: '#case-info-latin', clipperSel: '.val.truncate[dir="auto"]', textSel: null, expectedDir: 'ltr', label: 'activity info: address value (dir=auto fix)' },
        { caseId: '#case-compact-ar', clipperSel: 'h4[dir]', textSel: 'bdi', expectedDir: 'rtl', label: 'compact control: Arabic-first resolves RTL (explicit dir)' },
        { caseId: '#case-compact-latin', clipperSel: 'h4[dir]', textSel: 'bdi', expectedDir: 'ltr', label: 'compact control: Latin-first resolves LTR (explicit dir)' },
        { caseId: '#case-footer-latin', clipperSel: 'p.truncate', textSel: 'bdi', expectedDir: 'ltr', label: 'activity footer: similar-place name (bdi-only clipper)' },
        { caseId: '#case-suggest-latin', clipperSel: 'p.truncate', textSel: 'bdi', expectedDir: 'ltr', label: 'search suggestions: name (bdi-only clipper)' },
        { caseId: '#case-drawer-latin', clipperSel: 'div.truncate', textSel: 'bdi', expectedDir: 'ltr', label: 'building drawer: business name (bdi-only clipper)' },
      ];

      const results = [];
      for (const spec of specs) {
        const clippers = Array.from(document.querySelectorAll(spec.caseId + ' ' + spec.clipperSel));
        let matched = 0;
        for (const clipper of clippers) {
          const textEl = spec.textSel ? clipper.querySelector(spec.textSel) : clipper;
          if (!textEl || !textEl.firstChild) continue;
          matched++;
          results.push({ label: spec.label, ...checkOne(spec.caseId, clipper, textEl, spec.expectedDir) });
        }
        if (matched === 0) results.push({ ...spec, pass: false, reason: 'no clipper with text found' });
      }
      return results;
    });

    await page.screenshot({ path: path.join(OUT, 'bidi-cases.png'), fullPage: true });
    await browser.close();

    const allPass = report.every((c) => c.pass) && pageErrors.length === 0;
    const results = {
      generatedAt: new Date().toISOString(),
      allPass,
      pageErrors,
      consoleErrors,
      checks: report,
    };
    fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));

    for (const c of report) {
      console.log(
        `${c.pass ? 'PASS' : 'FAIL'}  ${c.label}  [dir=${c.direction} expected=${c.expectedDir} attr=${c.dirAttr} start=${c.startVisible} overflow=${c.overflowActive} w=${c.clipperWidth}/${c.scrollWidth}] "${c.textHead}"`
      );
    }
    if (pageErrors.length) console.log('pageErrors:', pageErrors);
    console.log(allPass ? 'BIDI: ALL CHECKS PASS' : 'BIDI: FAILURES PRESENT');
    process.exit(allPass ? 0 : 1);
  } finally {
    for (const f of [ENTRY, BUNDLE, HTML]) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
