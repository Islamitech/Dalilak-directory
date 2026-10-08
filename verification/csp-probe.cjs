/* CSP enforcement probe (verification only — no source changes).
   Validates the completed CSP in vercel.json (single source of truth) by serving dist/ with the
   policy ENFORCED, then asserting 0 securitypolicyviolation events across all real user flows:
   home, /search + detail modal (OSM embed iframe + DB-driven video), /map (lazy Leaflet from
   unpkg, served byte-identical from vendor/ so SRI passes and the map fully initializes), /pricing.
   Plus a directive matrix per origin/resource type, and a negative-control run re-serving the OLD
   policy to prove the probe detects the exact gaps that motivated this fix
   (unpkg script/style, OSM frame, media-src fallback, nominatim/OSRM/GA-regional).
   Sandbox note: unpkg.com is unreachable from this machine, so the probe fulfills unpkg requests
   from verification/evidence/csp/vendor (jsdelivr npm dist — sha256 verified against the SRI
   hashes pinned in src/components/map/utils/leafletLoader.ts). */
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

const ROOT = 'C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT';
const PW = path.join(ROOT, 'node_modules', 'playwright');
const { chromium } = require(PW);

const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'verification', 'evidence', 'csp');
const VENDOR = path.join(OUT, 'vendor');
fs.mkdirSync(OUT, { recursive: true });

const OLD_POLICY =
  "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com; frame-src 'self' https://www.google.com https://maps.google.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self';";

const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const flatHeaders = vercel.headers.flatMap((h) => h.headers || []);
const enforcedHeader = flatHeaders.find((h) => h.key === 'Content-Security-Policy');
const reportOnlyHeader = flatHeaders.find((h) => h.key === 'Content-Security-Policy-Report-Only');
const NEW_POLICY = enforcedHeader ? enforcedHeader.value : null;

const sha256b64 = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('base64');
const vendor = {
  jsFile: path.join(VENDOR, 'leaflet.js'),
  cssFile: path.join(VENDOR, 'leaflet.css'),
  jsSha256: fs.existsSync(path.join(VENDOR, 'leaflet.js')) ? sha256b64(path.join(VENDOR, 'leaflet.js')) : null,
  cssSha256: fs.existsSync(path.join(VENDOR, 'leaflet.css')) ? sha256b64(path.join(VENDOR, 'leaflet.css')) : null,
};

/* ---------- fixtures (same as audit-reverify2) ---------- */
const baseRow = { category: 'صيدلية', governorate: 'الجيزة', city: 'حدائق الأهرام', street: 'منطقة ب', phone: '01012345678', lat: 29.979184, lng: 31.106863, verification_status: 'verified', package_id: 'pkg_basic', created_at: '2026-09-01T00:00:00Z', description: 'وصف الاختبار', notes: '{}' };
const rows = [
  { ...baseRow, id: 'biz_alpha', name_ar: 'صيدلية ألفا', working_hours: '24 ساعة', photos: ['https://fixture.test/a.svg'], cover_photo: 'https://fixture.test/a.svg', notes: JSON.stringify({ videos: ['https://fixture.test/video.mp4'], googleRatingEnabled: true, googleRating: 4.5, googleReviewsCount: 12 }) },
  { ...baseRow, id: 'biz_swan', name_ar: 'Swan Clinic | د. إبراهيم بده للتغذية وعلاج السمنة', working_hours: 'مغلق', photos: ['https://fixture.test/b.svg'], cover_photo: 'https://fixture.test/b.svg', notes: JSON.stringify({ googleRatingEnabled: true, googleRating: 4.9, googleReviewsCount: 128, googleMapsUrl: 'https://maps.google.com/?q=29.979,31.107' }) },
  { ...baseRow, id: 'biz_beta', name_ar: 'صيدلية بيتا', working_hours: 'مغلق', photos: [], created_at: '2026-08-01T00:00:00Z' },
];

