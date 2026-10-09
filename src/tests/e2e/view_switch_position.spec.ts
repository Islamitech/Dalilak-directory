import { expect, test, type Page } from '@playwright/test';

async function switchBox(page: Page) {
  const control = page.locator('[data-view-switch]');
  await expect(control).toBeVisible({ timeout: 20_000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await document.fonts.load("800 13px Cairo");
  });
  const box = await control.boundingBox();
  expect(box).toBeTruthy();
  return box!;
}

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
]) {
  test(`view switch stays within 4px between map and list at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/map');
    const onMap = await switchBox(page);
    await page.goto('/search');
    const onList = await switchBox(page);

    expect(Math.abs(onMap.y - onList.y), `mapY=${onMap.y} listY=${onList.y}`).toBeLessThanOrEqual(4);
    const mapCenter = onMap.x + onMap.width / 2;
    const listCenter = onList.x + onList.width / 2;
    expect(Math.abs(mapCenter - listCenter), `mapX=${onMap.x} listX=${onList.x} mapW=${onMap.width} listW=${onList.width}`).toBeLessThanOrEqual(4);
  });
}
