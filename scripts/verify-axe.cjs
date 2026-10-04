const path = require('path');
const fs = require('fs');
const net = require('net');
const { chromium } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
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

const VIEWPORTS = [
  { name: '360px', width: 360, height: 740 },
  { name: '1280px', width: 1280, height: 800 },
];

async function runAxeAudit() {
  console.log('===================================================================');
  console.log('♿ RUNNING AXE-CORE ACCESSIBILITY AUDIT (SERIOUS/CRITICAL = 0)');
  console.log('===================================================================\n');

  const port = 5293;
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
  const browser = await chromium.launch({
    headless: true,
  });

  const allViolations = [];

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n--- Auditing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      async function runAxeTest(screenName, testFn) {
        console.log(`[${vp.name}] Testing: ${screenName}`);
        const p = await context.newPage();
        try {
          await testFn(p);
          const axe = await new AxeBuilder({ page: p }).analyze();
          const bad = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
          if (bad.length > 0) allViolations.push({ screen: `${screenName} (${vp.name})`, violations: bad });
          console.log(`  -> Serious/Critical: ${bad.length}, Total violations: ${axe.violations.length}`);
        } finally {
          await p.close();
        }
      }

      // 1. Home
      await runAxeTest('Home', async (p) => {
        await p.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
        await p.waitForTimeout(600);
      });

      // 2. Search
      await runAxeTest('Search', async (p) => {
        await p.goto(`${baseUrl}/search`, { waitUntil: 'domcontentloaded' });
        await p.waitForTimeout(600);
      });

      // 3. Map
      await runAxeTest('Map', async (p) => {
        await p.goto(`${baseUrl}/map`, { waitUntil: 'domcontentloaded' });
        await p.waitForTimeout(600);
      });

      // 4. Detail Modal
      await runAxeTest('Detail Modal', async (p) => {
        await p.goto(`${baseUrl}/biz/biz_alpha`, { waitUntil: 'domcontentloaded' });
        await p.waitForSelector('[role="dialog"]', { timeout: 8000 }).catch(() => null);
        await p.waitForTimeout(400);
      });

      // 5. More-Menu Drawer
      await runAxeTest('More-Menu Drawer', async (p) => {
        await p.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
        await p.waitForTimeout(400);
        const moreBtn = p.locator('button[aria-label*="المزيد"]').first();
        await moreBtn.waitFor({ timeout: 5000 });
        await moreBtn.click();
        await p.waitForSelector('#navbar-drawer-title, [role="dialog"]', { timeout: 5000 });
        await p.waitForTimeout(300);
      });

      await context.close();
    }
  } finally {
    await browser.close();
    if (server && server.httpServer) {
      server.httpServer.close();
    }
  }

  console.log('\n===================================================================');
  if (allViolations.length > 0) {
    console.error(`❌ AXE AUDIT FAILED: Found ${allViolations.length} screens with serious/critical violations:`);
    for (const item of allViolations) {
      console.error(`\n[${item.screen}]:`);
      for (const v of item.violations) {
        console.error(`  - [${v.impact.toUpperCase()}] ${v.id}: ${v.help} (${v.helpUrl})`);
        for (const node of v.nodes) {
          console.error(`      Target: ${node.target.join(' ')}`);
          console.error(`      Summary: ${node.failureSummary}`);
        }
      }
    }
    process.exit(1);
  } else {
    console.log('✅ AXE AUDIT PASSED: 0 serious/critical violations across all screens and viewports!');
    process.exit(0);
  }
}

runAxeAudit().catch((err) => {
  console.error('Fatal Axe script error:', err);
  process.exit(1);
});