/* ---------- directive matrix: every runtime origin × resource type ---------- */
const MATRIX = [
  { id: 'leaflet-js (unpkg)', kind: 'script', url: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', expOld: 'block' },
  { id: 'leaflet-css (unpkg)', kind: 'style', url: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', expOld: 'block' },
  { id: 'osm-embed-iframe', kind: 'frame', url: 'https://www.openstreetmap.org/export/embed.html?bbox=31.098%2C29.973%2C31.114%2C29.985&layer=mapnik', expOld: 'block' },
  { id: 'db-external-video', kind: 'media', url: 'https://fixture.test/video.mp4', expOld: 'block' },
  { id: 'nominatim-geocode', kind: 'fetch', url: 'https://nominatim.openstreetmap.org/search?format=json&q=cairo', expOld: 'block' },
  { id: 'osrm-route', kind: 'fetch', url: 'https://router.project-osrm.org/route/v1/driving/31.10,29.97;31.20,30.00?overview=false', expOld: 'block' },
  { id: 'ga4-regional-beacon', kind: 'fetch', url: 'https://region1.google-analytics.com/g/collect?v=2&tid=G-1EH17YQTVR', expOld: 'block' },
  { id: 'tile-osm-fr', kind: 'img', url: 'https://a.tile.openstreetmap.fr/hot/15/24327/13663.png', expOld: 'allow' },
  { id: 'tile-google-mt', kind: 'img', url: 'https://mt0.google.com/vt/lyrs=m&x=24327&y=13663&z=15', expOld: 'allow' },
  { id: 'supabase-rest', kind: 'fetch', url: 'https://xdqpbajymacpdccorjcj.supabase.co/rest/v1/businesses?select=id&limit=1', expOld: 'allow' },
  { id: 'gtag-js', kind: 'script', url: 'https://www.googletagmanager.com/gtag/js?id=G-1EH17YQTVR', expOld: 'allow' },
  { id: 'google-fonts-css', kind: 'style', url: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap', expOld: 'allow' },
];

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml', '.map': 'application/json' };

function startServer(policy) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = '/';
      try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch {}
      if (p.includes('..')) { res.writeHead(400); return res.end('bad'); }
      let filePath = path.normalize(path.join(DIST, p));
      let isHtml = false;
      if (p === '/' || !path.extname(p) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(DIST, 'index.html');
      }
      if (filePath === path.join(DIST, 'index.html')) isHtml = true;
      try {
        const body = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' };
        if (isHtml) headers['Content-Security-Policy'] = policy;
        res.writeHead(200, headers);
        res.end(body);
      } catch {
        res.writeHead(404); res.end('not found');
      }
    });
    srv.listen(0, '127.0.0.1', () => resolve({ port: srv.address().port, close: () => new Promise((r) => srv.close(r)) }));
  });
}

async function setup(browser, port) {
  const base = `http://127.0.0.1:${port}`;
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  const net = [];
  const consoleErrors = [];
  let docCspHeader = null;

  context.on('response', (resp) => {
    try {
      if (resp.url().startsWith(base) && String(resp.headers()['content-type'] || '').includes('text/html')) {
        const h = resp.headers()['content-security-policy'];
        if (h) docCspHeader = h.slice(0, 60);
      }
    } catch {}
  });

  await context.route('**/*', async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    net.push({ url: req.url().split('?')[0], host: u.hostname, type: req.resourceType() });

    if (u.pathname.includes('/rest/v1/businesses')) {
      const id = u.searchParams.get('id')?.replace('eq.', '');
      const data = id ? rows.filter((r) => r.id === id) : rows;
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'content-range': `0-${Math.max(0, data.length - 1)}/${data.length}` }, body: JSON.stringify(data) });
    }
    if (u.hostname === 'unpkg.com') {
      const file = u.pathname.endsWith('.css') ? vendor.cssFile : u.pathname.endsWith('.js') ? vendor.jsFile : null;
      if (file && fs.existsSync(file)) {
        // ACAO required: the loader fetches unpkg with crossOrigin='' (anonymous CORS)
        return route.fulfill({ status: 200, contentType: file.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(file) });
      }
      return route.abort('blockedbyclient');
    }
    if (u.hostname === 'fixture.test' || u.pathname === '/api/biz-og') {
      if (u.pathname.endsWith('.mp4')) return route.fulfill({ status: 200, contentType: 'video/mp4', body: '' });
      return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="green"/><text x="30" y="60">PHOTO</text></svg>' });
    }
    if (u.hostname === '127.0.0.1' || u.hostname === 'localhost') {
      if (u.pathname.startsWith('/api/')) return route.fulfill({ contentType: 'application/json', body: '{}' });
      return route.continue();
    }
    return route.abort('blockedbyclient');
  });
  await context.routeWebSocket(/supabase/, (ws) => ws.close());

  await context.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__csp.push({
        directive: e.effectiveDirective || e.violatedDirective,
        violated: e.violatedDirective,
        blocked: (e.blockedURI || '').split('?')[0].slice(0, 120),
        doc: location.pathname,
        line: e.lineNumber,
      });
    });
  });

  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().replace(/sb_(?:publishable|secret)_[\w-]+/g, '[REDACTED]').slice(0, 260)); });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + String(e.message).slice(0, 260)));

  return { base, context, page, net, consoleErrors, getHeader: () => docCspHeader };
}

