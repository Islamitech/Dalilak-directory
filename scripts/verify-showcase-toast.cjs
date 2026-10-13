process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fixture.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key-dalilak';

const assert = require('node:assert/strict');
const net = require('net');
const { chromium } = require('@playwright/test');
const { preview } = require('vite');

async function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
    socket.once('error', () => { socket.destroy(); resolve(false); });
    socket.connect(port, '127.0.0.1');
  });
}

const mockRows = [
  {
    id: 'biz_toast_test',
    name_ar: 'مطعم الاختبار السريع',
    category: 'مطعم',
    governorate: 'الجيزة',
    city: 'حدائق الأهرام',
    street: 'منطقة أ',
    phone: '01011112222',
    lat: 29.981184,
    lng: 31.108863,
    verification_status: 'verified',
    package_id: 'pkg_basic',
    working_hours: '10:00 ص - 12:00 م',
    notes: JSON.stringify({ googleRatingEnabled: true, googleRating: 4.8, googleReviewsCount: 50 }),
    photos: [],
    created_at: '2026-08-15T00:00:00Z',
  },
];

async function setupContext(browser, viewport = { width: 390, height: 844 }) {
  const context = await browser.newContext({ viewport });
  await context.route('**/rest/v1/businesses*', (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'content-range': '0-0/1' },
      body: JSON.stringify(mockRows),
    });
  });
  const page = await context.newPage();
  return { context, page };
}

async function runToastVerification() {
  console.log('===================================================================');
  console.log('🧪 VERIFYING useShowcaseToast & PublicShowcase TOAST INTEGRATION');
  console.log('===================================================================\n');

  const port = 5297;
  let server = null;
  const running = await isPortOpen(port);

  if (!running) {
    console.log(`Starting Vite preview server on port ${port}...`);
    server = await preview({
      preview: { port, host: '127.0.0.1' },
    });
    console.log(`Preview server ready at http://127.0.0.1:${port}`);
  }

  const baseUrl = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ headless: true });

  try {
    const { context, page } = await setupContext(browser);
    try {
      await page.goto(`${baseUrl}/search`, { waitUntil: 'domcontentloaded' });
      const bizCard = page.locator('[data-biz-id="biz_toast_test"]').first();
      await bizCard.waitFor({ state: 'visible', timeout: 7000 });

      // Step 1: Trigger Toast via Favorite toggle
      console.log('Step 1: Verify Toast appearance and action label on favorite toggle...');
      const favBtn = page.locator('[data-biz-id="biz_toast_test"] [data-testid="favorite-button"], [data-biz-id="biz_toast_test"] .dl-hrt button').first();
      await favBtn.waitFor({ state: 'visible', timeout: 7000 });
      await favBtn.click();

      const toast = page.locator('.dl-toast');
      await toast.waitFor({ state: 'visible', timeout: 3000 });
      const content = await toast.innerText();
      console.log(`  ↳ Toast visible: "${content.replace(/\n/g, ' ')}"`);
      assert.ok(content.includes('أُضيف إلى المفضلة'), 'Toast message should confirm addition to favorites');
      assert.ok(content.includes('تراجع'), 'Toast action button must be labeled "تراجع"');

      // Step 2: Test Undo action
      console.log('Step 2: Verify clicking "تراجع" reverts favorite and hides toast immediately...');
      const undoBtn = toast.locator('.dl-toast-undo');
      await undoBtn.click();
      await toast.waitFor({ state: 'hidden', timeout: 2000 });
      console.log('  ↳ Toast closed immediately on undo action click.');

      // Check favorite was reverted
      const isFavReverted = await page.evaluate(() => {
        const btn = document.querySelector('[data-biz-id="biz_toast_test"] [data-testid="favorite-button"]') || document.querySelector('[data-biz-id="biz_toast_test"] .dl-hrt button');
        return btn ? btn.classList.contains('dl-on') || btn.getAttribute('aria-pressed') === 'true' : false;
      });
      assert.strictEqual(isFavReverted, false, 'Favorite state must revert to false after undo action');
      console.log('  ↳ Favorite state confirmed successfully reverted to un-favorited.');

      // Step 3: Rapid sequential toasts (replaces old toast & resets timer)
      console.log('Step 3: Rapid multiple triggers test (clearing prior timer & updating message)...');
      await favBtn.click(); // adds favorite
      await page.waitForFunction(() => {
        const btn = document.querySelector('[data-biz-id="biz_toast_test"] [data-testid="favorite-button"]') || document.querySelector('[data-biz-id="biz_toast_test"] .dl-hrt button');
        return btn && (btn.classList.contains('dl-on') || btn.getAttribute('aria-pressed') === 'true');
      });
      await favBtn.click(); // removes favorite
      await page.waitForFunction(() => {
        const t = document.querySelector('.dl-toast');
        return t && t.innerText.includes('أُزيل من المفضلة');
      }, { timeout: 3000 });
      const content2 = await toast.innerText();
      console.log(`  ↳ Rapid second toast: "${content2.replace(/\n/g, ' ')}"`);
      assert.ok(content2.includes('أُزيل من المفضلة'), 'Second rapid toast must display latest removal message');

      // Step 4: Auto-dismiss timeout verification
      console.log('Step 4: Verify auto-dismissal after 5000ms duration...');
      await page.waitForTimeout(5500);
      const isStillVisible = await toast.isVisible();
      assert.strictEqual(isStillVisible, false, 'Toast must auto-dismiss after duration expires');
      console.log('  ↳ Toast confirmed automatically dismissed.');

      console.log('\n🎉 ALL 4 useShowcaseToast INTEGRATION SCENARIOS VERIFIED SUCCESSFULLY!');
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
    if (server && server.httpServer) {
      server.httpServer.close();
    }
  }
}

runToastVerification().catch((err) => {
  console.error('Fatal toast verification error:', err);
  process.exit(1);
});
