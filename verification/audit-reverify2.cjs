/* Follow-up probe #2 (verification only — no source changes).
   Closes 4 anomalies from run #1:
   A) contrast audit returned [] (Tailwind v4 oklch colors) -> oklch-safe parser + composited effective bg
   B) CLS attribution on mobile (0.81) / desktop (0.056) via layout-shift sources + fast-paint-shell check
   C) tablet "WhatsApp float" was actually a card link -> correct selector a[aria-label="WhatsApp"]
   D) video modal probe used a non-existent label -> real trigger is button «فيديو» (ActivityDetailHeader.tsx:64-72) */
const fs = require('fs');
const path = require('path');
const PW = 'C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT/node_modules/playwright';
const { chromium } = require(PW);

const BASE = process.env.AUDIT_BASE || 'http://127.0.0.1:4173';
const OUT = 'verification/evidence/audit-reverify2';
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
  window.__lcp = []; window.__fcp = null; window.__shifts = [];
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp.push({ t: Math.round(e.startTime), size: e.size || 0, tag: e.element ? e.element.tagName : '', cls: e.element ? String(e.element.className).slice(0, 140) : '', id: e.element ? e.element.id || '' : '' }); }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__fcp = Math.round(e.startTime); }).observe({ type: 'paint', buffered: true }); } catch {}
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        const srcs = (e.sources || []).slice(0, 5).map((s) => {
          const n = s.node;
          return {
            tag: n ? n.tagName : '(null)',
            id: n ? n.id || '' : '',
            cls: n ? String(n.className || '').slice(0, 100) : '',
            txt: n ? (n.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50) : '',
            sig: n ? `${n.tagName}${n.id ? '#' + n.id : ''}|${String(n.className || '').slice(0, 70)}` : '(null-node)',
            prev: s.previousRect ? { x: Math.round(s.previousRect.x), y: Math.round(s.previousRect.y), w: Math.round(s.previousRect.width), h: Math.round(s.previousRect.height) } : null,
            cur: s.currentRect ? { x: Math.round(s.currentRect.x), y: Math.round(s.currentRect.y), w: Math.round(s.currentRect.width), h: Math.round(s.currentRect.height) } : null,
          };
        });
        window.__shifts.push({ value: +e.value.toFixed(4), t: Math.round(e.startTime), recent: e.hadRecentInput, sources: srcs });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {}
};

async function setupViewport(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const net = []; const consoleErrors = [];
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
  page.on('pageerror', (e) => consoleErrors.push({ kind: 'pageerror', msg: String(e.message).slice(0, 300) }));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push({ kind: 'console', msg: m.text().replace(/sb_(?:publishable|secret)_[\w-]+/g, '[REDACTED]').slice(0, 300) }); });
  return { context, page, net, consoleErrors };
}

