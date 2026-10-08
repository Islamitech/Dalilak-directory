/* Runtime re-verification of the external audit report (verification only — no source changes).
   Runs against local dist preview (127.0.0.1:4173) with intercepted Supabase fixtures,
   including a mixed-script record matching the reported "Swan Clinic | د. إبراهيم بده..." case. */
const fs = require('fs');
const path = require('path');
const PW = 'C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/node_modules/playwright';
const { chromium } = require(PW);

const BASE = process.env.AUDIT_BASE || 'http://127.0.0.1:4173';
const OUT = 'verification/evidence/audit-reverify';
fs.mkdirSync(OUT, { recursive: true });
const RESULTS = { meta: { base: BASE, startedAt: new Date().toISOString() }, scenarios: {}, csp: {}, errors: [] };
const save = () => fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(RESULTS, null, 2));

const baseRow = { category: 'صيدلية', governorate: 'الجيزة', city: 'حدائق الأهرام', street: 'منطقة ب', phone: '01012345678', lat: 29.979184, lng: 31.106863, verification_status: 'verified', package_id: 'pkg_basic', created_at: '2026-09-01T00:00:00Z', description: 'وصف الاختبار', notes: '{}' };
const rows = [
  { ...baseRow, id: 'biz_alpha', name_ar: 'صيدلية ألفا', working_hours: '24 ساعة', photos: ['https://fixture.test/a.svg'], cover_photo: 'https://fixture.test/a.svg', notes: JSON.stringify({ videos: ['https://fixture.test/video.mp4'], googleRatingEnabled: true, googleRating: 4.5, googleReviewsCount: 12 }) },
  { ...baseRow, id: 'biz_swan', name_ar: 'Swan Clinic | د. إبراهيم بده للتغذية وعلاج السمنة', working_hours: 'مغلق', photos: ['https://fixture.test/b.svg'], cover_photo: 'https://fixture.test/b.svg', notes: JSON.stringify({ googleRatingEnabled: true, googleRating: 4.9, googleReviewsCount: 128, googleMapsUrl: 'https://maps.google.com/?q=29.979,31.107' }) },
  { ...baseRow, id: 'biz_beta', name_ar: 'صيدلية بيتا', working_hours: 'مغلق', photos: [], created_at: '2026-08-01T00:00:00Z' },
];

const initExtra = () => {
  window.__opened = []; window.open = (url) => { window.__opened.push(String(url)); return null; };
  window.__lcp = []; window.__cls = 0; window.__fcp = null;
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp.push({ t: Math.round(e.startTime), size: e.size || 0, url: String(e.url || '').split('?')[0].slice(0, 90), tag: e.element ? e.element.tagName : '', cls: e.element ? String(e.element.className).slice(0, 120) : '' }); }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__fcp = Math.round(e.startTime); }).observe({ type: 'paint', buffered: true }); } catch {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch {}
};

async function setupViewport(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const net = [];
  await context.route('**/*', async (route) => {
    const req = route.request(); const u = new URL(req.url());
    let frame = 'main'; try { frame = req.frame().parentFrame() ? 'child' : 'main'; } catch { frame = 'unknown'; }
    net.push({ url: req.url().split('?')[0], host: u.hostname, type: req.resourceType(), frame });
    if (u.pathname.includes('/rest/v1/businesses')) {
      const id = u.searchParams.get('id')?.replace('eq.', '');
      const data = id ? rows.filter((r) => r.id === id) : rows;
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'content-range': `0-${Math.max(0, data.length - 1)}/${data.length}` }, body: JSON.stringify(data) });
    }
    if (u.hostname === 'fixture.test' || u.pathname === '/api/biz-og') return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="green"/><text x="30" y="60">PHOTO</text></svg>' });
    if (!['127.0.0.1', 'localhost'].includes(u.hostname)) return route.abort('blockedbyclient');
    if (u.pathname.startsWith('/api/')) return route.fulfill({ contentType: 'application/json', body: '{}' });
    return route.continue();
  });
  await context.routeWebSocket(/supabase/, (ws) => ws.close());
  await context.addInitScript(initExtra);
  const page = await context.newPage();
  page.setDefaultTimeout(7000);
  return { context, page, net };
}

