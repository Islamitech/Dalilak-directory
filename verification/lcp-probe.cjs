/* Lazy-LCP verification probe (verification only — no source changes).
   Measures whether the first above-the-fold card images are discoverable/eager with high fetch
   priority, and which element actually becomes LCP, on the real routes:
   - /search desktop 1440x900  (grid cards, 480x360 imgs)
   - /search mobile  390x844   (1-col grid; first cards above the fold)
   - /       desktop 1440x900  (two-pane: compact list + map; compact imgs are tiny -> LCP is text)
   Note: on mobile, "/" renders MapView (map-first, no card images in DOM at all) — that route is
   not an image-LCP surface, so the mobile image surface is /search.
   Fixtures: supabase /rest/v1/businesses intercepted with rows whose cover photos are served by
   this same server under /__lcp_img/<n>.png (solid-color real PNGs). Cross-origin fonts/gtag/tiles
   are aborted; unpkg Leaflet is fulfilled byte-identical from the CSP evidence vendor dir so the
   two-pane map still mounts on desktop home. Run twice: --label before (pre-fix dist) and
   --label after (post-fix dist); compare structurally + by LCP identity/timing. */
const fs = require('fs');
const path = require('path');
const http = require('http');
const zlib = require('zlib');

const ROOT = 'C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT';
const PW = path.join(ROOT, 'node_modules', 'playwright');
const { chromium } = require(PW);

const DIST = path.join(ROOT, 'dist');
const LABEL = (process.argv[process.argv.indexOf('--label') + 1] || 'run');
const OUT = path.join(ROOT, 'verification', 'evidence', 'lcp', LABEL);
const VENDOR = path.join(ROOT, 'verification', 'evidence', 'csp', 'vendor');
fs.mkdirSync(OUT, { recursive: true });

/* ---------- solid-color PNG fixture generator ---------- */
const CRC_TABLE = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
function crc32(buf) { let c = -1; for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, 'ascii'), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function solidPng(w, h, r, g, b) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit truecolor
  const row = Buffer.alloc(1 + w * 3); row[0] = 0; for (let x = 0; x < w; x++) { row[1 + x * 3] = r; row[2 + x * 3] = g; row[3 + x * 3] = b; }
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const COLORS = [[245, 158, 11], [100, 116, 139], [16, 185, 129], [244, 63, 94], [14, 165, 233], [139, 92, 246], [132, 204, 22], [236, 72, 153]];

/* ---------- fixtures (businesses with real local cover photos) ---------- */
const baseRow = { category: 'صيدلية', governorate: 'الجيزة', city: 'حدائق الأهرام', street: 'منطقة ب', phone: '01012345678', lat: 29.979184, lng: 31.106863, verification_status: 'verified', package_id: 'pkg_basic', created_at: '2026-09-01T00:00:00Z', description: 'وصف الاختبار', working_hours: '24 ساعة' };
const rows = Array.from({ length: 6 }, (_, i) => ({
  ...baseRow,
  id: `biz_lcp_${i + 1}`,
  name_ar: `صيدلية الاختبار ${i + 1}`,
  cover_photo: `/__lcp_img/${i + 1}.png`,
  photos: [`/__lcp_img/${i + 1}.png`],
  notes: JSON.stringify({ googleRatingEnabled: true, googleRating: 4.2 + i / 10, googleReviewsCount: 10 + i }),
}));

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml', '.map': 'application/json' };

function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = '/';
      try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch {}
      if (p.includes('..')) { res.writeHead(400); return res.end('bad'); }
      const imgMatch = p.match(/^\/__lcp_img\/(\d+)\.png$/);
      if (imgMatch) {
        const n = parseInt(imgMatch[1], 10);
        const [r, g, b] = COLORS[(n - 1) % COLORS.length];
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' });
        return res.end(solidPng(480, 360, r, g, b));
      }
      let filePath = path.normalize(path.join(DIST, p));
      if (p === '/' || !path.extname(p) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(DIST, 'index.html');
      }
      try {
        const body = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(body);
      } catch { res.writeHead(404); res.end('not found'); }
    });
    srv.listen(0, '127.0.0.1', () => resolve({ port: srv.address().port, close: () => new Promise((r) => srv.close(r)) }));
  });
}

