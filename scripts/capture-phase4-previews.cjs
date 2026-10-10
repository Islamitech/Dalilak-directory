const path = require('path');
const fs = require('fs');
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

async function capturePreviews() {
  console.log('📸 Capturing Phase 4 Visual Previews...');
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
  const browser = await chromium.launch({ headless: true });

  try {
    // 0. Extract a real business ID from the loaded search page
    console.log('Fetching a real business from catalog...');
    const helperPage = await browser.newPage();
    await helperPage.goto(`${baseUrl}/search`, { waitUntil: 'networkidle' });
    await helperPage.waitForTimeout(1500);

    const realBizId = await helperPage.evaluate(() => {
      // Look in DOM cards or hrefs
      const card = document.querySelector('[data-biz-id], article, .compact-card, button:has(h4)');
      if (card && card.getAttribute('data-biz-id')) return card.getAttribute('data-biz-id');
      const link = document.querySelector('a[href^="/biz/"]');
      if (link) {
        const parts = link.getAttribute('href').split('/');
        return parts[parts.length - 1];
      }
      return null;
    });
    console.log('Real business detected:', realBizId);
    await helperPage.close();

    const targetBizParam = realBizId || 'biz_atlas_1791579235228_x7qra';

    // 1. Mobile Peek Sheet on Map (390x844)
    console.log('Capturing preview-sheet-mobile.png (Peek mode on Map)...');
    const mobilePeekCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const pagePeek = await mobilePeekCtx.newPage();
    await pagePeek.goto(`${baseUrl}/map?biz=${targetBizParam}`, { waitUntil: 'networkidle' });
    await pagePeek.waitForSelector('.dl-esheet', { timeout: 20000 });
    await pagePeek.waitForTimeout(1500);

    await pagePeek.screenshot({
      path: path.resolve(__dirname, '..', 'preview-sheet-mobile.png'),
    });
    console.log('✅ Saved preview-sheet-mobile.png');
    await mobilePeekCtx.close();

    // 2. Mobile Detail Full Sheet (390x844)
    console.log('Capturing preview-detail-mobile.png (Full Detail with In-Sheet Action Bar)...');
    const mobileDetailCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const pageDetail = await mobileDetailCtx.newPage();
    await pageDetail.goto(`${baseUrl}/search?biz=${targetBizParam}`, { waitUntil: 'networkidle' });
    await pageDetail.waitForSelector('.dl-esheet', { timeout: 8000 }).catch(() => null);
    await pageDetail.waitForTimeout(1200);

    await pageDetail.screenshot({
      path: path.resolve(__dirname, '..', 'preview-detail-mobile.png'),
    });
    console.log('✅ Saved preview-detail-mobile.png');
    await mobileDetailCtx.close();

    // 3. Desktop Floating Side Panel on Map (1280x800)
    console.log('Capturing preview-sheet-desktop.png (Desktop Floating Side Panel)...');
    const desktopCtx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
    });
    const pageDesktop = await desktopCtx.newPage();
    await pageDesktop.goto(`${baseUrl}/map?biz=${targetBizParam}`, { waitUntil: 'networkidle' });
    await pageDesktop.waitForSelector('.dl-esheet', { timeout: 8000 }).catch(() => null);
    await pageDesktop.waitForTimeout(1200);

    await pageDesktop.screenshot({
      path: path.resolve(__dirname, '..', 'preview-sheet-desktop.png'),
    });
    console.log('✅ Saved preview-sheet-desktop.png');
    await desktopCtx.close();

    console.log('🎉 All preview screenshots captured successfully!');
  } finally {
    await browser.close();
    if (server && server.httpServer) {
      server.httpServer.close();
    }
  }
}

capturePreviews().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
