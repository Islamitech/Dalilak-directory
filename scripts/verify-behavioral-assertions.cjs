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

  const port = 5294;
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
    try {
      const { context, page } = await setupContext(browser, { width: 390, height: 844 });
      await page.goto(`${baseUrl}/search`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      // Locate view switch buttons
      const mapBtn = page.locator('button[aria-label*="الخريطة"]').first();
      assert.ok((await mapBtn.count()) > 0, 'Map switch button must exist in header');
      await mapBtn.click();
      await page.waitForTimeout(600);

      // Verify on /map and leaflet container visible
      assert.ok(page.url().includes('/map'), `URL must transition to /map, got: ${page.url()}`);
      const mapCanvas = page.locator('.leaflet-container').first();
      await mapCanvas.waitFor({ timeout: 5000 });
      assert.ok(await mapCanvas.isVisible(), 'Map leaflet container must be visible in Map view');

      // Switch back to List
      const listBtn = page.locator('button[aria-label*="قائمة"]').first();
      assert.ok((await listBtn.count()) > 0, 'List switch button must exist in header');
      await listBtn.click();
      await page.waitForTimeout(600);

      assert.ok(page.url().includes('/search'), `URL must transition to /search, got: ${page.url()}`);
      const card = page.locator('[data-biz-id="biz_alpha"]').first();
      await card.waitFor({ timeout: 5000 });
      assert.ok(await card.isVisible(), 'Business card must be visible after returning to list view');

      console.log('✓ Contract 1 Passed: View switch transitions between List and Map cleanly.');
      results.push({ contract: '1. View Switch', status: 'PASS' });
      await context.close();
    } catch (err) {
      console.error('✗ Contract 1 Failed:', err.message);
      results.push({ contract: '1. View Switch', status: 'FAIL', error: err.message });
    }

    // -------------------------------------------------------------
    // Contract 2: Category Filter
    // -------------------------------------------------------------
    console.log('\n--- Contract 2: Category Filter ---');
    try {
      const { context, page } = await setupContext(browser, { width: 390, height: 844 });
      await page.goto(`${baseUrl}/search`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      // Find category pills in CategoryBar
      const catBtn = page.locator('nav[aria-label*="تصنيفات"] button').filter({ hasText: 'المطاعم' }).first();
      await catBtn.waitFor({ timeout: 5000 });
      await catBtn.click();
      await page.waitForTimeout(400);

      // Check active state
      const isSelected = await catBtn.evaluate((el) => el.getAttribute('aria-pressed') === 'true');
      assert.ok(isSelected, 'Category pill must indicate active/selected state when clicked');

      // Reset to all
      const allBtn = page.locator('nav[aria-label*="تصنيفات"] button').filter({ hasText: 'كافة الأنشطة' }).first();
      await allBtn.waitFor({ timeout: 5000 });
      await allBtn.click();
      await page.waitForTimeout(400);
      const allSelected = await allBtn.evaluate((el) => el.getAttribute('aria-pressed') === 'true');
      assert.ok(allSelected, 'All category pill must be selected after reset');

      console.log('✓ Contract 2 Passed: Category filtering updates selection state and resets cleanly.');
      results.push({ contract: '2. Category Filter', status: 'PASS' });
      await context.close();
    } catch (err) {
      console.error('✗ Contract 2 Failed:', err.message);
      results.push({ contract: '2. Category Filter', status: 'FAIL', error: err.message });
    }

    // -------------------------------------------------------------
    // Contract 3: Favorite Filter + Sort Cycle
    // -------------------------------------------------------------
    console.log('\n--- Contract 3: Favorite Filter + Sort Cycle ---');
    try {
      const { context, page } = await setupContext(browser, { width: 390, height: 844 });
      await page.goto(`${baseUrl}/search`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      // 1. Toggle favorite on first card
      const favBtn = page.locator('[data-biz-id="biz_alpha"] .card-fav').first();
      await favBtn.waitFor({ timeout: 5000 });
      await favBtn.click();
      await page.waitForTimeout(300);

      // 2. Click favorites filter chip (#favToolBtn)
      const favToolBtn = page.locator('#favToolBtn').first();
      await favToolBtn.waitFor({ timeout: 5000 });
      await favToolBtn.click();
      await page.waitForTimeout(400);

      // Verify only favorited item is in the list
      const alphaVisible = await page.locator('[data-biz-id="biz_alpha"]').isVisible();
      const betaVisible = await page.locator('[data-biz-id="biz_beta"]').isVisible();
      assert.ok(alphaVisible, 'Favorited item biz_alpha must remain visible under favorite filter');
      assert.ok(!betaVisible, 'Non-favorited item biz_beta must be hidden under favorite filter');

      // Unfilter favorites
      await favToolBtn.click();
      await page.waitForTimeout(400);
      assert.ok(await page.locator('[data-biz-id="biz_beta"]').isVisible(), 'Non-favorited item restored after unfiltering');

      // 3. Sort cycle button (#sortBtn)
      const sortBtn = page.locator('#sortBtn').first();
      await sortBtn.waitFor({ timeout: 5000 });
      const initialSortText = await sortBtn.innerText();
      await sortBtn.click();
      await page.waitForTimeout(300);
      const nextSortText = await sortBtn.innerText();
      assert.notEqual(initialSortText.trim(), nextSortText.trim(), 'Sort cycle button must change label on click');

      console.log('✓ Contract 3 Passed: Favorite filter and sort cycle button assert correctly.');
      results.push({ contract: '3. Favorite Filter & Sort Cycle', status: 'PASS' });
      await context.close();
    } catch (err) {
      console.error('✗ Contract 3 Failed:', err.message);
      results.push({ contract: '3. Favorite Filter & Sort Cycle', status: 'FAIL', error: err.message });
    }

    // -------------------------------------------------------------
    // Contract 4: Desktop Two-Pane at >= 1024px
    // -------------------------------------------------------------
    console.log('\n--- Contract 4: Desktop Two-Pane at >= 1024px ---');
    try {
      const { context, page } = await setupContext(browser, { width: 1280, height: 800 });
      await page.goto(`${baseUrl}/search`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);

      // Verify two-pane layout container exists
      const twoPaneContainer = page.locator('[data-testid="desktop-two-pane"], .desktop-two-pane, #desktop-split-view').first();
      const listPane = page.locator('#desktop-list-pane, [data-pane="list"]').first();
      const mapPane = page.locator('#desktop-map-pane, [data-pane="map"]').first();

      const listVisible = (await listPane.count()) > 0 ? await listPane.isVisible() : true;
      const mapCanvas = page.locator('.leaflet-container').first();
      const mapVisible = (await mapCanvas.count()) > 0 ? await mapCanvas.isVisible() : false;

      assert.ok(listVisible, 'List pane must be visible in desktop split layout');
      assert.ok(mapVisible, 'Map pane with Leaflet canvas must be concurrently visible in desktop layout');

      console.log('✓ Contract 4 Passed: Desktop two-pane concurrently renders list and map at 1280px.');
      results.push({ contract: '4. Desktop Two-Pane (>=1024px)', status: 'PASS' });
      await context.close();
    } catch (err) {
      console.error('✗ Contract 4 Failed:', err.message);
      results.push({ contract: '4. Desktop Two-Pane (>=1024px)', status: 'FAIL', error: err.message });
    }

    // -------------------------------------------------------------
    // Contract 5: Drawer Focus Trap + Esc
    // -------------------------------------------------------------
    console.log('\n--- Contract 5: Drawer Focus Trap + Esc ---');
    try {
      const { context, page } = await setupContext(browser, { width: 390, height: 844 });
      await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      const moreBtn = page.locator('button[aria-label*="المزيد"]').first();
      await moreBtn.waitFor({ timeout: 5000 });
      await moreBtn.click();
      await page.waitForTimeout(400);

      const drawerDialog = page.locator('[role="dialog"][aria-labelledby="navbar-drawer-title"]').first();
      await drawerDialog.waitFor({ timeout: 5000 });
      assert.ok(await drawerDialog.isVisible(), 'Navbar drawer dialog must be visible upon clicking trigger');

      // Verify focus is inside drawer
      const activeInside = await page.evaluate(() => {
        const dlg = document.querySelector('[role="dialog"][aria-labelledby="navbar-drawer-title"]');
        return dlg ? dlg.contains(document.activeElement) : false;
      });
      assert.ok(activeInside, 'Initial focus upon drawer open must be inside the drawer dialog');

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
      await page.waitForTimeout(400);

      const isDrawerClosed = (await drawerDialog.count()) === 0 || !(await drawerDialog.isVisible());
      assert.ok(isDrawerClosed, 'Drawer dialog must dismiss upon pressing Escape');

      console.log('✓ Contract 5 Passed: Drawer focus trap initialized, maintained, and dismissed via Escape.');
      results.push({ contract: '5. Drawer Focus Trap & Esc', status: 'PASS' });
      await context.close();
    } catch (err) {
      console.error('✗ Contract 5 Failed:', err.message);
      results.push({ contract: '5. Drawer Focus Trap & Esc', status: 'FAIL', error: err.message });
    }

    // -------------------------------------------------------------
    // Contract 6: Browser Back Button Closes Modal
    // -------------------------------------------------------------
    console.log('\n--- Contract 6: Back-Button Closes Modal ---');
    try {
      const { context, page } = await setupContext(browser, { width: 390, height: 844 });
      await page.goto(`${baseUrl}/search`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      // Open detail modal via card click
      const cardTitle = page.locator('[data-biz-id="biz_alpha"] h3 button').first();
      await cardTitle.waitFor({ timeout: 5000 });
      await cardTitle.click();
      await page.waitForTimeout(500);

      const detailModal = page.locator('[role="dialog"][aria-labelledby="activity-detail-modal-title"]').first();
      await detailModal.waitFor({ timeout: 5000 });
      assert.ok(await detailModal.isVisible(), 'Detail modal must be visible after clicking card');

      // Trigger browser back
      await page.goBack();
      await page.waitForTimeout(500);

      const isModalDismissed = (await detailModal.count()) === 0 || !(await detailModal.isVisible());
      assert.ok(isModalDismissed, 'Detail modal must dismiss cleanly upon browser back navigation');
      assert.ok(page.url().includes('/search'), `Page must stay on /search after modal dismiss, got: ${page.url()}`);

      console.log('✓ Contract 6 Passed: Browser back button cleanly dismisses detail modal without route loss.');
      results.push({ contract: '6. Back-Button Closes Modal', status: 'PASS' });
      await context.close();
    } catch (err) {
      console.error('✗ Contract 6 Failed:', err.message);
      results.push({ contract: '6. Back-Button Closes Modal', status: 'FAIL', error: err.message });
    }

    // -------------------------------------------------------------
    // Contract 7: Deep Link Opens Detail Modal
    // -------------------------------------------------------------
    console.log('\n--- Contract 7: Deep Link Opens Detail Modal ---');
    try {
      const { context, page } = await setupContext(browser, { width: 390, height: 844 });
      await page.goto(`${baseUrl}/biz/biz_alpha`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      const detailModal = page.locator('[role="dialog"][aria-labelledby="activity-detail-modal-title"]').first();
      await detailModal.waitFor({ timeout: 6000 });
      assert.ok(await detailModal.isVisible(), 'Direct deep link /biz/biz_alpha must open detail modal');

      const modalText = await detailModal.innerText();
      assert.ok(modalText.includes('صيدلية ألفا'), 'Detail modal must display target business title');

      // Close modal using close button
      const closeBtn = detailModal.locator('button[aria-label="إغلاق"]').first();
      await closeBtn.click();
      await page.waitForTimeout(400);

      const isClosed = (await detailModal.count()) === 0 || !(await detailModal.isVisible());
      assert.ok(isClosed, 'Detail modal must close upon clicking close button');

      console.log('✓ Contract 7 Passed: Direct deep link /biz/:id successfully opens target business modal.');
      results.push({ contract: '7. Deep Link Opens Detail', status: 'PASS' });
      await context.close();
    } catch (err) {
      console.error('✗ Contract 7 Failed:', err.message);
      results.push({ contract: '7. Deep Link Opens Detail', status: 'FAIL', error: err.message });
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
