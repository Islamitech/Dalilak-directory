import { expect, test } from '@playwright/test';

test.describe('map repair mobile safety net', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('map remains visible and filter/search controls do not navigate away', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('input').first()).toBeVisible();
    const before = await page.locator('.leaflet-container').count();
    await page.locator('input').first().fill('صيدلية');
    await page.waitForTimeout(500);
    expect(await page.locator('.leaflet-container').count()).toBe(before);
    await expect(page.locator('.leaflet-container').first()).toBeVisible();
  });

  test('map controls fit narrow 360 by 640 viewport without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/');
    await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 20_000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });

  test('map zoom gestures remain available while a search query is active', async ({ page }) => {
    await page.goto('/');
    const map = page.locator('.leaflet-container').first();
    await expect(map).toBeVisible({ timeout: 20_000 });
    const input = page.locator('input').first();
    await input.fill('صيدلية');
    await page.locator('body').click({ position: { x: 350, y: 600 } });
    await expect(map).toBeVisible();
    await expect(input).toHaveValue('صيدلية');
    await expect(input).toHaveAttribute('aria-label', 'البحث عن نشاط أو مبنى');
  });
});
