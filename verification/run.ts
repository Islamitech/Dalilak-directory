import assert from 'node:assert/strict';
import { TARGET, ROOT, PROJECT_ROOT, VERIF_DIR, imp, installFetchMock, mockRes, json, isSupabaseBusinesses } from './lib/harness.js';

type Probe = { id: string; items: string; title: string; run: () => Promise<string | void> };
const probes: Probe[] = [];
const results: Array<{ id: string; items: string; title: string; ok: boolean; detail: string }> = [];
function probe(id: string, items: string, title: string, run: () => Promise<string | void>) {
  probes.push({ id, items, title, run });
}

const baseRow = {
  id: 'biz_probe',
  name_ar: 'مطعمプローブ',
  name_en: 'Probe Restaurant',
  category: 'مطاعم',
  governorate: 'الجيزة',
  city: 'حدائق الأهرام',
  street: 'شارع الاختبار',
  phone: '01012345678',
  secondary_phone: null,
  working_hours: '٢٤ ساعة',
  description: 'وصف',
  photos: [],
  cover_photo: null,
  notes: '{}',
  lat: 29.979184,
  lng: 31.106863,
  verification_status: 'verified',
  package_id: 'pkg_basic',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-02T00:00:00Z',
};

const VARIANTS: Array<{ key: string; row: any | null }> = [
  { key: 'verified', row: { ...baseRow, id: 'biz_verified' } },
  { key: 'draft', row: { ...baseRow, id: 'biz_draft', notes: '{"publishedStatus":"draft"}' } },
  { key: 'unlisted', row: { ...baseRow, id: 'biz_unlisted', notes: '{"publishedStatus":"unlisted"}' } },
  { key: 'hard-deleted', row: { ...baseRow, id: 'biz_harddeleted', is_deleted: true } },
  { key: 'soft-deleted', row: { ...baseRow, id: 'biz_softdeleted', notes: '{"isDeleted":true}' } },
  { key: 'interested-lead', row: { ...baseRow, id: 'biz_interested', package_id: 'pkg_interested_lead' } },
  { key: 'pending-verification', row: { ...baseRow, id: 'biz_pending', verification_status: 'pending' } },
  { key: 'missing', row: null },
];

function reqFor(biz: string, host = 'www.dalilaak.com') {
  return { query: { biz }, headers: { host, 'x-forwarded-proto': 'https' }, body: {}, method: 'GET' } as any;
}

