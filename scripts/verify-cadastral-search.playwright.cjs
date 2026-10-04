const path = require('path');
const fs = require('fs');
const net = require('net');
const assert = require('node:assert/strict');
const { chromium, firefox, webkit } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;
const { preview } = require('vite');

process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fixture.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key-dalilak';

const EVIDENCE_DIR = path.resolve(__dirname, '../reports/evidence/cadastral');
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

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

const VIEWPORTS = [
  { name: '360', width: 360, height: 740, isMobile: true },
  { name: '1280', width: 1280, height: 800, isMobile: false },
];

async function run() {
  console.log('===================================================================');
  console.log('🏢 VERIFYING CADASTRAL BUILDING NUMBER SEARCH CONTRACT');
  console.log('===================================================================\n');

  const port = 5294;
  let server = null;
  const running = await isPortOpen(port);

  if (!running) {
    console.log(`Starting Vite preview server on port ${port}...`);
    server = await preview({
      preview: { port, host: '127.0.0.1' },
    });
    console.log(`Preview server ready at http://127.0.0.1:${port}\n`);
  }

  const baseUrl = `http://127.0.0.1:${port}`;
  const failures = [];

  // =========================================================================
  // 1. BEHAVIORAL ASSERTIONS & ACCESSIBILITY (CHROMIUM)
  // =========================================================================
  console.log('--- 1. Testing Search Entry Points & Contracts (Chromium) ---');
  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    console.log(`\nTesting Viewport ${vp.name}px (${vp.width}x${vp.height}):`);
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
      locale: 'ar-EG',
    });
    const page = await ctx.newPage();

    // A. Search View Entry Point with "265 ح"
    console.log(`  [${vp.name}] A. Search view: query "265 ح"`);
    if (vp.isMobile) {
      await page.goto(`${baseUrl}/search`);
      await page.waitForTimeout(600);
      const searchInput = page.locator('input[aria-label="البحث في الدليل"]').first();
      await searchInput.waitFor({ timeout: 5000 });
      await searchInput.fill('265 ح');
    } else {
      // DesktopTwoPaneView: navigate with query or use top bar search
      await page.goto(`${baseUrl}/search?q=265%20%D8%AD`);
    }
    await page.waitForTimeout(800);

    // Verify building card header
    const buildingCard = page.locator('text=عمارة 265 — منطقة (ح)').first();
    await buildingCard.waitFor({ timeout: 5000 });
    const isVisible = await buildingCard.isVisible();
    assert.strictEqual(isVisible, true, `CadastralBuildingCard must be visible for "265 ح" at ${vp.name}`);

    // Verify 44px min touch target on action button
    const actionBtn = page.locator('button:has-text("عرض على الخريطة")').first();
    await actionBtn.waitFor({ timeout: 4000 });
    const box = await actionBtn.boundingBox();
    assert.ok(box && box.height >= 43.5, `Map action button height must be >= 44px (got ${box?.height}px)`);

    // Verify normal business results container appears below the card without being hidden
    const listHeader = page.locator('.list-header').first();
    await listHeader.waitFor({ timeout: 4000 });
    assert.strictEqual(await listHeader.isVisible(), true, 'Normal business list header must remain displayed below building card');

    // Axe Accessibility check on building result state
    const axe = await new AxeBuilder({ page }).analyze();
    const seriousAxe = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    console.log(`  [${vp.name}] Axe serious/critical violations on building result state: ${seriousAxe.length}`);
    if (seriousAxe.length > 0) {
      console.log('VIOLATIONS:', JSON.stringify(seriousAxe.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map(n => n.html) })), null, 2));
    }
    assert.strictEqual(seriousAxe.length, 0, `Zero serious/critical accessibility violations required (got ${seriousAxe.length})`);

    // Screenshot
    const ssSearch = path.join(EVIDENCE_DIR, `cadastral_chromium_${vp.name}_search.png`);
    await page.screenshot({ path: ssSearch });
    console.log(`  [${vp.name}] Saved screenshot: ${ssSearch}`);

    // Action button navigation: clicks "عرض على الخريطة"
    await actionBtn.click();
    await page.waitForTimeout(800);
    const currentUrl = page.url();
    assert.ok(currentUrl.includes('/map') && currentUrl.includes('bldg=265') && currentUrl.includes('zone=%D8%AD'), `Must navigate to map with zone=ح and bldg=265 (got ${currentUrl})`);

    // B. Map Search Entry Point: query "265 ح" in MapModernTopBar
    console.log(`  [${vp.name}] B. Map search entry point: query "265 ح"`);
    await page.goto(`${baseUrl}/map`);
    await page.waitForTimeout(800);
    const mapInput = page.locator('input[aria-label="البحث عن نشاط أو مبنى"]').first();
    await mapInput.waitFor({ timeout: 5000 });
    await mapInput.fill('265 ح');
    await page.waitForTimeout(800);
    const mapSuggestion = page.locator('button:has-text("عمارة 265")').first();
    await mapSuggestion.waitFor({ timeout: 5000 });
    assert.strictEqual(await mapSuggestion.isVisible(), true, `Map dropdown must show building suggestion at ${vp.name}`);
    await mapSuggestion.click();
    await page.waitForTimeout(800);

    // C. Unknown Building "999 ح": clear "not found" state, no crash, no fake result
    console.log(`  [${vp.name}] C. Unknown building "999 ح" not-found contract`);
    await page.goto(`${baseUrl}/search?q=999%20%D8%AD`);
    await page.waitForTimeout(800);

    const unknownCardTitle = page.locator('text=عمارة 999 — منطقة (ح)').first();
    await unknownCardTitle.waitFor({ timeout: 5000 });
    const notFoundText = page.locator('text=هذه العمارة غير مسجلة في قاعدة بيانات حدائق الأهرام المساحية').first();
    assert.strictEqual(await notFoundText.isVisible(), true, 'Must display truthful not-found message for unknown building');
    const notFoundBadge = page.locator('text=غير مسجلة').first();
    assert.strictEqual(await notFoundBadge.isVisible(), true, 'Must display "غير مسجلة" badge');

    // Action button must NOT exist for unknown building
    const unknownActionBtn = page.locator('button:has-text("عرض على الخريطة")');
    assert.strictEqual(await unknownActionBtn.count(), 0, 'Must NOT show map navigation button for unknown building');

    // D. Deep Link Reload Resilience
    console.log(`  [${vp.name}] D. Deep link reload preservation`);
    await page.goto(`${baseUrl}/map?zone=%D8%AD&bldg=265`);
    await page.waitForTimeout(800);
    await page.reload();
    await page.waitForTimeout(800);
    const reloadUrl = page.url();
    assert.ok(reloadUrl.includes('bldg=265'), `Reload must preserve bldg param (got ${reloadUrl})`);
    assert.ok(reloadUrl.includes('zone=%D8%AD'), `Reload must preserve zone param (got ${reloadUrl})`);

    // Screenshot on map
    const ssMap = path.join(EVIDENCE_DIR, `cadastral_chromium_${vp.name}_map.png`);
    await page.screenshot({ path: ssMap });
    console.log(`  [${vp.name}] Saved screenshot: ${ssMap}`);

    await ctx.close();
  }

  await browser.close();

  // =========================================================================
  // 2. MULTI-BROWSER MATRIX (FIREFOX & WEBKIT SCREENSHOTS FOR "265 ح")
  // =========================================================================
  const otherBrowsers = [
    { name: 'firefox', engine: firefox },
    { name: 'webkit', engine: webkit },
  ];

  for (const ob of otherBrowsers) {
    console.log(`\n--- 2. Multi-browser: ${ob.name.toUpperCase()} ---`);
    let bInstance;
    try {
      bInstance = await ob.engine.launch({ headless: true });
    } catch (e) {
      console.log(`⚠️  Could not launch ${ob.name}: ${e.message}`);
      continue;
    }

    for (const vp of VIEWPORTS) {
      const ctx = await bInstance.newContext({
        viewport: { width: vp.name === '360' ? 360 : 1280, height: vp.name === '360' ? 740 : 800 },
        isMobile: vp.isMobile,
        locale: 'ar-EG',
      });
      const page = await ctx.newPage();
      try {
        await page.goto(`${baseUrl}/search?q=265%20%D8%AD`);
        await page.waitForTimeout(800);

        const card = page.locator('text=عمارة 265 — منطقة (ح)').first();
        await card.waitFor({ timeout: 5000 });

        const ssPath = path.join(EVIDENCE_DIR, `cadastral_${ob.name}_${vp.name}_search.png`);
        await page.screenshot({ path: ssPath });
        console.log(`  [${ob.name}] ${vp.name}px: captured ${ssPath}`);
      } catch (err) {
        console.error(`  [${ob.name}] Error at ${vp.name}px: ${err.message}`);
        failures.push({ browser: ob.name, viewport: vp.name, error: err.message });
      } finally {
        await ctx.close();
      }
    }
    await bInstance.close();
  }

  if (server) {
    if (server.httpServer) await new Promise((res) => server.httpServer.close(res));
    else if (server.close) await server.close();
  }

  console.log('\n===================================================================');
  console.log('🏁 CADASTRAL BUILDING SEARCH VERIFICATION COMPLETE');
  console.log('===================================================================');
  if (failures.length > 0) {
    console.error('❌ Failures encountered:', failures);
    process.exit(1);
  } else {
    console.log('🎉 ALL CADASTRAL CONTRACT TESTS & EVIDENCE CAPTURES PASSED!');
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
