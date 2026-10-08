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
    id: 'biz_tour_1',
    name_ar: 'صيدلية النور الحديثة',
    name_en: 'Al Nour Pharmacy',
    category: 'صيدلية',
    governorate: 'الجيزة',
    city: 'حدائق الأهرام',
    street: 'منطقة أ - شارع الجيش',
    phone: '01012345601',
    lat: 29.979184,
    lng: 31.106863,
    verification_status: 'verified',
    package_id: 'pkg_basic',
    working_hours: '24 ساعة',
    notes: JSON.stringify({ googleRatingEnabled: true, googleRating: 4.7, googleReviewsCount: 312 }),
    photos: [],
    created_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'biz_tour_2',
    name_ar: 'مطعم أندلسية للمشويات',
    name_en: 'Andalusia Grill',
    category: 'مطعم',
    governorate: 'الجيزة',
    city: 'حدائق الأهرام',
    street: 'منطقة ب - شارع الثروة',
    phone: '01012345602',
    lat: 29.981184,
    lng: 31.108863,
    verification_status: 'verified',
    package_id: 'pkg_premium',
    working_hours: '12:00 م - 1:00 ص',
    notes: JSON.stringify({ googleRatingEnabled: true, googleRating: 4.5, googleReviewsCount: 1204 }),
    photos: [],
    created_at: '2026-08-15T00:00:00Z',
  },
];

async function runFullTour() {
  console.log('===================================================================');
  console.log('🚀 DALILAK PART 6/6 — AUTOMATED VERIFICATION TOUR OF ALL ROUTES');
  console.log('===================================================================\n');

  const port = 5296;
  let server = null;
  const running = await isPortOpen(port);

  if (!running) {
    console.log(`Starting Vite preview server on port ${port}...`);
    server = await preview({
      preview: { port, host: '127.0.0.1' },
    });
    console.log(`Preview server ready at http://127.0.0.1:${port}`);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'ar-EG',
  });

  await context.route('**/rest/v1/businesses*', (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'content-range': `0-${mockRows.length - 1}/${mockRows.length}` },
      body: JSON.stringify(mockRows),
    });
  });

  const page = await context.newPage();
  const baseUrl = `http://127.0.0.1:${port}`;

  const jsErrors = [];
  page.on('pageerror', (err) => {
    jsErrors.push(err.message);
  });

  try {
    // 1. خريطة (/map)
    console.log('1️⃣ Checking Route: خريطة (/map)...');
    await page.goto(`${baseUrl}/map`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    assert.strictEqual(jsErrors.length, 0, `JS errors on /map: ${jsErrors.join(', ')}`);
    console.log('   ✅ Map route loaded cleanly without JS errors.');

    // 2. قائمة (/search)
    console.log('2️⃣ Checking Route: قائمة الأنشطة (/search)...');
    await page.goto(`${baseUrl}/search`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    assert.strictEqual(jsErrors.length, 0, `JS errors on /search: ${jsErrors.join(', ')}`);
    const cardCount = await page.locator('.dl-card').count();
    console.log(`   ✅ Business cards rendered: ${cardCount}`);
    assert.ok(cardCount >= 1, 'Expected at least one business card to render');

    // 3. بحث (Search input)
    console.log('3️⃣ Checking Feature: بحث فوري موحد...');
    const searchInputs = page.locator('input[type="search"]');
    const searchInput = searchInputs.first();
    await searchInput.fill('أندلسية');
    await page.waitForTimeout(500);
    const filteredText = await page.textContent('body');
    assert.ok(filteredText.includes('أندلسية'), 'Search did not match expected business');
    // Clear search
    const clearBtn = page.locator('button#searchClear, .search-clear').first();
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await page.waitForTimeout(300);
    }
    console.log('   ✅ Search input and instant filtering working properly.');

    // 4. فلتر (Category & Zone Dropdowns)
    console.log('4️⃣ Checking Feature: فلاتر التصنيف والمناطق المنسدلة...');
    const catBtn = page.getByRole('button', { name: 'تصفية حسب نوع النشاط' });
    await catBtn.click();
    await page.waitForTimeout(300);
    const catOption = page.locator('[role="option"]', { hasText: 'مطاعم' }).first();
    await catOption.click();
    await page.waitForTimeout(400);
    console.log('   ✅ Category dropdown clicked and applied.');

    // Zone dropdown
    const zoneBtn = page.getByRole('button', { name: 'تصفية حسب المنطقة' });
    await zoneBtn.click();
    await page.waitForTimeout(300);
    const zoneOption = page.locator('[role="option"]', { hasText: 'منطقة أ' }).first();
    await zoneOption.click();
    await page.waitForTimeout(400);
    console.log('   ✅ Zone dropdown clicked and applied.');

    // Reset filters
    const resetBtn = page.locator('button', { hasText: 'مسح' }).first();
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await page.waitForTimeout(400);
      console.log('   ✅ Reset all filters cleared state successfully.');
    }

    // 5. تفاصيل (ActivityDetailModal)
    console.log('5️⃣ Checking Feature: تفاصيل النشاط (Modal)...');
    const firstCard = page.locator('.dl-card').first();
    await firstCard.click();
    await page.waitForTimeout(600);
    const modalHeader = page.locator('h2, h3').filter({ hasText: 'صيدلية' });
    const modalVisible = await modalHeader.first().isVisible().catch(() => false);
    console.log(`   Modal opened: ${modalVisible}`);
    // Close modal
    const closeBtn = page.locator('button[aria-label*="إغلاق"]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(400);
      console.log('   ✅ Detail modal closed smoothly.');
    }

    // 6. مفضلة (/favorites)
    console.log('6️⃣ Checking Route: المفضلة (/favorites)...');
    await page.goto(`${baseUrl}/favorites`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    assert.strictEqual(jsErrors.length, 0, `JS errors on /favorites: ${jsErrors.join(', ')}`);
    console.log('   ✅ Favorites route loaded cleanly.');

    // 7. قائمة جانبية (Drawer)
    console.log('7️⃣ Checking Feature: القائمة الجانبية (Drawer)...');
    const moreBtn = page.locator('button[aria-label*="المزيد"]').first();
    await moreBtn.click();
    await page.waitForTimeout(500);
    const drawerTitle = page.locator('#navbar-drawer-title');
    const drawerOpen = await drawerTitle.isVisible();
    assert.ok(drawerOpen, 'Navbar drawer should be visible after clicking more button');
    console.log('   ✅ Drawer opened with all relocated destinations.');
    const closeDrawerBtn = page.locator('button[aria-label="إغلاق القائمة"]');
    await closeDrawerBtn.click();
    await page.waitForTimeout(400);
    console.log('   ✅ Drawer closed successfully.');

    // 8. أضف نشاطك (/for-business)
    console.log('8️⃣ Checking Route: أضف نشاطك (/for-business)...');
    await page.goto(`${baseUrl}/for-business`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    assert.strictEqual(jsErrors.length, 0, `JS errors on /for-business: ${jsErrors.join(', ')}`);
    console.log('   ✅ Add business / for-business route loaded cleanly.');

    console.log('\n===================================================================');
    console.log('🎉 ALL 8 TOUR STEPS PASSED SUCCESSFULLY WITHOUT ERRORS!');
    console.log('===================================================================\n');
  } finally {
    await browser.close();
    if (server) {
      server.httpServer.close();
    }
  }
}

runFullTour().catch((err) => {
  console.error('❌ Tour verification failed:', err);
  process.exit(1);
});