const imgEval = () => [...document.images].map((im) => {
  const r = im.getBoundingClientRect();
  return { loading: im.getAttribute('loading'), fetchpriority: im.getAttribute('fetchpriority'), decoding: im.getAttribute('decoding'), alt: (im.alt || '').slice(0, 40), src: (im.currentSrc || im.src || '').split('?')[0].slice(0, 90), complete: im.complete, nw: im.naturalWidth, inViewport: r.top < window.innerHeight && r.bottom > 0 && r.left < window.innerWidth && r.right > 0, y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
});

const contrastEval = () => {
  const parse = (c) => { const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/); return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const L1 = lum(a), L2 = lum(b); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
  const effBg = (el) => { let n = el; while (n) { const bg = parse(getComputedStyle(n).backgroundColor); if (bg && bg.a > 0.95) return bg; n = n.parentElement; } return { r: 255, g: 255, b: 255, a: 1 }; };
  const out = [];
  for (const el of document.querySelectorAll('[class*="text-slate-400"],[class*="text-amber-600"],[class*="text-slate-500"]')) {
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
    const txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48); if (!txt) continue;
    const col = parse(cs.color); if (!col) continue;
    const bg = effBg(el);
    const size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const cr = ratio(col, bg);
    out.push({ cls: String(el.className).slice(0, 130), color: cs.color, bg: `rgb(${bg.r}, ${bg.g}, ${bg.b})`, size, weight, large, ratio: +cr.toFixed(2), pass: cr >= (large ? 3 : 4.5), text: txt, y: Math.round(r.y) });
  }
  return out;
};

const smallTargetsEval = () => {
  const els = [...document.querySelectorAll('a,button,[role="button"],input,select,summary')];
  const vis = els.filter((el) => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
  const t = (el) => { const r = el.getBoundingClientRect(); return { tag: el.tagName, text: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 42), w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.y) }; };
  const under24both = vis.filter((el) => { const r = el.getBoundingClientRect(); return r.height < 24 && r.width < 24; });
  const under24h = vis.filter((el) => el.getBoundingClientRect().height < 24);
  const under44 = vis.filter((el) => el.getBoundingClientRect().height < 44);
  return { total: vis.length, fail24_both_count: under24both.length, fail24_both: under24both.slice(0, 12).map(t), under24h_count: under24h.length, under24h: under24h.slice(0, 15).map(t), under44_count: under44.length, under44: under44.slice(0, 12).map(t) };
};

const clipEval = (sel) => {
  const root = sel ? document.querySelector(sel) : document;
  if (!root) return [];
  const out = [];
  for (const el of root.querySelectorAll('h1,h2,h3,h4,.truncate,[class*="line-clamp"]')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (!(el.scrollWidth > el.clientWidth + 1)) continue;
    const clamped = cs.webkitLineClamp && cs.webkitLineClamp !== 'none';
    const trunc = cs.textOverflow === 'ellipsis' && cs.overflowX !== 'visible';
    if (!clamped && !trunc) continue;
    const findText = (n) => { for (const c of n.childNodes) { if (c.nodeType === 3 && c.textContent.trim()) return c; if (c.nodeType === 1) { const r = findText(c); if (r) return r; } } return null; };
    const tn = findText(el); if (!tn) continue;
    const txt = tn.textContent;
    let f = 0; while (f < txt.length && /\s/.test(txt[f])) f++;
    let l = txt.length - 1; while (l > f && /\s/.test(txt[l])) l--;
    if (f >= txt.length) continue;
    const er = el.getBoundingClientRect();
    const range = document.createRange();
    range.setStart(tn, f); range.setEnd(tn, f + 1); const fr = range.getBoundingClientRect();
    range.setStart(tn, l); range.setEnd(tn, l + 1); const lr = range.getBoundingClientRect();
    const inside = (rr) => rr.width > 0 && rr.left >= er.left - 1 && rr.right <= er.right + 1;
    const firstVis = inside(fr), lastVis = inside(lr);
    const full = (el.textContent || '').trim();
    const bdi = el.querySelector('bdi');
    out.push({ tag: el.tagName, cls: String(el.className).slice(0, 130), dirAttr: el.getAttribute('dir') || null, dirCss: cs.direction, textOverflow: cs.textOverflow, lineClamp: cs.webkitLineClamp || null, scrollW: el.scrollWidth, clientW: el.clientWidth, text: full.slice(0, 90), firstChar: txt[f] || '', lastChar: txt[l] || '', firstVis, lastVis, ellipsisSide: !firstVis && lastVis ? 'start' : (firstVis && !lastVis ? 'end' : (!firstVis && !lastVis ? 'both' : null)), mixedScript: /[A-Za-z]/.test(full) && /[\u0600-\u06FF]/.test(full), bdiDir: bdi ? bdi.getAttribute('dir') : null, rectH: Math.round(er.height) });
  }
  return out;
};

