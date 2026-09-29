const { chromium } = require('C:/Users/Ahmed/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

async function testRoute(browser, routePath, routeName) {
  console.log(`\n--- Testing ${routeName} (${routePath}) ---`);
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  let blockUnpkg = true;
  let requestCount = 0;

  await context.route(/unpkg\.com/, (route) => {
    requestCount++;
    if (blockUnpkg) {
      return route.abort('blockedbyclient');
    }
    return route.continue();
  });

  const page = await context.newPage();

  // 1. Block unpkg.com -> navigate to page
  console.log(`Step 1: Navigating to ${routePath} with unpkg.com blocked...`);
  await page.goto(`http://127.0.0.1:5291${routePath}`);

  // 2. Error card appears
  console.log('Step 2: Waiting for error card and retry button...');
  const retryBtn = page.getByRole('button', { name: 'إعادة المحاولة', exact: true });
  await retryBtn.waitFor({ timeout: 8000 });
  const initialRequests = requestCount;
  console.log(`Error card displayed! (initial requests to unpkg: ${initialRequests})`);

  // 3. Unblock unpkg.com
  console.log('Step 3: Unblocking unpkg.com...');
  blockUnpkg = false;

  // 4. Click Retry
  console.log('Step 4: Clicking "إعادة المحاولة" (Retry)...');
  await retryBtn.click();

  // 5. Verify Leaflet map appears in container
  console.log('Step 5: Waiting for map container to get a Leaflet map...');
  await page.locator('.leaflet-container').waitFor({ timeout: 8000 });

  const hasLeafletMap = await page.evaluate(() => {
    const container = document.querySelector('.leaflet-container');
    return !!(container && (container._leaflet_id || window.L));
  });

  assert.ok(hasLeafletMap, `Map container must get an active Leaflet map after retry on ${routePath}`);
  console.log(`✓ Passed: Map successfully loaded on retry for ${routePath}`);
  await context.close();
}

(async () => {
  console.log('=== Playwright Scenario: Leaflet Script Retry (ITEM A) ===');
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });

  try {
    // 1. Run against verification lab harness
    await testRoute(browser, '/verification/map-lab.html', 'Map Lab Harness');

    // 2. Run against real /map route
    await testRoute(browser, '/map', 'Real /map Route');

    console.log('\n✓ All Playwright Scenarios Passed: Both map-lab and /map succeeded on retry!');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('✗ Playwright Scenario Failed:');
    console.error(err.message);
    await browser.close();
    process.exit(1);
  }
})();
