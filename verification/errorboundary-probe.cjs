/* ErrorBoundary verification probe (verification only — no source changes).
   Bundles a temp entry with esbuild (production React) that mounts the REAL
   src/components/ErrorBoundary in two scenarios:
     #case-healthy — a healthy child must render through untouched
     #case-crash   — a child that throws during render must be intercepted and
                     replaced with the Arabic RTL fallback (reload CTA + home link)
   Asserts DOM presence, subtree isolation (healthy side unaffected), dir=rtl on
   the fallback, and that componentDidCatch logged the interception.
   Temp entry/bundle/html are deleted on completion; screenshot + results.json stay. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = 'C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT';
const PW = path.join(ROOT, 'node_modules', 'playwright');
const { chromium } = require(PW);
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'verification', 'evidence', 'errorboundary');
fs.mkdirSync(OUT, { recursive: true });

const cssFile = fs.readdirSync(path.join(DIST, 'assets')).find((f) => /^index-.*\.css$/.test(f));
if (!cssFile) {
  console.error('dist/assets/index-*.css not found — run npm run build first');
  process.exit(1);
}

const ENTRY = path.join(ROOT, 'verification', '.tmp-eb-entry.tsx');
const BUNDLE = path.join(ROOT, 'verification', '.tmp-eb-bundle.js');
const HTML = path.join(ROOT, 'verification', '.tmp-eb.html');

const entrySrc = String.raw`
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

const Thrower = (): React.ReactNode => {
  throw new Error('probe-boom');
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <div id="case-healthy">
      <ErrorBoundary>
        <p id="healthy-content">المحتوى السليم يظهر طبيعياً دون أي تغيير</p>
      </ErrorBoundary>
    </div>
    <div id="case-crash">
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
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
        '</head><body><div id="root"></div><script src="' + jsHref + '"></script></body></html>'
    );

    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 800, height: 900 }, deviceScaleFactor: 2 });

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await page.goto('file://' + HTML.replace(/\\/g, '/'));
    await page.waitForSelector('#case-crash button', { timeout: 15000 });
    await page.waitForTimeout(300);

    const report = await page.evaluate(() => {
      const crash = document.querySelector('#case-crash');
      const healthy = document.querySelector('#case-healthy');
      const fallback = crash && crash.querySelector('[dir="rtl"]');
      const texts = crash ? crash.textContent || '' : '';
      const healthyText = healthy ? healthy.textContent || '' : '';
      return {
        healthyChildRendered: healthyText.includes('المحتوى السليم يظهر طبيعياً'),
        healthySideClean: !healthyText.includes('تعذر تحميل الصفحة'),
        fallbackRendered: texts.includes('تعذر تحميل الصفحة'),
        reloadCta: Boolean(crash && crash.querySelector('button') && texts.includes('إعادة تحميل الصفحة')),
        homeLink: Boolean(
          crash && crash.querySelector('a[href="/"]') && texts.includes('العودة إلى الخريطة الرئيسية')
        ),
        fallbackRtl: Boolean(fallback && fallback.getAttribute('dir') === 'rtl'),
      };
    });

    await page.screenshot({ path: path.join(OUT, 'errorboundary.png'), fullPage: true });
    await browser.close();

    const expectations = [
      ['healthy subtree renders untouched', report.healthyChildRendered],
      ['healthy subtree isolated from crashing sibling', report.healthySideClean],
      ['Arabic fallback rendered for crashing subtree', report.fallbackRendered],
      ['reload CTA present', report.reloadCta],
      ['home link present', report.homeLink],
      ['fallback container dir=rtl', report.fallbackRtl],
    ];
    const didCatchLog = consoleErrors.some((t) => t.includes('ErrorBoundary') || t.includes('probe-boom'));
    expectations.push(['componentDidCatch logged interception', didCatchLog]);

    const checks = expectations.map(([name, pass]) => ({ name, pass }));
    const allPass = checks.every((c) => c.pass) && pageErrors.length === 0;
    const results = { generatedAt: new Date().toISOString(), allPass, pageErrors, report, checks };
    fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));

    for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}`);
    if (pageErrors.length) console.log('pageErrors:', pageErrors);
    console.log(allPass ? 'ERRORBOUNDARY: ALL CHECKS PASS' : 'ERRORBOUNDARY: FAILURES PRESENT');
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
