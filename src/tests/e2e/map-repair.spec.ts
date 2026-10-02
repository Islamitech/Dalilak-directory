import { expect, test } from '@playwright/test';

test.describe('map repair mobile safety net', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('map remains visible and filter/search controls do not navigate away', async ({ page }) => {
    await page.goto('/map');
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
    await page.goto('/map');
    await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 20_000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });

  test('map zoom gestures remain available while a search query is active', async ({ page }) => {
    await page.goto('/map');
    const map = page.locator('.leaflet-container').first();
    await expect(map).toBeVisible({ timeout: 20_000 });
    const input = page.locator('input').first();
    await input.fill('صيدلية');
    await expect(input).toHaveValue('صيدلية');
    await page.getByRole('button', { name: 'تكبير الخريطة (+)' }).click();
    await expect(map).toBeVisible();
    await expect(input).toHaveValue('صيدلية');
    await expect(input).toHaveAttribute('aria-label', 'البحث عن نشاط أو مبنى');
  });

  test('quick filters and locate control are reachable on mobile', async ({ page }) => {
    await page.goto('/map');
    await expect(page.getByRole('group', { name: 'فلاتر سريعة لنوع النشاط' })).toBeVisible({ timeout: 20_000 });
    const chip = page.getByRole('group', { name: 'فلاتر سريعة لنوع النشاط' }).getByRole('button').first();
    const box = await chip.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole('button', { name: 'تحديد موقعي الحالي' })).toBeVisible();
    const searchButton = page.getByRole('button', { name: 'تنفيذ البحث' });
    const searchBox = await searchButton.boundingBox();
    expect(searchBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('selected business is removed from background markers when its selected card opens', async ({ page }) => {
    const businessName = 'صيدلية اختبار تكرار العلامة';
    await page.setViewportSize({ width: 1083, height: 720 });
    await page.addInitScript(() => localStorage.clear());
    await page.route('**/rest/v1/businesses?*', route => route.fulfill({
      status: 200,
      headers: { 'content-range': '0-0/1', 'content-type': 'application/json' },
      body: JSON.stringify([{
        id: 'biz_map_duplicate_regression', name_ar: businessName, name_en: 'Duplicate Marker Pharmacy', category: 'صيدليات',
        governorate: 'الجيزة', city: 'حدائق الأهرام', street: 'شارع اختبار', landmark: '', phone: '', secondary_phone: '',
        working_hours: '', description: '', lat: 29.9683, lng: 31.1002, package_id: 'pkg_basic', package_name: '',
        package_price: 0, verification_status: 'verified', notes: {}, created_at: '2026-01-01T00:00:00.000Z', cover_photo: '',
      }]),
    }));
    await page.goto('/map');
    await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 20_000 });
    const quickFilters = page.getByRole('group', { name: 'فلاتر سريعة لنوع النشاط' });
    await quickFilters.getByRole('button', { name: /صيدليات/ }).click();
    const backgroundPin = page.locator(`.leaflet-marker-icon[title="${businessName}"]`);
    await expect(backgroundPin).toHaveCount(1);
    await backgroundPin.click();
    await expect(page.locator('.leaflet-marker-icon.selected-compact-card')).toHaveCount(1);
    await expect(backgroundPin).toHaveCount(0);
  });
});