async function runSuite(browser, port, mode) {
  const S = await setup(browser, port);
  const R = { cspHeaderSeen: null, steps: {}, matrix: [], net: [] };
  const BASE = S.base;

  // 1) home
  await S.page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await S.page.waitForSelector('text=صيدلية ألفا', { timeout: 9000 }).catch(() => {});
  await S.page.waitForTimeout(1600);
  R.cspHeaderSeen = S.getHeader();
  R.steps.home = await S.page.evaluate(() => ({ violations: window.__csp }));
  await S.page.screenshot({ path: path.join(OUT, `${mode}-home.png`) });

  // 2) search + detail modal (OSM embed iframe + DB video)
  await S.page.goto(BASE + '/search', { waitUntil: 'domcontentloaded' });
  await S.page.waitForSelector('text=صيدلية ألفا', { timeout: 9000 }).catch(() => {});
  await S.page.waitForTimeout(1200);
  await S.page.getByText('صيدلية ألفا', { exact: true }).first().click().catch(() => {});
  await S.page.waitForTimeout(1400);
  R.steps.search_modal = await S.page.evaluate(() => ({
    violations: window.__csp,
    iframes: [...document.querySelectorAll('iframe')].map((f) => ({ src: (f.getAttribute('src') || '').split('?')[0], w: Math.round(f.getBoundingClientRect().width) })),
  }));
  const dialog = S.page.locator('[role="dialog"]').first();
  const pillCount = await dialog.getByRole('button', { name: 'فيديو', exact: true }).count().catch(() => 0);
  let videoClicked = false;
  if (pillCount > 0) {
    try { await dialog.getByRole('button', { name: 'فيديو', exact: true }).first().click({ timeout: 4000 }); videoClicked = true; } catch {}
  }
  await S.page.waitForTimeout(1300);
  R.steps.video = await S.page.evaluate((clicked) => ({
    clicked,
    pillFound: window.__pillFound,
    violations: window.__csp,
    dialogs: document.querySelectorAll('[role="dialog"]').length,
    videos: [...document.querySelectorAll('video')].map((v) => ({ src: (v.currentSrc || v.getAttribute('src') || '').split('?')[0], networkState: v.networkState, readyState: v.readyState, error: v.error ? v.error.code : null, w: Math.round(v.getBoundingClientRect().width) })),
  }), videoClicked);
  R.steps.video.pillCount = pillCount;
  await S.page.screenshot({ path: path.join(OUT, `${mode}-search-video.png`) });
  await S.page.keyboard.press('Escape');
  await S.page.waitForTimeout(400);

  // 3) map (lazy Leaflet via unpkg + tiles)
  await S.page.goto(BASE + '/map', { waitUntil: 'domcontentloaded' });
  await S.page.waitForTimeout(4000);
  R.steps.map = await S.page.evaluate(() => ({
    violations: window.__csp,
    leaflet: {
      L: typeof window.L !== 'undefined',
      scriptInjected: !!document.querySelector('script[src*="unpkg.com/leaflet"]'),
      cssInjected: !!document.querySelector('link[href*="unpkg.com/leaflet"]'),
    },
    mapContainers: document.querySelectorAll('.leaflet-container').length,
    tileImgs: document.querySelectorAll('img[src*="tile.openstreetmap.fr"]').length,
  }));
  R.steps.map.tileNetAttempts = S.net.filter((n) => n.host.includes('tile.openstreetmap')).length;
  await S.page.screenshot({ path: path.join(OUT, `${mode}-map.png`) });

  // 4) pricing
  await S.page.goto(BASE + '/pricing', { waitUntil: 'domcontentloaded' });
  await S.page.waitForTimeout(1500);
  R.steps.pricing = await S.page.evaluate(() => ({ violations: window.__csp }));
  await S.page.screenshot({ path: path.join(OUT, `${mode}-pricing.png`) });

  // 5) directive matrix
  R.matrix = await S.page.evaluate(async (cases) => {
    const out = [];
    for (const c of cases) {
      await new Promise((r) => setTimeout(r, 200));
      const before = window.__csp.length;
      try {
        if (c.kind === 'fetch') fetch(c.url, { mode: 'no-cors', cache: 'no-store' }).catch(() => {});
        else if (c.kind === 'script') { const s = document.createElement('script'); s.src = c.url; s.async = true; document.head.appendChild(s); }
        else if (c.kind === 'style') { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = c.url; document.head.appendChild(l); }
        else if (c.kind === 'img') { const i = new Image(); i.src = c.url; }
        else if (c.kind === 'media') { const v = document.createElement('video'); v.preload = 'metadata'; v.src = c.url; document.body.appendChild(v); }
        else if (c.kind === 'frame') { const f = document.createElement('iframe'); f.style.cssText = 'width:4px;height:4px;position:fixed;left:-10px;top:-10px'; f.src = c.url; document.body.appendChild(f); }
      } catch {}
      await new Promise((r) => setTimeout(r, 650));
      const after = window.__csp.slice(before);
      out.push({ id: c.id, kind: c.kind, url: c.url, blocked: after.length > 0, hits: after.map((v) => ({ directive: v.directive, violated: v.violated, blocked: v.blocked })) });
    }
    return out;
  }, MATRIX);

  R.net = [...new Set(S.net.map((n) => `${n.type}|${n.host}`))].sort();
  R.consoleErrorsTail = S.consoleErrors.slice(-8);
  await S.context.close();
  return R;
}