/* ---------- contrast v2: oklch-safe ---------- */
const contrastEval2 = () => {
  const ctx = document.createElement('canvas').getContext('2d');
  const canvasNorm = (c) => {
    try { ctx.fillStyle = '#010203'; ctx.fillStyle = c; const s = ctx.fillStyle; } catch { return null; }
    try {
      const s = ctx.fillStyle;
      const h = s.match(/^#([0-9a-f]{6})$/i);
      if (h) return { r: parseInt(h[1].slice(0, 2), 16), g: parseInt(h[1].slice(2, 4), 16), b: parseInt(h[1].slice(4, 6), 16), a: 1, out: s };
      const m = s.match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\)/);
      if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4], out: s };
      return null;
    } catch { return null; }
  };
  const mathOklch = (c) => {
    const m = c.match(/oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)(?:deg)?(?:\s*\/\s*([\d.]+%?))?\s*\)/i);
    if (!m) return null;
    let L = m[1].endsWith('%') ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
    let C = m[2].endsWith('%') ? (parseFloat(m[2]) / 100) * 0.4 : parseFloat(m[2]);
    const H = parseFloat(m[3]);
    const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180);
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;
    const l = l_ ** 3, mm = m_ ** 3, ss = s_ ** 3;
    const rl = 4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * ss;
    const gl = -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * ss;
    const bl = -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * ss;
    const g2 = (x) => { x = Math.min(1, Math.max(0, x)); return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055; };
    let alpha = 1;
    if (m[4] !== undefined) alpha = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: Math.round(g2(rl) * 255), g: Math.round(g2(gl) * 255), b: Math.round(g2(bl) * 255), a: alpha, out: 'math:' + Math.round(g2(rl) * 255) + ',' + Math.round(g2(gl) * 255) + ',' + Math.round(g2(bl) * 255) };
  };
  const parseC = (c) => { if (/^oklch/i.test(c)) return mathOklch(c) || canvasNorm(c); return canvasNorm(c); };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const L1 = lum(a), L2 = lum(b); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
  const effBg = (el) => {
    const layers = []; let n = el;
    while (n) { const c = parseC(getComputedStyle(n).backgroundColor); if (c && c.a > 0.001) layers.push(c); n = n.parentElement; }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (const c of layers.reverse()) base = { r: c.r * c.a + base.r * (1 - c.a), g: c.g * c.a + base.g * (1 - c.a), b: c.b * c.a + base.b * (1 - c.a), a: 1 };
    return base;
  };
  const sanity = [];
  const out = [];
  const sel = '[class*="text-slate-400"],[class*="text-slate-500"],[class*="text-slate-600"],[class*="text-amber-500"],[class*="text-amber-600"],[class*="text-amber-700"],[class*="text-emerald-600"],[class*="text-emerald-700"]';
  for (const el of document.querySelectorAll(sel)) {
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
    const txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48); if (!txt) continue;
    const col = parseC(cs.color); if (!col) continue;
    if (sanity.length < 3 && /^oklch/i.test(cs.color)) sanity.push({ raw: cs.color, math: mathOklch(cs.color), canvas: canvasNorm(cs.color) });
    const bg = effBg(el);
    const colF = col.a >= 1 ? col : { r: col.r * col.a + bg.r * (1 - col.a), g: col.g * col.a + bg.g * (1 - col.a), b: col.b * col.a + bg.b * (1 - col.a) };
    const size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const cr = ratio(colF, bg);
    out.push({ cls: String(el.className).slice(0, 120), raw: cs.color, hex: '#' + [col.r, col.g, col.b].map((v) => v.toString(16).padStart(2, '0')).join(''), bg: '#' + [bg.r, bg.g, bg.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join(''), size, weight, large, ratio: +cr.toFixed(2), pass: cr >= (large ? 3 : 4.5), text: txt, y: Math.round(r.y) });
  }
  return { sanity, items: out };
};

/* ---------- WhatsApp floating button ---------- */
const floatEval = () => {
  const wa = document.querySelector('a[aria-label="WhatsApp"]');
  if (!wa) return { present: false };
  const cs = getComputedStyle(wa); const r = wa.getBoundingClientRect();
  const nb = (g) => ({ x: Math.round(g.x), y: Math.round(g.y), w: Math.round(g.width), h: Math.round(g.height), top: Math.round(g.top), bottom: Math.round(g.bottom), left: Math.round(g.left), right: Math.round(g.right) });
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const under = document.elementsFromPoint(cx, cy).filter((el) => el !== wa && !wa.contains(el)).slice(0, 5).map((el) => ({ tag: el.tagName, cls: String(el.className || '').slice(0, 80), txt: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 44) }));
  const inter = (a, b) => { if (!a || !b) return 0; const w = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)); const h = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)); return Math.round(w * h); };
  const cards = [...document.querySelectorAll('article')]; const last = cards[cards.length - 1];
  const more = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').includes('تحميل المزيد'));
  return { present: true, display: cs.display, position: cs.position, rect: nb(r), href: (wa.getAttribute('href') || '').split('?')[0], underAtCenter: under, lastCard: last ? nb(last.getBoundingClientRect()) : null, moreBtn: more ? nb(more.getBoundingClientRect()) : null, overlapLast: inter(r, last && last.getBoundingClientRect()), overlapMore: inter(r, more && more.getBoundingClientRect()), scrollY: Math.round(scrollY), innerW: innerWidth };
};