function serveRows(rows: any[]) {
  return installFetchMock([
    {
      name: 'supabase-businesses',
      match: isSupabaseBusinesses,
      respond: (url: string) => {
        const u = new URL(url);
        const idEq = u.searchParams.get('id');
        if (idEq) {
          const wanted = idEq.replace(/^eq\./, '');
          const found = rows.filter((r) => r && r.id === wanted);
          return json(found, { headers: { 'content-range': `0-${Math.max(found.length - 1, 0)}/${found.length}` } });
        }
        return json(rows, { headers: { 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}` } });
      },
    },
  ]);
}

// ---------------------------------------------------------------- B1 / U13 share
probe('BE-01', 'B1,U13', 'api/share.ts must not publish draft/deleted/unlisted/interested/pending/missing records', async () => {
  const mod = await imp('api/share.ts');
  const handler = mod.default;
  const out: string[] = [];
  for (const v of VARIANTS) {
    const rows = v.row ? [v.row] : [];
    const mock = serveRows(rows);
    try {
      const { res, state } = mockRes();
      await handler(reqFor(v.row ? v.row.id : 'biz_does_not_exist'), res);
      const leaked = typeof state.body === 'string' && state.body.includes('مطعمプローブ');
      out.push(`${v.key}:status=${state.statusCode ?? 'none'}:redirect=${state.redirects[0]?.to ?? '-'}:ogNameLeaked=${leaked}`);
      if (v.key === 'verified') {
        assert.equal(state.statusCode, 200, 'verified record must return 200');
        assert.equal(leaked, true, 'verified record must render its OG name');
      } else {
        assert.equal(state.statusCode, 404, `${v.key} record must return 404, got ${state.statusCode}`);
        assert.equal(leaked, false, `${v.key} record must not leak its name into OG markup`);
      }
    } finally {
      mock.restore();
    }
  }
  return out.join(' | ');
});

// ---------------------------------------------------------------- B1 biz-og
probe('BE-02', 'B1,U13', 'api/biz-og.ts must 404 on non-public/missing records instead of falling back silently', async () => {
  const mod = await imp('api/biz-og.ts');
  const handler = mod.default;
  const out: string[] = [];
  for (const v of VARIANTS) {
    const rows = v.row ? [v.row] : [];
    const mock = serveRows(rows);
    try {
      const { res, state } = mockRes();
      await handler(reqFor(v.row ? v.row.id : 'biz_does_not_exist'), res);
      out.push(`${v.key}:status=${state.statusCode ?? 'none'}:redirect=${state.redirects[0]?.to ?? '-'}`);
      if (v.key === 'verified') {
        assert.notEqual(state.statusCode, 404, 'verified record must not 404');
      } else {
        assert.equal(state.statusCode, 404, `${v.key} must 404, got ${state.statusCode} redirect=${state.redirects[0]?.to}`);
      }
    } finally {
      mock.restore();
    }
  }
  return out.join(' | ');
});

// ---------------------------------------------------------------- B6 sitemap failure status
probe('BE-03', 'B6', 'api/sitemap.ts must return 503 (not 200) when the upstream directory fails', async () => {
  const mod = await imp('api/sitemap.ts');
  const mock = installFetchMock([
    { name: 'upstream-503', match: isSupabaseBusinesses, respond: () => new Response('unavailable', { status: 503 }) },
  ]);
  try {
    const { res, state } = mockRes();
    await mod.default(reqFor(''), res);
    const body = String(state.body ?? '');
    const bizUrls = (body.match(/\/biz\//g) || []).length;
    const cache = String(state.headers['cache-control'] ?? '');
    assert.equal(state.statusCode, 503, `upstream failure must surface as 503, got ${state.statusCode}`);
    assert.equal(bizUrls, 0, `a failed upstream must not emit business URLs, got ${bizUrls}`);
    assert.equal(cache.toLowerCase(), 'no-store', `the failure response must not be cacheable, got cache-control=${cache || '-'}`);
    return `status=${state.statusCode} businessUrls=${bizUrls} cacheControl=${cache || '-'} bodyLen=${body.length}`;
  } finally {
    mock.restore();
  }
});

probe('BE-03b', 'B6', 'api/sitemap.ts upstream-503 status must be 503 and must carry no-store', async () => {
  const mod = await imp('api/sitemap.ts');
  const mock = installFetchMock([
    { name: 'upstream-503', match: isSupabaseBusinesses, respond: () => new Response('unavailable', { status: 503 }) },
  ]);
  try {
    const { res, state } = mockRes();
    await mod.default(reqFor(''), res);
    assert.equal(state.statusCode, 503, `expected 503 on upstream failure, got ${state.statusCode}`);
    assert.equal(String(state.headers['cache-control'] ?? '').toLowerCase(), 'no-store', 'must not be cacheable');
  } finally {
    mock.restore();
  }
});

// ---------------------------------------------------------------- B7 sitemap pagination
probe('BE-04', 'B7', 'api/sitemap.ts must emit every record when the upstream caps page size below the total', async () => {
  const mod = await imp('api/sitemap.ts');
  const TOTAL = 750;
  const PAGE = 500;
  const all = Array.from({ length: TOTAL }, (_, i) => ({ ...baseRow, id: 'biz_p' + i, name_ar: 'نشاط ' + i }));
  let requests = 0;
  const mock = installFetchMock([
    {
      name: 'paged-supabase',
      match: isSupabaseBusinesses,
      respond: (_url: string, init?: any) => {
        requests++;
        const range = String(init?.headers?.Range || '0-499');
        const [fromRaw, toRaw] = range.split('-');
        const from = Number(fromRaw) || 0;
        const to = Math.min(Number(toRaw) || from + PAGE - 1, TOTAL - 1);
        const slice = all.slice(from, to + 1);
        return json(slice, { headers: { 'content-range': `${from}-${to}/${TOTAL}` } });
      },
    },
  ]);
  try {
    const { res, state } = mockRes();
    await mod.default(reqFor(''), res);
    const body = String(state.body ?? '');
    const bizUrls = (body.match(/\/biz\//g) || []).length;
    assert.equal(state.statusCode, 200, `expected 200, got ${state.statusCode}`);
    assert.equal(bizUrls, TOTAL, `sitemap dropped records: emitted ${bizUrls} of ${TOTAL} across ${requests} upstream page fetches`);
    assert.ok(requests > 1, `expected the handler to page beyond the first capped response, saw ${requests} request(s)`);
    return `status=${state.statusCode} businessUrls=${bizUrls} expected=${TOTAL} upstreamRequests=${requests}`;
  } finally {
    mock.restore();
  }
});

probe('BE-04b', 'B7', 'api/sitemap.ts paginated fetch must cover all 750 records across capped pages', async () => {
  const mod = await imp('api/sitemap.ts');
  const TOTAL = 750;
  const all = Array.from({ length: TOTAL }, (_, i) => ({ ...baseRow, id: 'biz_p' + i, name_ar: 'نشاط ' + i }));
  const mock = installFetchMock([
    {
      name: 'paged-supabase',
      match: isSupabaseBusinesses,
      respond: (_url: string, init?: any) => {
        const range = String(init?.headers?.Range || '0-499');
        const [fromRaw, toRaw] = range.split('-');
        const from = Number(fromRaw) || 0;
        const to = Math.min(Number(toRaw) ?? from + 499, TOTAL - 1);
        const slice = all.slice(from, to + 1);
        return json(slice, { headers: { 'content-range': `${from}-${to}/${TOTAL}` } });
      },
    },
  ]);
  try {
    const { res, state } = mockRes();
    await mod.default(reqFor(''), res);
    const body = String(state.body ?? '');
    const bizUrls = (body.match(/\/biz\//g) || []).length;
    assert.equal(state.statusCode, 200, `expected 200, got ${state.statusCode}`);
    assert.equal(bizUrls, TOTAL, `expected ${TOTAL} business URLs in sitemap, got ${bizUrls}`);
  } finally {
    mock.restore();
  }
});

// ---------------------------------------------------------------- B11 bounded image streaming
probe('BE-05', 'B11', 'api/biz-og.ts must not buffer an oversized image that omits Content-Length', async () => {
  const mod = await imp('api/biz-og.ts');
  const PHOTO = 'https://xdqpbajymacpdccorjcj.supabase.co/storage/v1/object/public/oversized.jpg';
  const row = { ...baseRow, id: 'biz_big', photos: [PHOTO], notes: JSON.stringify({ coverPhoto: PHOTO }) };
  const CHUNK = 64 * 1024;
  const TOTAL_BYTES = 8 * 1024 * 1024;
  let delivered = 0;
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (delivered >= TOTAL_BYTES) {
        controller.close();
        return;
      }
      await new Promise((r) => setTimeout(r, 0));
      const size = Math.min(CHUNK, TOTAL_BYTES - delivered);
      delivered += size;
      controller.enqueue(new Uint8Array(size));
    },
    cancel() {
      cancelled = true;
    },
  }, { highWaterMark: 0 });
  const mock = installFetchMock([
    {
      name: 'supabase-row',
      match: isSupabaseBusinesses,
      respond: () => json([row], { headers: { 'content-range': '0-0/1' } }),
    },
    {
      name: 'oversized-photo',
      match: (u) => u === PHOTO,
      respond: () =>
        new Response(stream as any, {
          status: 200,
          headers: { 'content-type': 'image/jpeg' }, // deliberately NO content-length
        }),
    },
  ]);
  try {
    const { res, state } = mockRes();
    await mod.default(reqFor('biz_big'), res);
    const bodyBytes = Buffer.isBuffer(state.body) ? state.body.length : String(state.body ?? '').length;
    const CEILING = 5 * 1024 * 1024;
    assert.ok(
      delivered < TOTAL_BYTES,
      `handler drained the whole ${TOTAL_BYTES}-byte upstream body (read ${delivered} bytes) despite the ${CEILING}-byte ceiling`,
    );
    assert.ok(
      delivered <= CEILING + 2 * CHUNK,
      `handler read ${delivered} bytes, overshooting the ${CEILING}-byte ceiling by more than two ${CHUNK}-byte chunks`,
    );
    assert.equal(cancelled, true, 'the upstream reader must be cancelled once the ceiling is hit');
    return `status=${state.statusCode} bytesFromUpstream=${delivered}/${TOTAL_BYTES} responseBodyBytes=${bodyBytes} readerCancelled=${cancelled}`;
  } finally {
    mock.restore();
  }
});

probe('BE-05b', 'B11', 'api/biz-og.ts must reject an oversized image from Content-Length before streaming any bytes', async () => {
  const mod = await imp('api/biz-og.ts');
  const PHOTO = 'https://xdqpbajymacpdccorjcj.supabase.co/storage/v1/object/public/oversized2.jpg';
  const row = { ...baseRow, id: 'biz_big2', photos: [PHOTO], notes: JSON.stringify({ coverPhoto: PHOTO }) };
  const CHUNK = 64 * 1024;
  const TOTAL_BYTES = 8 * 1024 * 1024;
  let delivered = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (delivered >= TOTAL_BYTES) {
        controller.close();
        return;
      }
      const size = Math.min(CHUNK, TOTAL_BYTES - delivered);
      delivered += size;
      controller.enqueue(new Uint8Array(size));
    },
  }, { highWaterMark: 0 });
  const mock = installFetchMock([
    { name: 'row', match: isSupabaseBusinesses, respond: () => json([row], { headers: { 'content-range': '0-0/1' } }) },
    {
      name: 'photo',
      match: (u) => u === PHOTO,
      respond: () =>
        new Response(stream as any, {
          status: 200,
          headers: { 'content-type': 'image/jpeg', 'content-length': String(TOTAL_BYTES) },
        }),
    },
  ]);
  try {
    const { res, state } = mockRes();
    await mod.default(reqFor('biz_big2'), res);
    assert.equal(delivered, 0, `Content-Length declared ${TOTAL_BYTES} bytes yet the handler still read ${delivered} bytes of the body`);
    return `status=${state.statusCode} bytesFromUpstream=${delivered} (declared ${TOTAL_BYTES}, ceiling 5242880)`;
  } finally {
    mock.restore();
  }
});

// ---------------------------------------------------------------- B9 SSRF redirect chains
function resolverReq(url: string) {
  return { query: { url }, headers: { host: 'www.dalilaak.com' }, body: {}, method: 'GET' } as any;
}

probe('BE-06', 'B9', 'google-place-resolver must not follow a redirect chain to an internal host (SSRF)', async () => {
  const mod = await imp('api/google-place-resolver.ts');
  const INTERNAL = 'http://169.254.169.254/latest/meta-data/iam/security-credentials/';
  const ENTRY = 'https://maps.app.goo.gl/Probe1';
  const fetched: string[] = [];
  const mock = installFetchMock([
    {
      name: 'redirect-chain',
      match: () => true,
      respond: (url: string) => {
        fetched.push(url);
        if (url === ENTRY) {
          return new Response('', { status: 302, headers: { location: INTERNAL } });
        }
        return new Response('secret-payload', { status: 200, headers: { 'content-type': 'text/plain' } });
      },
    },
  ]);
  try {
    const { res, state } = mockRes();
    await mod.default(resolverReq(ENTRY), res);
    const bodyStr = typeof state.body === 'string' ? state.body : JSON.stringify(state.body ?? '');
    const hitInternal = fetched.some((f) => f.includes('169.254.169.254'));
    const leaked = bodyStr.includes('secret-payload');
    assert.equal(hitInternal, false, `SSRF: a redirect to the metadata service was FOLLOWED. fetched=[${fetched.join(', ')}]`);
    assert.equal(leaked, false, 'SSRF: the internal response body was reflected back to the caller');
    assert.ok(
      typeof state.statusCode === 'number' && state.statusCode >= 400 && state.statusCode < 500,
      `a blocked redirect chain must produce a 4xx, got ${state.statusCode}`,
    );
    return `status=${state.statusCode} fetched=[${fetched.join(', ')}] internalHostFetched=${hitInternal} secretLeaked=${leaked}`;
  } finally {
    mock.restore();
  }
});

probe('BE-06b', 'B9', 'google-place-resolver must never issue a request to an internal/metadata host', async () => {
  const mod = await imp('api/google-place-resolver.ts');
  const INTERNAL = 'http://169.254.169.254/latest/meta-data/';
  const ENTRY = 'https://maps.app.goo.gl/Probe2';
  const fetched: string[] = [];
  const mock = installFetchMock([
    {
      name: 'chain',
      match: () => true,
      respond: (url: string) => {
        fetched.push(url);
        if (url === ENTRY) return new Response('', { status: 302, headers: { location: INTERNAL } });
        return new Response('secret-payload', { status: 200 });
      },
    },
  ]);
  try {
    const { res, state } = mockRes();
    await mod.default(resolverReq(ENTRY), res);
    assert.equal(
      fetched.some((f) => f.includes('169.254.169.254')),
      false,
      `SSRF: resolver fetched an internal host. fetched=[${fetched.join(', ')}]`,
    );
    const bodyStr = typeof state.body === 'string' ? state.body : JSON.stringify(state.body ?? '');
    assert.equal(bodyStr.includes('secret-payload'), false, 'SSRF: internal response body was reflected to the caller');
  } finally {
    mock.restore();
  }
});

probe('BE-07', 'B9', 'isValidGoogleMapsUrl must reject lookalike hosts, userinfo tricks and internal targets', async () => {
  const mod = await imp('api/google-place-resolver.ts');
  const fn = mod.isValidGoogleMapsUrl;
  assert.equal(typeof fn, 'function', 'isValidGoogleMapsUrl is not exported');
  const cases: Array<[string, boolean]> = [
    ['https://maps.app.goo.gl/abc', true],
    ['https://www.google.com/maps/place/X', true],
    ['https://evil-google.com/maps', false],
    ['https://maps.googleapis.com.attacker.test/x', false],
    ['https://attacker.test/?next=https://www.google.com/maps', false],
    ['https://www.google.com@169.254.169.254/latest/meta-data', false],
    ['https://www.google.com%2f@attacker.test/', false],
    ['http://localhost:5173/admin', false],
    ['http://127.0.0.1:8080/', false],
    ['http://[::1]:8080/', false],
    ['http://169.254.169.254/latest/meta-data', false],
    ['file:///etc/passwd', false],
    ['javascript:alert(1)', false],
    ['data:text/html,<script>alert(1)</script>', false],
    ['//attacker.test/maps', false],
    ['https://goo.gl.evil.test/maps', false],
  ];
  const bad: string[] = [];
  for (const [url, expected] of cases) {
    let actual: any;
    try {
      actual = fn(url);
    } catch (e: any) {
      actual = 'threw:' + e.message;
    }
    if (actual !== expected) bad.push(`${url} -> ${actual} (expected ${expected})`);
  }
  assert.deepEqual(bad, [], 'host validation gaps:\n  ' + bad.join('\n  '));
});

// ---------------------------------------------------------------- U2 working hours
probe('BE-08', 'U2', 'getBusinessOpenStatus must not report unknown/closed hours as open', async () => {
  const mod = await imp('src/utils/directoryEnhancements.ts');
  const fn = mod.getBusinessOpenStatus;
  const cases = ['', 'مغلق', 'نص غير معروف', 'غير محدد', 'closed'];
  const out: string[] = [];
  for (const value of cases) {
    const r = fn(value);
    out.push(`${JSON.stringify(value)}=>isOpen:${r?.isOpen}`);
    assert.equal(r?.isOpen, false, `hours ${JSON.stringify(value)} must not be reported open`);
  }
  return out.join(' | ');
});

probe('BE-08b', 'U2', 'getBusinessOpenStatus handles Arabic-Indic digits, minutes, noon and overnight spans', async () => {
  const mod = await imp('src/utils/directoryEnhancements.ts');
  const fn = mod.getBusinessOpenStatus;
  const at = (iso: string) => new Date(iso);
  assert.equal(fn('٩:٣٠ ص إلى ٥:١٥ م', at('2026-01-05T09:29:00+02:00')).isOpen, false, '09:29 must be closed');
  assert.equal(fn('٩:٣٠ ص إلى ٥:١٥ م', at('2026-01-05T09:30:00+02:00')).isOpen, true, '09:30 must be open');
  assert.equal(fn('٩:٣٠ ص إلى ٥:١٥ م', at('2026-01-05T17:15:00+02:00')).isOpen, false, '17:15 closing edge must be closed');
  assert.equal(fn('10 م إلى 2 ص', at('2026-01-05T01:30:00+02:00')).isOpen, true, 'overnight 01:30 must be open');
  assert.equal(fn('12 م إلى 4 م', at('2026-01-05T12:00:00+02:00')).isOpen, true, 'noon 12:00 must be open');
});

probe('BE-09', 'U2,DST', 'getBusinessOpenStatus must evaluate Cairo local time (incl. Egypt summer UTC+3) regardless of the host timezone', async () => {
  const { execFileSync } = await import('node:child_process');
  const path = (await import('node:path')).default;
  const script = path.join(VERIF_DIR, 'tz-probe.ts');
  const tsxCli = path.join(PROJECT_ROOT, 'node_modules/tsx/dist/cli.mjs');
  const zones = ['UTC', 'America/New_York', 'Asia/Tokyo', 'Africa/Cairo', 'Pacific/Kiritimati'];
  const out: string[] = [];
  let reference: string | null = null;
  for (const tz of zones) {
    const stdout = execFileSync(
      process.execPath,
      [tsxCli, script],
      {
        cwd: ROOT,
        encoding: 'utf8',
        env: { ...process.env, TZ: tz, TZPROBE_ROOT: ROOT },
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    );
    const parsed = JSON.parse(stdout.trim().split('\n').pop()!);
    const actual = parsed.results.map((r: any) => (r.actual ? 1 : 0)).join('');
    const wrong = parsed.results.filter((r: any) => r.actual !== r.expected);
    out.push(`${tz}(iana=${parsed.iana})=>${actual}`);
    assert.deepEqual(
      wrong.map((w: any) => `${w.iso} expected=${w.expected} actual=${w.actual}`),
      [],
      `TZ=${tz}: open-now is wrong for these Cairo instants (DST not honoured): ` +
        JSON.stringify(wrong),
    );
    if (reference === null) reference = actual;
    assert.equal(actual, reference, `TZ=${tz} produced ${actual} but TZ=${zones[0]} produced ${reference}: the result depends on the host timezone`);
  }
  return 'isOpen vectors per TZ (expect 110010 in every zone): ' + out.join(' | ');
});

probe('BE-09b', 'U2,DST', 'open-now must be timezone-correct across the Egypt DST boundary', async () => {
  const mod = await imp('src/utils/directoryEnhancements.ts');
  const fn = mod.getBusinessOpenStatus;
  const summer = fn('٩ ص إلى ٢ م', new Date('2026-07-06T06:30:00Z')); // 09:30 Cairo (UTC+3) -> open
  const winter = fn('٩ ص إلى ٢ م', new Date('2026-01-05T11:00:00Z')); // 13:00 Cairo (UTC+2) -> open
  assert.equal(summer.isOpen, true, 'DST: 06:30Z is 09:30 in Cairo (UTC+3) so a 09-14 business must be OPEN');
  assert.equal(winter.isOpen, true, 'Winter: 11:00Z is 13:00 in Cairo (UTC+2) so a 09-14 business must be OPEN');
});

// ---------------------------------------------------------------- B2/B3/B12 catalog state
probe('BE-10', 'B2,B3,B12', 'catalog merge/equality/favorites primitives behave correctly', async () => {
  const mod = await imp('src/services/catalogState.ts');
  const elig = await imp('src/shared/publicBusiness.ts');
  const pub: any = { ...baseRow, id: 'biz_a', createdDate: '2026-09-01' };
  const out: string[] = [];

  assert.equal(mod.mergeCatalog([], new Map([['biz_a', pub]])).length, 1, 'empty cache write must be retained');
  assert.equal(mod.mergeCatalog([pub], new Map([['biz_a', null]])).length, 0, 'realtime DELETE must remove the row');
  assert.equal(
    mod.mergeCatalog([pub], new Map([['biz_a', { ...pub, description: 'new' }]]))[0].description,
    'new',
    'realtime UPDATE must upsert over a stale REST snapshot',
  );
  const draft: any = { ...pub, id: 'biz_draft', notes: '{"publishedStatus":"draft"}' };
  assert.equal(
    mod.mergeCatalog([pub], new Map([['biz_draft', draft]])).some((b: any) => b.id === 'biz_draft'),
    false,
    'a non-public row arriving over realtime must not enter the public catalog',
  );
  assert.equal(
    mod.mergeCatalog([draft], new Map()).some((b: any) => b.id === 'biz_draft'),
    false,
    'a non-public row already in the snapshot must be dropped on merge',
  );
  out.push('equality:' + mod.catalogsEqual([pub], [{ ...pub, description: 'new' }]));
  assert.equal(mod.catalogsEqual([pub], [{ ...pub }]), true, 'identical catalogs must compare equal');
  assert.equal(mod.catalogsEqual([pub], [{ ...pub, description: 'x' }]), false, 'any field change must compare unequal');
  out.push('keyOrder:' + mod.catalogsEqual([{ a: 1, b: 2 }], [{ b: 2, a: 1 }]));
  assert.deepEqual(mod.parseFavorites('{"bad":true}'), [], 'non-array favorites must parse to []');
  assert.deepEqual(mod.parseFavorites('["a","a",3]'), ['a'], 'favorites must be deduped and string-only');
  assert.equal(elig.isPublicBusiness({ ...pub, verification_status: 'pending' }), false);
  return out.join(' | ') + ' (keyOrder:false => catalogsEqual is JSON.stringify-based and therefore key-order sensitive: FINDING, not a B3 failure)';
});

// ---------------------------------------------------------------- B1 shared eligibility
probe('BE-11', 'B1,A1', 'a single shared public-eligibility rule exists and rejects every non-public state', async () => {
  const mod = await imp('src/shared/publicBusiness.ts');
  const pub: any = { ...baseRow, id: 'biz_ok' };
  assert.equal(mod.isPublicBusiness(pub), true, 'verified+published must be public');
  const rejects: Array<[string, any]> = [
    ['verification pending', { ...pub, verification_status: 'pending' }],
    ['notes.publishedStatus draft', { ...pub, notes: '{"publishedStatus":"draft"}' }],
    ['notes.publishedStatus unlisted', { ...pub, notes: '{"publishedStatus":"unlisted"}' }],
    ['row.published_status draft', { ...pub, published_status: 'draft' }],
    ['is_deleted flag', { ...pub, is_deleted: true }],
    ['isDeleted camel', { ...pub, isDeleted: true }],
    ['notes.isDeleted', { ...pub, notes: '{"isDeleted":true}' }],
    ['interested lead package', { ...pub, package_id: 'pkg_interested_lead' }],
    ['malformed notes json', { ...pub, notes: '{bad' }],
    ['null row', null],
    ['missing id', { ...pub, id: 42 }],
  ];
  const bad: string[] = [];
  for (const [label, row] of rejects) {
    if (mod.isPublicBusiness(row) !== false) bad.push(label);
  }
  assert.deepEqual(bad, [], 'eligibility accepted rows it must reject: ' + bad.join(', '));
});

// ---------------------------------------------------------------- U1 shared filtering predicate
probe('BE-12', 'U1,A5', 'a single shared filtering predicate exists and honours openNow/rating/video inside the Hadayek scope', async () => {
  const mod = await imp('src/utils/directoryFiltering.ts');
  const fixture: any = {
    id: 'biz_f',
    nameAr: 'نشاط',
    verificationStatus: 'verified',
    city: 'حدائق الأهرام',
    governorate: 'الجيزة',
    lat: 29.979184,
    lng: 31.106863,
    workingHours: 'مغلق',
    videos: [],
  };
  const options: any = {
    activityIntent: null,
    deferredSearchQuery: '',
    categoryFilter: 'all',
    subcategoryFilter: 'all',
    effectiveSearchZone: 'all',
    govFilter: 'الجيزة',
    cityFilter: 'حدائق الأهرام',
    openNowOnly: false,
    hasRatingOnly: false,
    hasVideoOnly: false,
  };
  assert.equal(mod.filterDirectoryBusinesses([fixture], options).length, 1, 'baseline scope must keep the fixture');
  for (const key of ['openNowOnly', 'hasRatingOnly', 'hasVideoOnly']) {
    assert.equal(
      mod.filterDirectoryBusinesses([fixture], { ...options, [key]: true }).length,
      0,
      `${key} must filter the fixture out inside the default Hadayek scope (U1 early-return bypass)`,
    );
  }
});

// ---------------------------------------------------------------- U3/U4/B8 URL helpers
probe('BE-13', 'U13,B8', 'slug/ID extraction survives malformed encoding and old-ID links', async () => {
  const mod = await imp('src/utils/directoryUrl.ts');
  assert.equal(mod.extractBusinessIdFromSlug('%broken'), '', 'malformed percent-encoding must not throw at boot');
  assert.equal(mod.extractBusinessIdFromSlug('اسم-biz_123'), 'biz_123', 'old ID embedded in a semantic slug must resolve');
  assert.equal(mod.extractBusinessIdFromSlug('biz_123'), 'biz_123');
  assert.equal(
    mod.getBusinessSlug({ id: 'biz_1', nameAr: 'اختبار', customDirectoryUrl: 'my-shop' }),
    'my-shop',
    'custom canonical slug must win',
  );
  const semantic = mod.getBusinessSlug({ id: 'biz_1', nameAr: 'مطعم أبو خالد', city: 'الجيزة' });
  assert.ok(String(semantic).includes('biz_1'), `semantic slug must retain the resolvable ID, got ${semantic}`);
});

// ---------------------------------------------------------------- runner
(async () => {
  console.log(`\n================ VERIFICATION PROBES :: target=${TARGET} ================`);
  console.log(`root=${ROOT}\n`);
  for (const p of probes) {
    try {
      const info = await p.run();
      results.push({ ...p, ok: true, detail: '' });
      console.log(`PASS  ${p.id}  [${p.items}]  ${p.title}`);
      if (info) console.log(`        INFO ${String(info).split('\n').join('\n        INFO ')}`);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      results.push({ ...p, ok: false, detail: msg });
      console.log(`FAIL  ${p.id}  [${p.items}]  ${p.title}`);
      console.log(`        ${msg.split('\n').join('\n        ')}`);
    }
  }
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n---- target=${TARGET}: ${passed}/${results.length} probes passed ----`);
  console.log(`FAILED: ${results.filter((r) => !r.ok).map((r) => r.id).join(', ') || 'none'}\n`);
  process.exitCode = passed === results.length ? 0 : 1;
})();
