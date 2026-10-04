process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fixture.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key-dalilak';

const path = require('path');
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
    id: 'biz_alpha',
    name_ar: 'صيدلية ألفا',
    category: 'صيدلية',
    governorate: 'الجيزة',
    city: 'حدائق الأهرام',
    street: 'منطقة ب',
    phone: '01012345678',
    lat: 29.979184,
    lng: 31.106863,
    verification_status: 'verified',
    package_id: 'pkg_basic',
    working_hours: '24 ساعة',
    notes: JSON.stringify({ googleRatingEnabled: true, googleRating: 4.5, googleReviewsCount: 12 }),
    photos: [],
    created_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'biz_beta',
    name_ar: 'مطعم الأهرام',
    category: 'مطعم',
    governorate: 'الجيزة',
    city: 'حدائق الأهرام',
    street: 'منطقة أ',
    phone: '01098765432',
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
    const url = new URL(route.request().url());
    const idParam = url.searchParams.get('id');
    if (idParam) {
      const cleanId = idParam.replace('eq.', '');
      const filtered = mockRows.filter((r) => r.id === cleanId);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': `0-${Math.max(0, filtered.length - 1)}/${filtered.length}` },
        body: JSON.stringify(filtered),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'content-range': `0-${mockRows.length - 1}/${mockRows.length}` },
      body: JSON.stringify(mockRows),
    });
  });
  const page = await context.newPage();
  return { context, page };
}

