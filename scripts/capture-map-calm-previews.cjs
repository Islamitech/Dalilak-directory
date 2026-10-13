const { chromium } = require('@playwright/test');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:/Users/Ahmed/.gemini/antigravity/brain/ac52a27d-1af8-4992-ace3-97b6210eea99');
const BASE_URL = 'http://127.0.0.1:5173';

async function run() {
  console.log('Capturing calm map previews with reduced pins...');
  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Mobile Map (Overview)
    console.log('1. Capturing map-calm-mobile.png (390x844)...');
    const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await mobileCtx.newPage();
    await mobilePage.goto(`${BASE_URL}/map`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(3000);
    const mobilePath = path.join(ARTIFACT_DIR, 'map-calm-mobile.png');
    await mobilePage.screenshot({ path: mobilePath, fullPage: false });
    console.log('Saved:', mobilePath);
    await mobileCtx.close();

    // 2. Desktop Map (Overview)
    console.log('2. Capturing map-calm-desktop.png (1280x800)...');
    const desktopCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const desktopPage = await desktopCtx.newPage();
    await desktopPage.goto(`${BASE_URL}/map`, { waitUntil: 'domcontentloaded' });
    await desktopPage.waitForTimeout(3000);
    const desktopPath = path.join(ARTIFACT_DIR, 'map-calm-desktop.png');
    await desktopPage.screenshot({ path: desktopPath, fullPage: false });
    console.log('Saved:', desktopPath);
    await desktopCtx.close();

    // 3. Mobile Map (Zone A selected)
    console.log('3. Capturing map-calm-zone-a.png (390x844)...');
    const zoneCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const zonePage = await zoneCtx.newPage();
    await zonePage.goto(`${BASE_URL}/map?zone=%D8%A3`, { waitUntil: 'domcontentloaded' });
    await zonePage.waitForTimeout(3000);
    const zonePath = path.join(ARTIFACT_DIR, 'map-calm-zone-a.png');
    await zonePage.screenshot({ path: zonePath, fullPage: false });
    console.log('Saved:', zonePath);
    await zoneCtx.close();

    console.log('All previews captured successfully!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Error capturing previews:', err);
  process.exit(1);
});