async function measure(browser, port, { route, width, height, name, waitImgCount }) {
  const base = `http://127.0.0.1:${port}`;
  const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block' });
  const errors = [];
  context.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));

  await context.route('**/*', async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (u.pathname.includes('/rest/v1/businesses')) {
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'content-range': `0-${rows.length - 1}/${rows.length}` }, body: JSON.stringify(rows) });
    }
    if (u.hostname === 'unpkg.com') {
      const file = u.pathname.endsWith('.css') ? path.join(VENDOR, 'leaflet.css') : u.pathname.endsWith('.js') ? path.join(VENDOR, 'leaflet.js') : null;
      if (file && fs.existsSync(file)) {
        return route.fulfill({ status: 200, contentType: file.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(file) });
      }
      return route.abort('blockedbyclient');
    }
    if (u.hostname === '127.0.0.1' || u.hostname === 'localhost') {
      if (u.pathname.startsWith('/api/')) return route.fulfill({ contentType: 'application/json', body: '{}' });
      return route.continue();
    }
    return route.abort('blockedbyclient');
  });
  await context.routeWebSocket(/supabase/, (ws) => ws.close());

  await context.addInitScript(() => {
    window.__lcp = []; window.__fcp = null;
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp.push({ t: Math.round(e.startTime), size: e.size || 0, tag: e.element ? e.element.tagName : '', src: e.element && e.element.currentSrc ? e.element.currentSrc.split('/').pop().split('?')[0] : '' }); }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch {}
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (e.name === 'first-contentful-paint') window.__fcp = Math.round(e.startTime); } }).observe({ type: 'paint', buffered: true }); } catch {}
  });

  const page = await context.newPage();
  await page.goto(base + route, { waitUntil: 'domcontentloaded' });
  try { await page.waitForFunction((n) => document.querySelectorAll('img[src*="/__lcp_img/"]').length >= n, waitImgCount, { timeout: 15000 }); } catch {}
  await page.waitForTimeout(2500);
  const data = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')].filter((i) => (i.currentSrc || i.src).includes('/__lcp_img/')).slice(0, 4).map((i) => {
      const r = i.getBoundingClientRect();
      return { src: (i.currentSrc || i.src).split('/').pop().split('?')[0], loading: i.getAttribute('loading'), fetchPriority: i.getAttribute('fetchpriority'), complete: i.complete, naturalWidth: i.naturalWidth, inViewport: r.top < innerHeight && r.bottom > 0, w: Math.round(r.width), h: Math.round(r.height) };
    });
    const timing = performance.getEntriesByType('resource').filter((e) => e.name.includes('/__lcp_img/')).slice(0, 6).map((e) => ({ name: e.name.split('/').pop().split('?')[0], start: Math.round(e.startTime), responseEnd: Math.round(e.responseEnd), duration: Math.round(e.duration) }));
    return { imgs, timing, lcp: window.__lcp, fcp: window.__fcp };
  });
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
  await context.close();
  return { ...data, errors };
}

(async () => {
  const browser = await chromium.launch();
  const srv = await startServer();
  const R = { label: LABEL, dist: DIST, port: srv.port, scenarios: {} };

  R.scenarios.searchDesktop = await measure(browser, srv.port, { route: '/search', width: 1440, height: 900, name: 'search-desktop', waitImgCount: 2 });
  R.scenarios.homeDesktop = await measure(browser, srv.port, { route: '/', width: 1440, height: 900, name: 'home-desktop', waitImgCount: 2 });
  R.scenarios.searchMobile = await measure(browser, srv.port, { route: '/search', width: 390, height: 844, name: 'search-mobile', waitImgCount: 2 });

  /* ---------- structural + functional verdict for this dist ---------- */
  const checks = [];
  const add = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });
  const sc = R.scenarios;
  const first = (s) => (sc[s].imgs[0] || {});
  const second = (s) => (sc[s].imgs[1] || {});

  add('search-desktop: first two card images NOT lazy', first('searchDesktop').loading === 'eager' && second('searchDesktop').loading === 'eager', sc.searchDesktop.imgs.slice(0, 2));
  add('search-desktop: first card image fetchPriority=high', first('searchDesktop').fetchPriority === 'high', { fp0: first('searchDesktop').fetchPriority, fp1: second('searchDesktop').fetchPriority });
  add('search-desktop: LCP element is a card image', (sc.searchDesktop.lcp[sc.searchDesktop.lcp.length - 1] || {}).tag === 'IMG', sc.searchDesktop.lcp);
  add('search-mobile: first two card images NOT lazy', first('searchMobile').loading === 'eager' && second('searchMobile').loading === 'eager', sc.searchMobile.imgs.slice(0, 2));
  add('search-mobile: first card image fetchPriority=high', first('searchMobile').fetchPriority === 'high', { fp0: first('searchMobile').fetchPriority, fp1: second('searchMobile').fetchPriority });
  add('search-mobile: LCP element is a card image', (sc.searchMobile.lcp[sc.searchMobile.lcp.length - 1] || {}).tag === 'IMG', sc.searchMobile.lcp);
  add('home-desktop: first two compact images NOT lazy', first('homeDesktop').loading === 'eager' && second('homeDesktop').loading === 'eager', sc.homeDesktop.imgs.slice(0, 2));
  add('home-desktop: LCP identity recorded (informational)', sc.homeDesktop.lcp.length > 0, sc.homeDesktop.lcp);

  R.verdict = { label: LABEL, pass: checks.every((c) => c.pass), checks };
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(R, null, 2));
  await browser.close();
  await srv.close();

  console.log(`--- LCP probe (${LABEL}) ---`);
  for (const c of checks) console.log((c.pass ? 'PASS' : 'FAIL') + '  ' + c.name, JSON.stringify(c.detail).slice(0, 220));
  console.log(`verdict: ${R.verdict.pass ? 'STRUCTURAL PASS' : 'STRUCTURAL FAIL'}  -> ${path.join('verification', 'evidence', 'lcp', LABEL, 'results.json')}`);
  process.exit(0);
})().catch((e) => { console.error('PROBE ERROR', e); process.exit(2); });
