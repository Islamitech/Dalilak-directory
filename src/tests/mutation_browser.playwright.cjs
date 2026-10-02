const assert = require('node:assert/strict');
const path = require('node:path');
const net = require('node:net');
const { chromium, setup, rows } = require('../../verification/browser-harness.cjs');

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

async function runBrowserScenarios() {
  console.log('=== RUNNING VERIFIED MUTATION BROWSER SCENARIOS (U3, U4, U7, B4) ===\n');

  const isMutationCopy = process.cwd().includes('mutation-copy') || __dirname.includes('mutation-copy');
  const defaultPort = isMutationCopy ? 5293 : 5291;
  const port = Number(process.env.TEST_PORT) || defaultPort;
  let devServer = null;

  const open = await isPortOpen(port);
  if (!open) {
    console.log(`Port ${port} not running, starting local Vite dev server...`);
    const { createServer } = await import('vite');
    const react = (await import('@vitejs/plugin-react')).default;
    const tailwind = (await import('@tailwindcss/vite')).default;
    const root = process.env.TEST_ROOT || process.cwd();
    devServer = await createServer({
      configFile: false,
      root,
      cacheDir: path.join(process.cwd(), 'verification/vite-cache', 'temp-' + Date.now()),
      plugins: [react(), tailwind()],
      server: { host: '127.0.0.1', port, strictPort: true, fs: { allow: [process.cwd()] } },
      optimizeDeps: { include: ['react', 'react-dom/client', 'react/jsx-runtime'] },
    });
    await devServer.listen();
    console.log(`Dev server started on port ${port}`);
  }

  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });

  const failures = [];

  try {
    // -------------------------------------------------------------------------
    // Scenario U3: Details / Back / Forward navigation restores modal
    // -------------------------------------------------------------------------
    console.log('--- Running Scenario U3: History Back/Forward modal persistence ---');
    try {
      const s = await setup(browser, { width: 390, height: 844 }, port);
      const p = s.page;
      p.setDefaultTimeout(12000);

      await p.goto(s.url + '/search', { waitUntil: 'domcontentloaded', timeout: 20000 });

      const alphaCard = p.getByText('صيدلية ألفا', { exact: true }).first();
      await alphaCard.waitFor({ timeout: 5000 });
      await alphaCard.click();
      await p.waitForTimeout(300);

      assert.ok(await p.getByTitle('إغلاق', { exact: true }).count() > 0, 'Modal must open on click');

      // Go back: modal should close
      await p.goBack();
      await p.waitForTimeout(250);
      assert.strictEqual(await p.getByTitle('إغلاق', { exact: true }).count(), 0, 'Modal must close on browser back');

      // Go forward: modal should reopen
      await p.goForward();
      await p.waitForTimeout(300);
      const isOpenOnForward = await p.getByTitle('إغلاق', { exact: true }).count() > 0;
      assert.strictEqual(isOpenOnForward, true, 'Modal must reopen on browser forward');

      console.log('✓ Scenario U3 Passed\n');
      await s.context.close();
    } catch (err) {
      console.error('✗ Scenario U3 FAILED:', err.message, '\n');
      failures.push({ scenario: 'U3', error: err.message });
    }

    // -------------------------------------------------------------------------
    // Scenario U4: Direct-link modal stays closed after dismiss and retry
    // -------------------------------------------------------------------------
    console.log('--- Running Scenario U4: Direct-link dismiss remains closed on retry ---');
    try {
      const s = await setup(browser, { width: 390, height: 844 }, port);
      const p = s.page;
      p.setDefaultTimeout(5000);

      await p.goto(s.url + '/biz/biz_alpha');
      await p.waitForTimeout(700);

      const closeBtn = p.getByTitle('إغلاق', { exact: true });
      await closeBtn.waitFor({ timeout: 5000 });
      await closeBtn.click();
      await p.waitForTimeout(250);

      // Trigger catalog retry / re-fetch
      rows[1].name_ar = 'صيدلية بيتا محدثة';
      await p.evaluate(() => window.dispatchEvent(new Event('directory:retry')));
      await p.waitForTimeout(600);

      const modalCount = await p.getByTitle('إغلاق', { exact: true }).count();
      assert.strictEqual(modalCount, 0, 'Modal must NOT reopen after user dismissed direct link');

      console.log('✓ Scenario U4 Passed\n');
      rows[1].name_ar = 'صيدلية بيتا';
      await s.context.close();
    } catch (err) {
      rows[1].name_ar = 'صيدلية بيتا';
      console.error('✗ Scenario U4 FAILED:', err.message, '\n');
      failures.push({ scenario: 'U4', error: err.message });
    }

    // -------------------------------------------------------------------------
    // Scenario U7: Detail modal resets gallery photos between businesses
    // -------------------------------------------------------------------------
    console.log('--- Running Scenario U7: Gallery photo reset across business modals ---');
    try {
      const s = await setup(browser, { width: 390, height: 844 }, port);
      const p = s.page;
      p.setDefaultTimeout(5000);

      await p.goto(s.url + '/search');
      await p.waitForTimeout(700);

      const alphaCard = p.getByText('صيدلية ألفا', { exact: true }).first();
      await alphaCard.waitFor({ timeout: 5000 });
      await alphaCard.click();
      await p.getByTitle('إغلاق', { exact: true }).waitFor({ timeout: 5000 });
      await p.waitForTimeout(500);

      const modal = p.locator('div.fixed.inset-0.z-50').last();
      const betaInRelated = modal.getByText('صيدلية بيتا', { exact: true });
      await betaInRelated.waitFor({ timeout: 4000 });

      const beforeImg = await modal.locator('img').first().getAttribute('src');
      assert.ok(beforeImg.includes('fixture.test/a.svg'), ' صيدلية ألفا must display its own photo');

      await betaInRelated.click();
      await p.waitForTimeout(600);

      const afterModal = p.locator('div.fixed.inset-0.z-50').last();
      const afterImg = await afterModal.locator('img').first().getAttribute('src');

      assert.ok(
        !afterImg.includes('fixture.test/a.svg'),
        ` صيدلية بيتا (no photos) must NOT display صيدلية ألفا photo (found: ${afterImg})`
      );

      console.log('✓ Scenario U7 Passed\n');
      await s.context.close();
    } catch (err) {
      console.error('✗ Scenario U7 FAILED:', err.message, '\n');
      failures.push({ scenario: 'U7', error: err.message });
    }

    // -------------------------------------------------------------------------
    // Scenario B4: Realtime updates survive in-flight REST snapshot completion
    // -------------------------------------------------------------------------
    console.log('--- Running Scenario B4: In-flight REST does not overwrite realtime updates ---');
    try {
      const s = await setup(browser, { width: 390, height: 844 }, port);
      const p = s.page;
      p.setDefaultTimeout(6000);

      await s.context.route((u) => u.pathname === '/src/services/supabaseClient.ts', (r) =>
        r.fulfill({
          contentType: 'application/javascript',
          body: 'export const SUPABASE_REST_BASE="https://mock.supabase.co/rest/v1";export const SUPABASE_ANON_KEY="placeholder";export const supabase={channel(){const c={on(t,o,f){window.__realtime=f;return c;},subscribe(){return c;}};return c;},removeChannel(){}};',
        })
      );

      await p.goto(s.url + '/search');
      await p.waitForTimeout(700);

      let heldRestRequest = null;
      await s.context.route('**/rest/v1/businesses?**', (route) => {
        heldRestRequest = route;
      });

      // Trigger directory reload
      await p.evaluate(() => window.dispatchEvent(new Event('directory:retry')));
      for (let i = 0; i < 50 && !heldRestRequest; i++) {
        await p.waitForTimeout(30);
      }
      assert.ok(heldRestRequest, 'REST query must be intercepted and held');

      // Dispatch realtime UPDATE while REST request is held
      await p.evaluate(
        (row) => window.__realtime({ eventType: 'UPDATE', new: row, old: { id: row.id } }),
        { ...rows[0], name_ar: 'صيدلية ألفا لحظية' }
      );
      await p.waitForTimeout(150);

      const liveVisible = (await p.getByText('صيدلية ألفا لحظية', { exact: true }).count()) > 0;
      assert.strictEqual(liveVisible, true, 'Realtime update must be rendered immediately');

      // Now complete the stale REST request with older rows
      await heldRestRequest.fulfill({
        contentType: 'application/json',
        headers: { 'content-range': '0-1/2' },
        body: JSON.stringify(rows),
      });
      await p.waitForTimeout(400);

      const stillVisible = (await p.getByText('صيدلية ألفا لحظية', { exact: true }).count()) > 0;
      assert.strictEqual(
        stillVisible,
        true,
        'Realtime update must survive completion of stale REST snapshot'
      );

      console.log('✓ Scenario B4 Passed\n');
      await s.context.close();
    } catch (err) {
      console.error('✗ Scenario B4 FAILED:', err.message, '\n');
      failures.push({ scenario: 'B4', error: err.message });
    }
  } finally {
    await browser.close();
    if (devServer) {
      await devServer.close();
    }
  }

  console.log('===================================================================');
  console.log(`TOTAL SCENARIOS: 4, FAILURES: ${failures.length}`);
  if (failures.length > 0) {
    console.log('FAILED SCENARIOS:');
    for (const f of failures) {
      console.log(`- ${f.scenario}: ${f.error}`);
    }
    process.exit(1);
  } else {
    console.log('ALL VERIFIED MUTATION BROWSER SCENARIOS PASSED!');
    process.exit(0);
  }
}

if (require.main === module) {
  runBrowserScenarios().catch((e) => {
    console.error('Browser scenarios crashed:', e);
    process.exit(1);
  });
}

module.exports = { runBrowserScenarios };
