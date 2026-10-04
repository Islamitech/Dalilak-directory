const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('../verification/browser-harness.cjs');
const { createServer } = require('vite');

const EVIDENCE_DIR = path.resolve(__dirname, '../reports/evidence');
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Starting local Vite server for responsive evidence capture...');
  const server = await createServer({
    configFile: path.resolve(__dirname, '../vite.config.ts'),
    server: { port: 5199, host: '127.0.0.1' },
  });
  await server.listen();
  const url = 'http://127.0.0.1:5199';
  console.log(`📡 Vite running at ${url}`);

  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: 'mobile-360', width: 360, height: 740, isMobile: true },
    { name: 'tablet-768', width: 768, height: 1024, isMobile: false },
    { name: 'desktop-1280', width: 1280, height: 800, isMobile: false },
  ];

  const results = [];

  for (const vp of viewports) {
    console.log(`\n🔍 Testing Viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
      locale: 'ar-EG',
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Wait for initial loading overlay to fade and root to mount
    await page.waitForTimeout(2000);

    const layout = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
      const clientWidth = doc.clientWidth;
      const hasHorizontalScroll = scrollWidth > clientWidth;
      const dir = doc.getAttribute('dir') || body.getAttribute('dir');
      const lang = doc.getAttribute('lang');
      const title = document.title;
      return { scrollWidth, clientWidth, hasHorizontalScroll, dir, lang, title };
    });

    const screenshotPath = path.join(EVIDENCE_DIR, `${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    console.log(`   - Direction: ${layout.dir} | Lang: ${layout.lang}`);
    console.log(`   - Client Width: ${layout.clientWidth}px | Scroll Width: ${layout.scrollWidth}px`);
    console.log(`   - Horizontal Scroll: ${layout.hasHorizontalScroll ? '❌ YES (Overflow!)' : '✅ NO (Perfect)'}`);
    console.log(`   - Screenshot saved to: ${path.relative('.', screenshotPath)}`);

    results.push({ ...vp, ...layout, screenshotPath });
    await context.close();
  }

  await browser.close();
  await server.close();

  fs.writeFileSync(
    path.join(EVIDENCE_DIR, 'responsive-summary.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('\n🎉 Responsive verification complete!');
}

run().catch((err) => {
  console.error('❌ Evidence capture failed:', err);
  process.exit(1);
});
