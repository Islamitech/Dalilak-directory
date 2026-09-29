import assert from 'node:assert/strict';
import handler from '../../api/biz-og';

function createMockRes() {
  const headers = new Map<string, any>();
  let statusCode = 200;
  let body: any = null;
  let redirectUrl: string | null = null;
  let redirectStatus: number | null = null;

  const res: any = {
    statusCode: 200,
    setHeader(key: string, val: any) {
      headers.set(key.toLowerCase(), val);
      return res;
    },
    getHeader(key: string) {
      return headers.get(key.toLowerCase());
    },
    status(code: number) {
      statusCode = code;
      res.statusCode = code;
      return res;
    },
    send(data: any) {
      body = data;
      return res;
    },
    redirect(statusOrUrl: any, url?: string) {
      if (typeof statusOrUrl === 'number') {
        redirectStatus = statusOrUrl;
        redirectUrl = url || null;
      } else {
        redirectStatus = 302;
        redirectUrl = statusOrUrl;
      }
      return res;
    },
    get _body() { return body; },
    get _statusCode() { return statusCode; },
    get _headers() { return headers; },
    get _redirect() { return { status: redirectStatus, url: redirectUrl }; }
  };
  return res;
}

const originalFetch = globalThis.fetch;

async function runTests() {
  const businessRecords: Record<string, any> = {
    biz_stall: {
      id: 'biz_stall',
      verification_status: 'verified',
      package_id: 'pkg_basic',
      name_ar: 'كافيه معلق',
      category: 'كافيهات ومطاعم',
      city: 'حدائق الأهرام',
      governorate: 'الجيزة',
      phone: '01012345678',
      notes: '{}',
      photos: ['https://images.unsplash.com/test-photo-stall']
    },
    biz_valid: {
      id: 'biz_valid',
      verification_status: 'verified',
      package_id: 'pkg_basic',
      name_ar: 'كافيه سليم',
      category: 'كافيهات ومطاعم',
      city: 'حدائق الأهرام',
      governorate: 'الجيزة',
      phone: '01012345678',
      notes: '{}',
      photos: ['https://images.unsplash.com/test-photo-valid']
    },
    biz_oversized: {
      id: 'biz_oversized',
      verification_status: 'verified',
      package_id: 'pkg_basic',
      name_ar: 'كافيه كبير',
      category: 'كافيهات ومطاعم',
      city: 'حدائق الأهرام',
      governorate: 'الجيزة',
      phone: '01012345678',
      notes: '{}',
      photos: ['https://images.unsplash.com/test-photo-oversized']
    }
  };

  const validImageBytes = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]);
  let oversizedChunksSent = 0;
  let oversizedStreamCancelled = false;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Supabase business lookup query
    if (urlStr.includes('/rest/v1/businesses')) {
      const match = urlStr.match(/id=eq\.([^&]+)/);
      const id = match ? match[1] : '';
      const record = businessRecords[id];
      return new Response(JSON.stringify(record ? [record] : []), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Photo 1: Stall test (sends 1 byte, then stalls indefinitely)
    if (urlStr === 'https://images.unsplash.com/test-photo-stall') {
      let streamController: ReadableStreamDefaultController<Uint8Array>;
      const stream = new ReadableStream<Uint8Array>({
        start(c) {
          streamController = c;
          c.enqueue(new Uint8Array([0xFF])); // send 1 byte
          // stall: do not enqueue more, do not close
        }
      });
      if (init?.signal) {
        init.signal.addEventListener('abort', () => {
          try {
            streamController.error(init.signal?.reason || new Error('Aborted'));
          } catch {}
        });
      }
      return new Response(stream, {
        status: 200,
        headers: { 'content-type': 'image/jpeg' }
      });
    }

    // Photo 2: Valid small image
    if (urlStr === 'https://images.unsplash.com/test-photo-valid') {
      return new Response(validImageBytes, {
        status: 200,
        headers: {
          'content-type': 'image/jpeg',
          'content-length': String(validImageBytes.length)
        }
      });
    }

    // Photo 3: Oversized streaming image (> 5MB)
    if (urlStr === 'https://images.unsplash.com/test-photo-oversized') {
      const chunkSize = 1024 * 1024; // 1MB
      const stream = new ReadableStream<Uint8Array>({
        pull(c) {
          if (oversizedChunksSent < 10) {
            oversizedChunksSent++;
            c.enqueue(new Uint8Array(chunkSize));
          } else {
            c.close();
          }
        },
        cancel() {
          oversizedStreamCancelled = true;
        }
      });
      return new Response(stream, {
        status: 200,
        headers: { 'content-type': 'image/jpeg' }
      });
    }

    return new Response('Not found', { status: 404 });
  }) as typeof fetch;

  try {
    // ---------------------------------------------------------
    // Test 1: Upstream sends 1 byte then stalls
    // Must resolve within timeout (5000ms) + small margin (700ms) = 5700ms
    // and fall back to the generated card.
    // ---------------------------------------------------------
    console.log('Running Test 1: Upstream sends 1 byte then stalls...');
    const req1 = { query: { biz: 'biz_stall' } };
    const res1 = createMockRes();
    const start1 = Date.now();
    const DEADLINE_MS = 5700;

    let deadlineTimer: NodeJS.Timeout | null = null;
    const deadlinePromise = new Promise((_, reject) => {
      deadlineTimer = setTimeout(() => {
        reject(new Error(`DEFECT REPRODUCED: Upstream stall hung for ${DEADLINE_MS}ms! Timeout was cleared early and abort never fired.`));
      }, DEADLINE_MS);
    });

    await Promise.race([
      handler(req1 as any, res1 as any),
      deadlinePromise
    ]);
    if (deadlineTimer) clearTimeout(deadlineTimer);

    const elapsed1 = Date.now() - start1;
    console.log(`Test 1 resolved in ${elapsed1}ms`);
    assert.ok(elapsed1 >= 4800, `Handler resolved too quickly (${elapsed1}ms), did not wait for timeout`);
    assert.ok(elapsed1 <= DEADLINE_MS, `Handler took ${elapsed1}ms, exceeding deadline of ${DEADLINE_MS}ms`);
    assert.equal(res1._statusCode, 200);
    assert.equal(res1._headers.get('content-type'), 'image/png');
    assert.ok(Buffer.isBuffer(res1._body) && res1._body.length > 0);
    // Verify PNG magic bytes (\x89PNG)
    assert.equal(res1._body[0], 0x89);
    assert.equal(res1._body[1], 0x50);
    assert.equal(res1._body[2], 0x4E);
    assert.equal(res1._body[3], 0x47);
    console.log('✓ Test 1 passed: handler resolved within timeout + small margin and returned fallback card');

    // ---------------------------------------------------------
    // Test 2: Valid small image still works (positive control)
    // ---------------------------------------------------------
    console.log('Running Test 2: Valid small image (positive control)...');
    const req2 = { query: { biz: 'biz_valid' } };
    const res2 = createMockRes();
    await handler(req2 as any, res2 as any);
    assert.equal(res2._statusCode, 200);
    assert.equal(res2._headers.get('content-type'), 'image/jpeg');
    assert.ok(Buffer.isBuffer(res2._body));
    assert.equal(res2._body.length, validImageBytes.length);
    assert.ok(res2._body.equals(validImageBytes));
    console.log('✓ Test 2 passed: valid small image returned successfully');

    // ---------------------------------------------------------
    // Test 3: Oversized image still stops at the ceiling
    // ---------------------------------------------------------
    console.log('Running Test 3: Oversized image stops at 5MB ceiling...');
    const req3 = { query: { biz: 'biz_oversized' } };
    const res3 = createMockRes();
    await handler(req3 as any, res3 as any);
    assert.ok(oversizedStreamCancelled, 'Expected reader.cancel() to have been called when ceiling exceeded');
    assert.ok(oversizedChunksSent <= 7, `Expected stream reading to stop at 5MB ceiling before consuming all chunks, but sent ${oversizedChunksSent} chunks`);
    assert.equal(res3._statusCode, 200);
    assert.equal(res3._headers.get('content-type'), 'image/png');
    assert.ok(Buffer.isBuffer(res3._body) && res3._body.length > 0);
    assert.equal(res3._body[0], 0x89);
    assert.equal(res3._body[1], 0x50);
    assert.equal(res3._body[2], 0x4E);
    assert.equal(res3._body[3], 0x47);
    console.log('✓ Test 3 passed: oversized image stopped at ceiling and fell back to generated card');

    console.log('\nALL 3 TESTS PASSED!');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

runTests().catch((err) => {
  console.error('\nTEST FAILED:', err);
  process.exit(1);
});