(async () => {
  const RESULTS = {
    meta: {
      startedAt: new Date().toISOString(),
      policyFromVercelJson: NEW_POLICY,
      oldPolicyNegativeControl: OLD_POLICY,
      enforcedHeaderFound: !!enforcedHeader,
      reportOnlyHeaderPresent: !!reportOnlyHeader,
      vendorLeaflet: { source: 'cdn.jsdelivr.net npm leaflet@1.9.4 dist (byte-identical to unpkg)', jsSha256: vendor.jsSha256, cssSha256: vendor.cssSha256, expectedJs: '20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=', expectedCss: 'p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=' },
      distBuilt: fs.existsSync(path.join(DIST, 'index.html')),
    },
    runs: {},
    verdict: null,
  };
  const save = () => fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(RESULTS, null, 2));
  save();

  if (!NEW_POLICY) { console.error('FATAL: no enforced Content-Security-Policy header found in vercel.json'); process.exit(1); }

  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });

  const srvNew = await startServer(NEW_POLICY);
  console.log('--- run 1/2: NEW enforced policy on port', srvNew.port);
  RESULTS.runs.newPolicy = await runSuite(browser, srvNew.port, 'new');
  save();

  const srvOld = await startServer(OLD_POLICY);
  console.log('--- run 2/2: OLD policy (negative control) on port', srvOld.port);
  RESULTS.runs.oldPolicyControl = await runSuite(browser, srvOld.port, 'old');
  save();

  await srvNew.close();
  await srvOld.close();
  await browser.close();

  /* ---------- verdict ---------- */
  const checks = [];
  const add = (name, pass, detail) => checks.push({ name, pass: !!pass, detail: detail === undefined ? undefined : detail });
  const vlen = (run, step) => ((RESULTS.runs[run].steps[step] || {}).violations || []).length;
  const newAll = (k) => RESULTS.runs.newPolicy.steps[k] || {};
  const oldAll = (k) => RESULTS.runs.oldPolicyControl.steps[k] || {};

  add('vercel.json: enforced Content-Security-Policy present', !!enforcedHeader);
  add('vercel.json: Report-Only header removed', !reportOnlyHeader);
  add('probe: vendor leaflet.js sha256 matches pinned SRI', vendor.jsSha256 === RESULTS.meta.vendorLeaflet.expectedJs, vendor.jsSha256);
  add('probe: vendor leaflet.css sha256 matches pinned SRI', vendor.cssSha256 === RESULTS.meta.vendorLeaflet.expectedCss, vendor.cssSha256);
  add('new: CSP header actually delivered on document', !!RESULTS.runs.newPolicy.cspHeaderSeen, RESULTS.runs.newPolicy.cspHeaderSeen);

  add('new|home: 0 violations', vlen('newPolicy', 'home') === 0, (newAll('home').violations || []).slice(0, 4));
  add('new|search+modal: 0 violations (OSM iframe allowed)', vlen('newPolicy', 'search_modal') === 0, (newAll('search_modal').violations || []).slice(0, 4));
  add('new|search+modal: OSM iframe rendered', ((newAll('search_modal').iframes || []).some((f) => f.src.includes('openstreetmap.org'))), newAll('search_modal').iframes);
  add('new|video modal: opened + video element present', newAll('video').dialogs >= 2 && (newAll('video').videos || []).length > 0, { dialogs: newAll('video').dialogs, videos: newAll('video').videos });
  add('new|video modal: 0 violations (media-src covers external video)', vlen('newPolicy', 'video') === 0, (newAll('video').violations || []).slice(0, 4));
  add('new|map: Leaflet initialized (script+SRI ok under CSP)', !!(newAll('map').leaflet || {}).L, newAll('map').leaflet);
  add('new|map: map container + tile requests attempted', (newAll('map').mapContainers || 0) > 0 && (newAll('map').tileNetAttempts || 0) > 0, { containers: newAll('map').mapContainers, tileNetAttempts: newAll('map').tileNetAttempts, tileImgs: newAll('map').tileImgs });
  add('new|map: 0 violations (unpkg + tiles allowed)', vlen('newPolicy', 'map') === 0, (newAll('map').violations || []).slice(0, 4));
  add('new|pricing: 0 violations', vlen('newPolicy', 'pricing') === 0, (newAll('pricing').violations || []).slice(0, 4));

  const matrixNew = RESULTS.runs.newPolicy.matrix;
  add('new|matrix: every runtime origin allowed (0 blocks)', matrixNew.every((m) => !m.blocked), matrixNew.filter((m) => m.blocked));

  const matrixOld = RESULTS.runs.oldPolicyControl.matrix;
  const oldBlocks = matrixOld.filter((m) => m.blocked).map((m) => m.id);
  const oldAllows = matrixOld.filter((m) => !m.blocked).map((m) => m.id);
  const expBlock = MATRIX.filter((m) => m.expOld === 'block').map((m) => m.id);
  const expAllow = MATRIX.filter((m) => m.expOld === 'allow').map((m) => m.id);
  add('old-control|matrix: all expected gaps blocked', expBlock.every((id) => oldBlocks.includes(id)), { expected: expBlock, blocked: oldBlocks });
  add('old-control|matrix: all expected allows stay allowed', expAllow.every((id) => oldAllows.includes(id)), { expected: expAllow, allowed: oldAllows });
  add('old-control|search+modal: OSM frame block reproduced', ((oldAll('search_modal').violations || []).some((v) => (v.blocked || '').includes('openstreetmap.org'))), (oldAll('search_modal').violations || []).slice(0, 4));
  add('old-control|map: unpkg blocks reproduced', ((oldAll('map').violations || []).some((v) => (v.blocked || '').includes('unpkg.com'))), (oldAll('map').violations || []).filter((v) => (v.blocked || '').includes('unpkg')).slice(0, 4));
  add('old-control|video: external media block reproduced', ((oldAll('video').violations || []).some((v) => (v.blocked || '').includes('fixture.test') || v.directive === 'media-src')), (oldAll('video').violations || []).slice(0, 4));

  RESULTS.verdict = { pass: checks.every((c) => c.pass), passed: checks.filter((c) => c.pass).length, total: checks.length, checks };
  save();

  console.log('\n===== CSP VERDICT =====');
  for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass || c.detail === undefined ? '' : '  -> ' + JSON.stringify(c.detail)}`);
  console.log(`TOTAL: ${RESULTS.verdict.passed}/${RESULTS.verdict.total} — ${RESULTS.verdict.pass ? 'ALL GREEN' : 'FAILURES PRESENT'}`);
  console.log('evidence: ' + path.join(OUT, 'results.json'));
  process.exit(RESULTS.verdict.pass ? 0 : 2);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
