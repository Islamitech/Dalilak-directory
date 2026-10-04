const path = require('path');
const fs = require('fs');
const { chromium } = require('../verification/browser-harness.cjs');
const { createServer } = require('vite');

process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fixture.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key-dalilak';

const EVIDENCE_DIR = path.resolve(__dirname, '../reports/evidence');
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function verifyCategoryBar360() {
  console.log('🚀 [verify-category-bar-360] Starting Vite server on port 5198...');
  const server = await createServer({
    configFile: path.resolve(__dirname, '../vite.config.ts'),
    server: { port: 5198, host: '127.0.0.1' },
  });
  await server.listen();
  const url = 'http://127.0.0.1:5198';
  console.log(`📡 Vite server listening at ${url}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 360, height: 740 },
    isMobile: true,
    hasTouch: true,
    locale: 'ar-EG',
  });

  const page = await context.newPage();
  page.on('console', (msg) => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.error('BROWSER ERROR:', err));

  await page.route('**/rest/v1/businesses?**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'content-range': '0-1/2' },
      body: JSON.stringify([
        {
          id: 'biz_1',
          name_ar: 'صيدلية تجريبية',
          category: 'صيدلية',
          governorate: 'الجيزة',
          city: 'حدائق الأهرام',
          street: 'منطقة ب',
          phone: '01012345678',
          lat: 29.979184,
          lng: 31.106863,
          verification_status: 'verified',
          package_id: 'pkg_basic',
          created_at: '2026-09-01T00:00:00Z',
        },
      ]),
    })
  );
  await page.routeWebSocket(/supabase/, (ws) => ws.close());

  try {
    console.log('🌐 Navigating to app at 360px viewport...');
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const title = await page.title();
    console.log('Page Title:', title);

    const categoryNav = page.locator('nav[aria-label="تصنيفات الأنشطة والخدمات"]');
    await categoryNav.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Found CategoryBar element.');

    const metrics = await categoryNav.evaluate((nav) => {
      const scrollContainer = nav.querySelector('div.overflow-x-auto');
      if (!scrollContainer) return null;
      return {
        navClientWidth: nav.clientWidth,
        scrollContainerClientWidth: scrollContainer.clientWidth,
        scrollContainerScrollWidth: scrollContainer.scrollWidth,
        direction: window.getComputedStyle(scrollContainer).direction,
        chipCount: scrollContainer.querySelectorAll('button').length,
      };
    });

    console.log('📊 CategoryBar metrics:', metrics);
    if (!metrics) throw new Error('Scroll container div.overflow-x-auto not found');
    if (metrics.navClientWidth > 360) {
      throw new Error(`Nav width ${metrics.navClientWidth}px exceeds 360px viewport!`);
    }
    if (metrics.scrollContainerScrollWidth <= metrics.scrollContainerClientWidth) {
      throw new Error('CategoryBar does not have horizontal overflow to scroll!');
    }
    console.log(`✅ Overflow verified: scrollWidth (${metrics.scrollContainerScrollWidth}px) > clientWidth (${metrics.scrollContainerClientWidth}px)`);

    // Scroll horizontally by 120px to activate start edge fade
    await categoryNav.locator('div.overflow-x-auto').evaluate((el) => {
      // In RTL, scroll left by -120 or 120 depending on browser
      el.scrollLeft = -120;
      el.dispatchEvent(new Event('scroll'));
    });
    await page.waitForTimeout(300);

    const screenshotPath = path.join(EVIDENCE_DIR, 'category_bar_360px_scrolled.png');
    await categoryNav.screenshot({ path: screenshotPath });
    console.log(`📸 Screenshot successfully captured: ${screenshotPath}`);

    // Verify first non-all chip click updates aria-pressed
    const chips = categoryNav.locator('button');
    const chipCount = await chips.count();
    console.log(`🔘 Total category filter chips: ${chipCount}`);
    if (chipCount < 2) throw new Error('Expected at least 2 chips in CategoryBar');

    const firstChip = chips.nth(0);
    const secondChip = chips.nth(1);

    const initialFirstPressed = await firstChip.getAttribute('aria-pressed');
    console.log(`Chip 0 aria-pressed initial: ${initialFirstPressed}`);

    await secondChip.click();
    await page.waitForTimeout(200);

    const afterSecondPressed = await secondChip.getAttribute('aria-pressed');
    const afterFirstPressed = await firstChip.getAttribute('aria-pressed');
    console.log(`Chip 1 aria-pressed after click: ${afterSecondPressed}`);
    console.log(`Chip 0 aria-pressed after click: ${afterFirstPressed}`);

    if (afterSecondPressed !== 'true' || afterFirstPressed === 'true') {
      throw new Error('CategoryBar selection aria-pressed state did not update correctly!');
    }
    console.log('✅ Chip selection and aria-pressed states verified.');
    console.log('🎉 CategoryBar 360px verification SUCCESSFUL.');
  } finally {
    await browser.close();
    await server.close();
  }
}

verifyCategoryBar360().catch((err) => {
  console.error('❌ CategoryBar 360 verification failed:', err);
  process.exit(1);
});