/* ---------- helpers ---------- */
const aggCls = (shifts) => {
  const m = new Map(); let total = 0, recent = 0;
  for (const e of shifts) {
    if (e.recent) { recent += e.value; continue; }
    total += e.value;
    const srcs = e.sources.length ? e.sources : [{ sig: '(no sources)' }];
    for (const s of srcs) { if (!m.has(s.sig)) m.set(s.sig, { sig: s.sig, count: 0, value: 0, sample: s }); const a = m.get(s.sig); a.count++; a.value += e.value / srcs.length; }
  }
  return { total: +total.toFixed(4), recent: +recent.toFixed(4), shiftCount: shifts.length, top: [...m.values()].sort((a, b) => b.value - a.value).slice(0, 10).map((a) => ({ sig: a.sig, count: a.count, value: +a.value.toFixed(4), sample: a.sample ? { tag: a.sample.tag, cls: a.sample.cls, txt: a.sample.txt, prev: a.sample.prev, cur: a.sample.cur } : null })) };
};
function uniqNet(net) {
  const m = new Map();
  for (const n of net) { const k = `${n.type}|${n.host}|${n.frame}`; if (!m.has(k)) m.set(k, { type: n.type, host: n.host, frame: n.frame, sample: n.url.slice(0, 110), count: 0 }); m.get(k).count++; }
  return [...m.values()];
}
const shellEval = () => { const s = document.getElementById('fast-paint-shell'); return s ? { present: true, display: getComputedStyle(s).display, h: Math.round(s.getBoundingClientRect().height) } : { present: false }; };

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const guard = async (name, fn) => { try { await fn(); } catch (e) { RESULTS.errors.push({ scenario: name, error: String(e.message).slice(0, 400) }); console.error('ERR', name, String(e.message).slice(0, 300)); } save(); };

  // ---------- A. Desktop 1440x900 /search: contrast v2 + CLS attribution + video modal (real trigger «فيديو») + WhatsApp float at lg ----------
  await guard('desktop-search2', async () => {
    const s = await setupViewport(b, { width: 1440, height: 900 });
    const A = {}; RESULTS.scenarios.desktop_search2 = A;
    await s.page.goto(BASE + '/search', { waitUntil: 'domcontentloaded' });
    await s.page.waitForSelector('text=صيدلية ألفا', { timeout: 8000 }).catch(() => {});
    await s.page.waitForTimeout(1500);
    A.contrast = await s.page.evaluate(contrastEval2);
    A.clsDetail = aggCls(await s.page.evaluate(() => window.__shifts));
    A.lcp = await s.page.evaluate(() => ({ fcp: window.__fcp, last: window.__lcp[window.__lcp.length - 1] || null, count: window.__lcp.length }));
    A.shell = await s.page.evaluate(shellEval);
    A.fonts = await s.page.evaluate(() => ({ status: document.fonts.status, list: [...document.fonts].map((f) => f.family).slice(0, 8) }));
    A.float = await s.page.evaluate(floatEval);
    await s.page.screenshot({ path: OUT + '/desktop-search2.png' });
    // video modal via the real trigger
    A.video = {};
    await s.page.getByText('صيدلية ألفا', { exact: true }).first().click();
    await s.page.waitForTimeout(900);
    A.contrastModal = await s.page.evaluate(contrastEval2);
    const dialog = s.page.locator('[role="dialog"]').first();
    A.video.pillCount = await dialog.getByRole('button', { name: 'فيديو', exact: true }).count();
    try {
      await dialog.getByRole('button', { name: 'فيديو', exact: true }).first().click({ timeout: 4000 });
      await s.page.waitForTimeout(900);
    } catch (e) { A.video.clickError = String(e.message).slice(0, 150); }
    A.video.modal = await s.page.evaluate(() => ({
      dialogs: document.querySelectorAll('[role="dialog"]').length,
      videos: [...document.querySelectorAll('video')].map((v) => ({ src: (v.currentSrc || v.getAttribute('src') || '').split('?')[0].slice(0, 140), networkState: v.networkState, readyState: v.readyState, errorCode: v.error ? v.error.code : null })),
    }));
    A.video.mediaNet = s.net.filter((n) => n.type === 'media' || /video|\.mp4/i.test(n.url)).slice(0, 6);
    await s.page.screenshot({ path: OUT + '/desktop-video2.png' });
    await s.page.keyboard.press('Escape'); await s.page.waitForTimeout(300);
    await s.page.keyboard.press('Escape'); await s.page.waitForTimeout(300);
    A.net = uniqNet(s.net);
    A.consoleErrors = s.consoleErrors.slice(0, 10);
    await s.context.close();
  });

  // ---------- B. Mobile 390x844 /search: contrast v2 + CLS attribution ----------
  await guard('mobile-search2', async () => {
    const s = await setupViewport(b, { width: 390, height: 844 });
    const B = {}; RESULTS.scenarios.mobile_search2 = B;
    await s.page.goto(BASE + '/search', { waitUntil: 'domcontentloaded' });
    await s.page.waitForSelector('text=صيدلية ألفا', { timeout: 8000 }).catch(() => {});
    await s.page.waitForTimeout(1800);
    B.contrast = await s.page.evaluate(contrastEval2);
    B.clsDetail = aggCls(await s.page.evaluate(() => window.__shifts));
    B.lcp = await s.page.evaluate(() => ({ fcp: window.__fcp, last: window.__lcp[window.__lcp.length - 1] || null, count: window.__lcp.length }));
    B.shell = await s.page.evaluate(shellEval);
    B.float = await s.page.evaluate(floatEval);
    B.scrollH = await s.page.evaluate(() => document.documentElement.scrollHeight);
    await s.page.screenshot({ path: OUT + '/mobile-search2.png' });
    B.net = uniqNet(s.net);
    B.consoleErrors = s.consoleErrors.slice(0, 10);
    await s.context.close();
  });

  // ---------- C. Mobile 390x844 /pricing: contrast v2 on pricing CTA (report note) ----------
  await guard('mobile-pricing2', async () => {
    const s = await setupViewport(b, { width: 390, height: 844 });
    const C = {}; RESULTS.scenarios.mobile_pricing2 = C;
    await s.page.goto(BASE + '/pricing', { waitUntil: 'domcontentloaded' });
    await s.page.waitForTimeout(1400);
    C.contrast = await s.page.evaluate(contrastEval2);
    C.freeBtn = await s.page.evaluate(() => {
      const el = [...document.querySelectorAll('button,a')].find((x) => (x.textContent || '').includes('هل تبحث عن الإدراج المجاني'));
      if (!el) return null;
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      return { rect: { w: Math.round(r.width), h: Math.round(r.height) }, fontSize: cs.fontSize, fontWeight: cs.fontWeight, color: cs.color, textDecoration: cs.textDecorationLine, text: 'هل تبحث عن الإدراج المجاني؟ اضغط هنا' };
    });
    C.float = await s.page.evaluate(floatEval);
    await s.page.screenshot({ path: OUT + '/mobile-pricing2.png' });
    await s.context.close();
  });

  // ---------- D. Tablet 768x1024 /search: WhatsApp float correct measurement ----------
  await guard('tablet-float2', async () => {
    const s = await setupViewport(b, { width: 768, height: 1024 });
    const D = {}; RESULTS.scenarios.tablet_float2 = D;
    await s.page.goto(BASE + '/search', { waitUntil: 'domcontentloaded' });
    await s.page.waitForSelector('text=صيدلية ألفا', { timeout: 8000 }).catch(() => {});
    await s.page.waitForTimeout(1400);
    D.beforeScroll = await s.page.evaluate(floatEval);
    await s.page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await s.page.waitForTimeout(900);
    D.atBottom = await s.page.evaluate(floatEval);
    await s.page.screenshot({ path: OUT + '/tablet-float2.png' });
    await s.context.close();
  });

  // ---------- E. Desktop 1440x900 two-pane `/`: contrast v2 + CLS + float at lg (right side) ----------
  await guard('desktop-home2', async () => {
    const s = await setupViewport(b, { width: 1440, height: 900 });
    const E = {}; RESULTS.scenarios.desktop_home2 = E;
    await s.page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await s.page.waitForSelector('text=صيدلية ألفا', { timeout: 8000 }).catch(() => {});
    await s.page.waitForTimeout(1600);
    E.contrast = await s.page.evaluate(contrastEval2);
    E.clsDetail = aggCls(await s.page.evaluate(() => window.__shifts));
    E.float = await s.page.evaluate(floatEval);
    await s.page.screenshot({ path: OUT + '/desktop-home2.png' });
    await s.context.close();
  });

  // ---------- CSP diff v2: include media attempts ----------
  try {
    const CSP = {
      script: { directive: 'script-src', entries: ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com', 'https://www.google-analytics.com'] },
      stylesheet: { directive: 'style-src', entries: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'] },
      font: { directive: 'font-src', entries: ["'self'", 'https://fonts.gstatic.com', 'data:'] },
      image: { directive: 'img-src', entries: ["'self'", 'data:', 'blob:', 'https:'] },
      fetch: { directive: 'connect-src', entries: ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co', 'https://www.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com', 'https://*.tile.openstreetmap.org', 'https://*.basemaps.cartocdn.com'] },
      xhr: { directive: 'connect-src', entries: ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co', 'https://www.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com', 'https://*.tile.openstreetmap.org', 'https://*.basemaps.cartocdn.com'] },
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
      if (n.type === 'document' && n.frame !== 'child') continue;
      const conf = CSP[n.type] || CSP.other;
      const fixture = n.host === 'fixture.test' || n.host === '127.0.0.1' || n.host === 'localhost';
      seen.set(key, { type: n.type, host: n.host, frame: n.frame, directive: conf.directive, allowed: hostAllowed(n.host, conf.entries), fixture, sample: n.sample });
    }
    RESULTS.csp = { attempts: [...seen.values()], violations: [...seen.values()].filter((x) => !x.allowed && !x.fixture) };
  } catch (e) { RESULTS.errors.push({ scenario: 'csp', error: String(e.message).slice(0, 300) }); }

  save();
  console.log('DONE');
  console.log(JSON.stringify({ errors: RESULTS.errors.map((e) => e.scenario + ': ' + e.error.slice(0, 120)), cspViolations: (RESULTS.csp.violations || []).map((v) => `${v.type}|${v.directive}|${v.host}|${v.frame}`) }, null, 2));
  await b.close();
})().catch((e) => { console.error(e); process.exitCode = 1; });