function uniqNet(net) {
  const m = new Map();
  for (const n of net) { const k = `${n.type}|${n.host}|${n.frame}`; if (!m.has(k)) m.set(k, { type: n.type, host: n.host, frame: n.frame, sample: n.url.slice(0, 110), count: 0 }); m.get(k).count++; }
  return [...m.values()];
}

const dupContrast = (list) => {
  const m = new Map();
  for (const c of list) { const k = `${c.cls}|${c.color}|${c.bg}|${c.size}|${c.weight}`; if (!m.has(k)) m.set(k, { ...c, count: 1 }); else m.get(k).count++; }
  return [...m.values()].sort((a, b) => a.ratio - b.ratio);
};

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const guard = async (name, fn) => { try { await fn(); } catch (e) { RESULTS.errors.push({ scenario: name, error: String(e.message).slice(0, 400) }); console.error('ERR', name, String(e.message).slice(0, 300)); } save(); };

  // ---------- A. Desktop 1440x900 — /search: LCP, lazy imgs, contrast, modal iframe, media ----------
  await guard('desktop-search', async () => {
    const s = await setupViewport(b, { width: 1440, height: 900 });
    const A = {}; RESULTS.scenarios.desktop_search = A;
    await s.page.goto(BASE + '/search', { waitUntil: 'domcontentloaded' });
    await s.page.waitForSelector('text=صيدلية ألفا', { timeout: 8000 }).catch(() => {});
    await s.page.waitForTimeout(1200);
    A.rendered = await s.page.locator('article').count();
    A.lcp = await s.page.evaluate(() => ({ fcp: window.__fcp, cls: +window.__cls.toFixed(4), entries: window.__lcp }));
    A.images = await s.page.evaluate(imgEval);
    A.contrast = dupContrast(await s.page.evaluate(contrastEval));
    A.smallTargets = await s.page.evaluate(smallTargetsEval);
    await s.page.screenshot({ path: OUT + '/desktop-search.png' });
    await s.page.getByText('صيدلية ألفا', { exact: true }).first().click();
    await s.page.waitForTimeout(1000);
    A.modal = await s.page.evaluate(() => ({ dialogs: document.querySelectorAll('[role="dialog"]').length, iframes: [...document.querySelectorAll('iframe')].map((f) => (f.getAttribute('src') || '').split('?')[0].slice(0, 130)), videos: [...document.querySelectorAll('video')].map((v) => (v.currentSrc || v.src || '').split('?')[0].slice(0, 130)) }));
    A.frames = s.page.frames().map((f) => f.url().split('?')[0].slice(0, 130));
    await s.page.screenshot({ path: OUT + '/desktop-modal.png' });
    await s.page.keyboard.press('Escape'); await s.page.waitForTimeout(400);
    A.dialogsAfterEscape = await s.page.getByRole('dialog').count();
    try {
      await s.page.getByRole('button', { name: /مشاهدة الفيديو التعريفي/ }).first().click();
      await s.page.waitForTimeout(900);
      A.videoModal = await s.page.evaluate(() => ({ videos: [...document.querySelectorAll('video')].map((v) => (v.currentSrc || v.src || '').split('?')[0].slice(0, 130)) }));
      await s.page.keyboard.press('Escape'); await s.page.waitForTimeout(300);
    } catch (e) { A.videoModal = { error: String(e.message).slice(0, 160) }; }
    A.net = uniqNet(s.net);
    await s.context.close();
  });

  // ---------- B. Desktop 1440x900 — two-pane `/`: bidi truncate scan + contrast ----------
  await guard('desktop-home', async () => {
    const s = await setupViewport(b, { width: 1440, height: 900 });
    const B = {}; RESULTS.scenarios.desktop_home = B;
    await s.page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await s.page.waitForSelector('text=صيدلية ألفا', { timeout: 8000 }).catch(() => {});
    await s.page.waitForTimeout(1400);
    B.clip = await s.page.evaluate(clipEval, null);
    B.asideHeaders = await s.page.evaluate(() => [...document.querySelectorAll('aside h2,aside h3,aside h4')].map((el) => ({ tag: el.tagName, dirAttr: el.getAttribute('dir'), cls: String(el.className).slice(0, 110), text: (el.textContent || '').trim().slice(0, 80), scrollW: el.scrollWidth, clientW: el.clientWidth })));
    B.contrast = dupContrast(await s.page.evaluate(contrastEval));
    B.smallTargets = await s.page.evaluate(smallTargetsEval);
    B.net = uniqNet(s.net);
    await s.page.screenshot({ path: OUT + '/desktop-home.png' });
    await s.context.close();
  });

  // ---------- C. Mobile 390x844 — /search measures, /pricing button, manifest vs meta ----------
  await guard('mobile', async () => {
    const s = await setupViewport(b, { width: 390, height: 844 });
    const C = {}; RESULTS.scenarios.mobile = C;
    await s.page.goto(BASE + '/search', { waitUntil: 'domcontentloaded' });
    await s.page.waitForSelector('text=صيدلية ألفا', { timeout: 8000 }).catch(() => {});
    await s.page.waitForTimeout(1200);
    C.rendered = await s.page.locator('article').count();
    C.lcp = await s.page.evaluate(() => ({ fcp: window.__fcp, cls: +window.__cls.toFixed(4), entries: window.__lcp }));
    C.images = await s.page.evaluate(imgEval);
    C.contrast = dupContrast(await s.page.evaluate(contrastEval));
    C.smallTargets = await s.page.evaluate(smallTargetsEval);
    C.clip = await s.page.evaluate(clipEval, null);
    await s.page.screenshot({ path: OUT + '/mobile-search.png' });
    C.manifest = await s.page.evaluate(async () => { const r = await fetch('/manifest.json'); const j = await r.json(); return { background_color: j.background_color, theme_color: j.theme_color, name: j.name }; });
    C.metaTheme = await s.page.evaluate(() => document.querySelector('meta[name="theme-color"]')?.content || null);
    C.net = uniqNet(s.net);
    await s.context.close();

    const s2 = await setupViewport(b, { width: 390, height: 844 });
    await s2.page.goto(BASE + '/pricing', { waitUntil: 'domcontentloaded' });
    await s2.page.waitForTimeout(1300);
    C.pricing = {};
    C.pricing.url = s2.page.url();
    C.pricing.btn = await s2.page.evaluate(() => {
      const el = [...document.querySelectorAll('button,a')].find((x) => (x.textContent || '').includes('هل تبحث عن الإدراج المجاني'));
      if (!el) return null;
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      return { tag: el.tagName, rect: { w: Math.round(r.width), h: Math.round(r.height) }, fontSize: cs.fontSize, fontWeight: cs.fontWeight, padding: cs.padding, lineHeight: cs.lineHeight, text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60) };
    });
    C.pricing.contrast = dupContrast(await s2.page.evaluate(contrastEval));
    C.pricing.smallTargets = await s2.page.evaluate(smallTargetsEval);
    await s2.page.screenshot({ path: OUT + '/mobile-pricing.png' });
    await s2.context.close();
  });

  // ---------- D. Tablet 768x1024 — bottom-of-list WhatsApp float overlap ----------
  await guard('tablet', async () => {
    const s = await setupViewport(b, { width: 768, height: 1024 });
    const D = {}; RESULTS.scenarios.tablet = D;
    await s.page.goto(BASE + '/search', { waitUntil: 'domcontentloaded' });
    await s.page.waitForSelector('text=صيدلية ألفا', { timeout: 8000 }).catch(() => {});
    await s.page.waitForTimeout(1200);
    const measure = () => s.page.evaluate(() => {
      const wa = document.querySelector('a[href*="whatsapp"],a[href*="wa.me"],a[aria-label*="واتساب"]');
      const cards = [...document.querySelectorAll('article')];
      const last = cards[cards.length - 1];
      const more = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').includes('تحميل المزيد'));
      const r = (el) => el ? ((g) => ({ x: Math.round(g.x), y: Math.round(g.y), w: Math.round(g.width), h: Math.round(g.height), top: Math.round(g.top), bottom: Math.round(g.bottom), left: Math.round(g.left), right: Math.round(g.right) }))(el.getBoundingClientRect()) : null;
      const inter = (a, b) => { if (!a || !b) return 0; const w = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)); const h = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)); return w * h; };
      const waR = r(wa), lastR = r(last), moreR = r(more);
      return { wa: waR, waHref: wa ? (wa.getAttribute('href') || '').split('?')[0].slice(0, 60) : null, lastCard: lastR, moreBtn: moreR, overlapLast_px2: inter(waR, lastR), overlapMore_px2: inter(waR, moreR), scrollY: Math.round(window.scrollY), docH: document.documentElement.scrollHeight };
    });
    D.beforeScroll = await measure();
    await s.page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await s.page.waitForTimeout(800);
    D.atBottom = await measure();
    await s.page.screenshot({ path: OUT + '/tablet-bottom.png' });
    D.smallTargets = await s.page.evaluate(smallTargetsEval);
    await s.context.close();
  });

  // ---------- E. CSP diff: runtime origins vs vercel.json allowlists ----------
  try {
    const CSP = {
      script: { directive: 'script-src', entries: ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com', 'https://www.google-analytics.com'] },
      stylesheet: { directive: 'style-src', entries: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'] },
      font: { directive: 'font-src', entries: ["'self'", 'https://fonts.gstatic.com', 'data:'] },
      image: { directive: 'img-src', entries: ["'self'", 'data:', 'blob:', 'https:'] },
      fetch: { directive: 'connect-src', entries: ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co', 'https://www.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com', 'https://*.tile.openstreetmap.org', 'https://*.basemaps.cartocdn.com'] },
      xhr: { directive: 'connect-src', entries: ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co', 'https://www.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com', 'https://*.tile.openstreetmap.org', 'https://*.basemaps.cartocdn.com'] },
      websocket: { directive: 'connect-src', entries: ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co', 'https://www.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com', 'https://*.tile.openstreetmap.org', 'https://*.basemaps.cartocdn.com'] },
      media: { directive: "media-src (غير معرّف → default-src 'self')", entries: ["'self'"] },
      document: { directive: 'frame-src', entries: ["'self'", 'https://www.google.com', 'https://maps.google.com'] },
      other: { directive: 'default-src', entries: ["'self'"] },
    };
    const hostAllowed = (host, entries) => {
      for (const e of entries) {
        if (e === "'self'") { if (host === '127.0.0.1' || host === 'localhost') return true; continue; }
        if (e === 'data:' || e === 'blob:') continue;
        if (e === 'https:') return true;
        let h = e.replace(/^https:\/\//, '').replace(/^wss:\/\//, '');
        if (h.startsWith('*.')) { const bare = h.slice(2); if (host === bare || host.endsWith('.' + bare)) return true; }
        else if (host === h) return true;
      }
      return false;
    };
    const all = [];
    for (const sc of Object.values(RESULTS.scenarios)) if (sc.net) all.push(...sc.net);
    const seen = new Map();
    for (const n of all) {
      const key = `${n.type}|${n.host}|${n.frame}`;
      if (seen.has(key)) continue;
      const isDocMain = n.type === 'document' && n.frame !== 'child';
      if (isDocMain) continue;
      const conf = CSP[n.type] || CSP.other;
      const fixture = n.host === 'fixture.test' || n.host === '127.0.0.1' || n.host === 'localhost';
      seen.set(key, { type: n.type, host: n.host, frame: n.frame, directive: conf.directive, allowed: hostAllowed(n.host, conf.entries), fixture, sample: n.sample });
    }
    RESULTS.csp = { attempts: [...seen.values()], violations: [...seen.values()].filter((x) => !x.allowed && !x.fixture) };
  } catch (e) { RESULTS.errors.push({ scenario: 'csp', error: String(e.message).slice(0, 300) }); }

  save();
  console.log('DONE');
  console.log(JSON.stringify({ errors: RESULTS.errors, cspViolations: (RESULTS.csp.violations || []).map((v) => `${v.type}|${v.directive}|${v.host}|${v.frame}`) }, null, 2));
  await b.close();
})().catch((e) => { console.error(e); process.exitCode = 1; });