async function runBehavioralTests() {
  console.log('===================================================================');
  console.log('🧪 RUNNING DALILAK BEHAVIORAL ASSERTION TEST SUITE (7 CONTRACTS)');
  console.log('===================================================================\n');

  const port = 5295;
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
  const results = [];

  try {
    // -------------------------------------------------------------
    // Contract 1: View Switch (Map <-> List)
    // -------------------------------------------------------------
    console.log('--- Contract 1: View Switch (Map <-> List) ---');
    {
      const { context, page } = await setupContext(browser, { width: 390, height: 844 });
      try {
        await page.goto(`${baseUrl}/search`, { waitUntil: 'domcontentloaded' });
        await page.locator('[data-biz-id="biz_alpha"]').first().waitFor({ state: 'visible', timeout: 7000 });

        // Locate view switch buttons
        const mapBtn = page.locator('button[aria-label*="الخريطة"]').first();
        assert.ok((await mapBtn.count()) > 0, 'Map switch button must exist in header');
        await mapBtn.click();

        // Condition waits: URL transitions to /map and leaflet container renders
        await page.waitForURL((url) => url.pathname.includes('/map'), { timeout: 7000 });
        const mapCanvas = page.locator('.leaflet-container').first();
        await mapCanvas.waitFor({ state: 'visible', timeout: 7000 });
        assert.ok(await mapCanvas.isVisible(), 'Map leaflet container must be visible in Map view');

        // Switch back to List
        const listBtn = page.locator('button[aria-label*="قائمة"]').first();
        assert.ok((await listBtn.count()) > 0, 'List switch button must exist in header');
        await listBtn.click();

        // Condition waits: URL transitions to /search and business cards render
        await page.waitForURL((url) => url.pathname.includes('/search'), { timeout: 7000 });
        const card = page.locator('[data-biz-id="biz_alpha"]').first();
        await card.waitFor({ state: 'visible', timeout: 7000 });
        assert.ok(await card.isVisible(), 'Business card must be visible after returning to list view');

        console.log('✓ Contract 1 Passed: View switch transitions between List and Map cleanly.');
        results.push({ contract: '1. View Switch', status: 'PASS' });
      } catch (err) {
        console.error('✗ Contract 1 Failed with error stack:\n', err);
        results.push({ contract: '1. View Switch', status: 'FAIL', error: err.message });
        throw err;
      } finally {
        await context.close();
      }
    }

    // -------------------------------------------------------------
    // Contract 2: Category Filter
    // -------------------------------------------------------------
    console.log('\n--- Contract 2: Category Filter ---');
    {
      const { context, page } = await setupContext(browser, { width: 390, height: 844 });
      try {
        await page.goto(`${baseUrl}/search`, { waitUntil: 'domcontentloaded' });
        await page.locator('[data-biz-id="biz_alpha"]').first().waitFor({ state: 'visible', timeout: 7000 });

        // Find category pills in CategoryBar
        const catBtn = page.locator('nav[aria-label*="تصنيفات"] button').filter({ hasText: 'المطاعم' }).first();
        await catBtn.waitFor({ state: 'visible', timeout: 7000 });
        await catBtn.click();

        // Condition wait: button attribute indicates selected state
        await page.waitForFunction(
          (btn) => btn.getAttribute('aria-pressed') === 'true',
          await catBtn.elementHandle(),
          { timeout: 7000 }
        );
        const isSelected = await catBtn.evaluate((el) => el.getAttribute('aria-pressed') === 'true');
        assert.ok(isSelected, 'Category pill must indicate active/selected state when clicked');

        // Reset to all
        const allBtn = page.locator('nav[aria-label*="تصنيفات"] button').filter({ hasText: 'كافة الأنشطة' }).first();
        await allBtn.waitFor({ state: 'visible', timeout: 7000 });
        await allBtn.click();

        // Condition wait: all category button is active
        await page.waitForFunction(
          (btn) => btn.getAttribute('aria-pressed') === 'true',
          await allBtn.elementHandle(),
          { timeout: 7000 }
        );
        const allSelected = await allBtn.evaluate((el) => el.getAttribute('aria-pressed') === 'true');
        assert.ok(allSelected, 'All category pill must be selected after reset');

        console.log('✓ Contract 2 Passed: Category filtering updates selection state and resets cleanly.');
        results.push({ contract: '2. Category Filter', status: 'PASS' });
      } catch (err) {
        console.error('✗ Contract 2 Failed with error stack:\n', err);
        results.push({ contract: '2. Category Filter', status: 'FAIL', error: err.message });
        throw err;
      } finally {
        await context.close();
      }
    }

    // -------------------------------------------------------------
    // Contract 3: Favorite Filter + Sort Cycle
    // -------------------------------------------------------------
    console.log('\n--- Contract 3: Favorite Filter + Sort Cycle ---');
    {
      const { context, page } = await setupContext(browser, { width: 390, height: 844 });
      try {
        await page.goto(`${baseUrl}/search`, { waitUntil: 'domcontentloaded' });
        await page.locator('[data-biz-id="biz_alpha"]').first().waitFor({ state: 'visible', timeout: 7000 });

        // 1. Toggle favorite on first card
        const favBtn = page.locator('[data-biz-id="biz_alpha"] .card-fav').first();
        await favBtn.waitFor({ state: 'visible', timeout: 7000 });
        await favBtn.click();

        // Condition wait: favorite state is active
        await page.waitForFunction(() => {
          const fav = document.querySelector('[data-biz-id="biz_alpha"] .card-fav');
          return fav && (fav.classList.contains('bg-rose-500') || fav.getAttribute('aria-label')?.includes('إزالة'));
        }, { timeout: 7000 });

        // 2. Click favorites filter chip (#favToolBtn)
        const favToolBtn = page.locator('#favToolBtn').first();
        await favToolBtn.waitFor({ state: 'visible', timeout: 7000 });
        await favToolBtn.click();

        // Condition wait: non-favorited item biz_beta is hidden
        await page.locator('[data-biz-id="biz_beta"]').first().waitFor({ state: 'hidden', timeout: 7000 });
        assert.ok(await page.locator('[data-biz-id="biz_alpha"]').isVisible(), 'Favorited item biz_alpha must remain visible');

        // Unfilter favorites
        await favToolBtn.click();
        await page.locator('[data-biz-id="biz_beta"]').first().waitFor({ state: 'visible', timeout: 7000 });
        assert.ok(await page.locator('[data-biz-id="biz_beta"]').isVisible(), 'Non-favorited item restored after unfiltering');

        // 3. Sort cycle button (#sortBtn)
        const sortBtn = page.locator('#sortBtn').first();
        await sortBtn.waitFor({ state: 'visible', timeout: 7000 });
        const initialSortText = (await sortBtn.innerText()).trim();
        await sortBtn.click();

        // Condition wait: sort label changes
        await page.waitForFunction(
          (initial) => {
            const btn = document.querySelector('#sortBtn');
            return btn && btn.innerText.trim() !== initial;
          },
          initialSortText,
          { timeout: 7000 }
        );
        const nextSortText = (await sortBtn.innerText()).trim();
        assert.notEqual(initialSortText, nextSortText, 'Sort cycle button must change label on click');

        console.log('✓ Contract 3 Passed: Favorite filter and sort cycle button assert correctly.');
        results.push({ contract: '3. Favorite Filter & Sort Cycle', status: 'PASS' });
      } catch (err) {
        console.error('✗ Contract 3 Failed with error stack:\n', err);
        results.push({ contract: '3. Favorite Filter & Sort Cycle', status: 'FAIL', error: err.message });
        throw err;
      } finally {
        await context.close();
      }
    }

    // -------------------------------------------------------------
    // Contract 4: Desktop Two-Pane at >= 1024px
    // -------------------------------------------------------------
    console.log('\n--- Contract 4: Desktop Two-Pane at >= 1024px ---');
    {
      const { context, page } = await setupContext(browser, { width: 1280, height: 800 });
      try {
        await page.goto(`${baseUrl}/search`, { waitUntil: 'domcontentloaded' });

        // Condition waits: list cards and leaflet map canvas render concurrently
        await page.locator('[data-biz-id="biz_alpha"]').first().waitFor({ state: 'visible', timeout: 7000 });
        const mapCanvas = page.locator('.leaflet-container').first();
        await mapCanvas.waitFor({ state: 'visible', timeout: 7000 });

        assert.ok(await page.locator('[data-biz-id="biz_alpha"]').first().isVisible(), 'List card must be visible');
        assert.ok(await mapCanvas.isVisible(), 'Map pane with Leaflet canvas must be concurrently visible at 1280px');

        console.log('✓ Contract 4 Passed: Desktop two-pane concurrently renders list and map at 1280px.');
        results.push({ contract: '4. Desktop Two-Pane (>=1024px)', status: 'PASS' });
      } catch (err) {
        console.error('✗ Contract 4 Failed with error stack:\n', err);
        results.push({ contract: '4. Desktop Two-Pane (>=1024px)', status: 'FAIL', error: err.message });
        throw err;
      } finally {
        await context.close();
      }
    }

    // -------------------------------------------------------------
    // Contract 5: Drawer Focus Trap + Esc
    // -------------------------------------------------------------
    console.log('\n--- Contract 5: Drawer Focus Trap + Esc ---');
    {
      const { context, page } = await setupContext(browser, { width: 390, height: 844 });
      try {
        await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });

        const moreBtn = page.locator('button[aria-label*="المزيد"]').first();
        await moreBtn.waitFor({ state: 'visible', timeout: 7000 });
        await moreBtn.click();

        // Condition wait: drawer dialog becomes visible
        const drawerDialog = page.locator('[role="dialog"][aria-labelledby="navbar-drawer-title"]').first();
        await drawerDialog.waitFor({ state: 'visible', timeout: 7000 });
        assert.ok(await drawerDialog.isVisible(), 'Navbar drawer dialog must be visible upon clicking trigger');

        // Condition wait: focus is trapped inside drawer
        await page.waitForFunction(() => {
          const dlg = document.querySelector('[role="dialog"][aria-labelledby="navbar-drawer-title"]');
          return dlg ? dlg.contains(document.activeElement) : false;
        }, { timeout: 7000 });

        // Press Tab 3 times and assert focus stays trapped inside drawer
        for (let i = 0; i < 3; i++) {
          await page.keyboard.press('Tab');
          const trapped = await page.evaluate(() => {
            const dlg = document.querySelector('[role="dialog"][aria-labelledby="navbar-drawer-title"]');
            return dlg ? dlg.contains(document.activeElement) : false;
          });
          assert.ok(trapped, `Focus must remain trapped inside drawer dialog on Tab #${i + 1}`);
        }

        // Press Escape to dismiss drawer
        await page.keyboard.press('Escape');

        // Condition wait: drawer dialog is dismissed/hidden
        await drawerDialog.waitFor({ state: 'hidden', timeout: 7000 });
        const isDrawerClosed = (await drawerDialog.count()) === 0 || !(await drawerDialog.isVisible());
        assert.ok(isDrawerClosed, 'Drawer dialog must dismiss upon pressing Escape');

        console.log('✓ Contract 5 Passed: Drawer focus trap initialized, maintained, and dismissed via Escape.');
        results.push({ contract: '5. Drawer Focus Trap & Esc', status: 'PASS' });
      } catch (err) {
        console.error('✗ Contract 5 Failed with error stack:\n', err);
        results.push({ contract: '5. Drawer Focus Trap & Esc', status: 'FAIL', error: err.message });
        throw err;
      } finally {
        await context.close();
      }
    }

    // -------------------------------------------------------------
    // Contract 6: Browser Back Button Closes Modal
    // -------------------------------------------------------------
    console.log('\n--- Contract 6: Back-Button Closes Modal ---');
    {
      const { context, page } = await setupContext(browser, { width: 390, height: 844 });
      try {
        await page.goto(`${baseUrl}/search`, { waitUntil: 'domcontentloaded' });
        await page.locator('[data-biz-id="biz_alpha"]').first().waitFor({ state: 'visible', timeout: 7000 });

        // Open detail modal via card click
        const cardTitle = page.locator('[data-biz-id="biz_alpha"] h3 button').first();
        await cardTitle.waitFor({ state: 'visible', timeout: 7000 });
        await cardTitle.click();

        // Condition wait: detail modal is visible
        const detailModal = page.locator('[role="dialog"][aria-labelledby="activity-detail-modal-title"]').first();
        await detailModal.waitFor({ state: 'visible', timeout: 7000 });
        assert.ok(await detailModal.isVisible(), 'Detail modal must be visible after clicking card');

        // Trigger browser back
        await page.goBack();

        // Condition wait: detail modal is dismissed and URL is /search
        await detailModal.waitFor({ state: 'hidden', timeout: 7000 });
        await page.waitForURL((url) => url.pathname.includes('/search'), { timeout: 7000 });

        const isModalDismissed = (await detailModal.count()) === 0 || !(await detailModal.isVisible());
        assert.ok(isModalDismissed, 'Detail modal must dismiss cleanly upon browser back navigation');
        assert.ok(page.url().includes('/search'), `Page must stay on /search after modal dismiss, got: ${page.url()}`);

        console.log('✓ Contract 6 Passed: Browser back button cleanly dismisses detail modal without route loss.');
        results.push({ contract: '6. Back-Button Closes Modal', status: 'PASS' });
      } catch (err) {
        console.error('✗ Contract 6 Failed with error stack:\n', err);
        results.push({ contract: '6. Back-Button Closes Modal', status: 'FAIL', error: err.message });
        throw err;
      } finally {
        await context.close();
      }
    }

    // -------------------------------------------------------------
    // Contract 7: Deep Link Opens Detail Modal
    // -------------------------------------------------------------
    console.log('\n--- Contract 7: Deep Link Opens Detail Modal ---');
    {
      const { context, page } = await setupContext(browser, { width: 390, height: 844 });
      try {
        await page.goto(`${baseUrl}/biz/biz_alpha`, { waitUntil: 'domcontentloaded' });

        // Condition wait: detail modal is opened directly
        const detailModal = page.locator('[role="dialog"][aria-labelledby="activity-detail-modal-title"]').first();
        await detailModal.waitFor({ state: 'visible', timeout: 7000 });
        assert.ok(await detailModal.isVisible(), 'Direct deep link /biz/biz_alpha must open detail modal');

        // Condition wait: target business name is rendered in modal
        await detailModal.getByText('صيدلية ألفا').first().waitFor({ state: 'visible', timeout: 7000 });
        const modalText = await detailModal.innerText();
        assert.ok(modalText.includes('صيدلية ألفا'), 'Detail modal must display target business title');

        // Close modal using close button
        const closeBtn = detailModal.locator('button[aria-label="إغلاق"]').first();
        await closeBtn.waitFor({ state: 'visible', timeout: 7000 });
        await closeBtn.click();

        // Condition wait: modal is dismissed
        await detailModal.waitFor({ state: 'hidden', timeout: 7000 });
        const isClosed = (await detailModal.count()) === 0 || !(await detailModal.isVisible());
        assert.ok(isClosed, 'Detail modal must close upon clicking close button');

        console.log('✓ Contract 7 Passed: Direct deep link /biz/:id successfully opens target business modal.');
        results.push({ contract: '7. Deep Link Opens Detail', status: 'PASS' });
      } catch (err) {
        console.error('✗ Contract 7 Failed with error stack:\n', err);
        results.push({ contract: '7. Deep Link Opens Detail', status: 'FAIL', error: err.message });
        throw err;
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
    if (server && server.httpServer) {
      server.httpServer.close();
    }
  }

  console.log('\n===================================================================');
  console.log('📊 BEHAVIORAL ASSERTION SUMMARY:');
  const failures = results.filter((r) => r.status === 'FAIL');
  for (const r of results) {
    console.log(`  ${r.status === 'PASS' ? '✅' : '❌'} ${r.contract}: ${r.status}${r.error ? ` (${r.error})` : ''}`);
  }
  console.log('===================================================================');

  if (failures.length > 0) {
    console.error(`💥 ${failures.length} behavioral assertions failed!`);
    process.exit(1);
  } else {
    console.log(`🎉 All ${results.length}/7 behavioral contracts passed with 100% compliance!`);
    process.exit(0);
  }
}

runBehavioralTests().catch((err) => {
  console.error('Fatal behavioral test runner error:', err);
  process.exit(1);
});
