const path = require('path');
const assert = require('node:assert/strict');
const { chromium, setup } = require('../../verification/browser-harness.cjs');

async function runTests() {
  console.log('=== RUNNING DIALOG ACCESSIBILITY TESTS (TASK 2) ===\n');

  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });

  const failures = [];

  // Helper to open ActivityDetailModal on /search
  async function openDetailModal(s) {
    await s.page.goto(s.url + '/search');
    await s.page.waitForTimeout(600);
    const card = s.page.getByText('صيدلية ألفا', { exact: true }).first();
    await card.waitFor({ timeout: 5000 });
    await card.click();
    await s.page.waitForTimeout(400);
    const detailModal = s.page.locator('[role="dialog"][aria-labelledby="activity-detail-modal-title"]');
    await detailModal.waitFor({ timeout: 5000 });
    return { card, detailModal };
  }

  // -------------------------------------------------------------
  // Test 1: Photo Opener in ActivityDetailModal must be a real <button> with accessible label
  // -------------------------------------------------------------
  console.log('--- Test 1: Photo Opener in ActivityDetailModal is a real button with accessible label ---');
  try {
    const s = await setup(browser);
    await openDetailModal(s);

    const openerInfo = await s.page.evaluate(() => {
      // Find the main photo trigger (.protected-asset-shield)
      const target = document.querySelector('[role="dialog"] .protected-asset-shield');
      if (!target) return null;
      return {
        tag: target.tagName,
        ariaLabel: target.getAttribute('aria-label'),
        title: target.getAttribute('title'),
        isButton: target.tagName === 'BUTTON',
        tabIndex: target.tabIndex,
      };
    });

    console.log('Photo opener inspect:', openerInfo);
    assert.ok(openerInfo, 'Photo opener must exist');
    assert.strictEqual(openerInfo.isButton, true, `Photo opener must be a <button>, but got <${openerInfo.tag}>`);
    assert.ok(
      (openerInfo.ariaLabel && openerInfo.ariaLabel.trim().length > 0) ||
      (openerInfo.title && openerInfo.title.trim().length > 0),
      'Photo opener button must have an accessible label'
    );
    console.log('✓ Test 1 Passed\n');
    await s.context.close();
  } catch (err) {
    console.error('✗ Test 1 FAILED:', err.message, '\n');
    failures.push({ test: 'Test 1: Photo Opener', error: err.message });
  }

  // -------------------------------------------------------------
  // Test 2: Nested Escape order & Focus Return (Lightbox over DetailModal)
  // -------------------------------------------------------------
  console.log('--- Test 2: Nested Escape order and focus return (Lightbox over DetailModal) ---');
  try {
    const s = await setup(browser);
    const { card } = await openDetailModal(s);

    // Click photo opener
    const photoTrigger = s.page.locator('[role="dialog"] .protected-asset-shield');
    await photoTrigger.click();
    await s.page.waitForTimeout(300);

    // Verify lightbox is open
    const lightbox = s.page.getByRole('dialog', { name: 'معرض صور النشاط' });
    await lightbox.waitFor({ timeout: 4000 });
    const dialogCountBefore = await s.page.getByRole('dialog').count();
    console.log(`Dialog count with Lightbox open: ${dialogCountBefore}`);
    assert.ok(dialogCountBefore >= 2, 'Both DetailModal and Lightbox should be open simultaneously');

    // Press Escape (First Escape: should close ONLY the top-most lightbox)
    console.log('Pressing Escape (1st time)...');
    await s.page.keyboard.press('Escape');
    await s.page.waitForTimeout(300);

    const dialogCountAfterFirstEscape = await s.page.getByRole('dialog').count();
    console.log(`Dialog count after 1st Escape: ${dialogCountAfterFirstEscape}`);
    assert.strictEqual(
      dialogCountAfterFirstEscape,
      1,
      `First Escape must close only top-most dialog (Lightbox); DetailModal must stay open. Got ${dialogCountAfterFirstEscape} dialogs.`
    );

    // Check focus returned to photo button
    const focusAfterLightbox = await s.page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el?.tagName,
        ariaLabel: el?.getAttribute('aria-label'),
        isInsideShield: !!el?.closest('.protected-asset-shield'),
      };
    });
    console.log('Focus after Lightbox close:', focusAfterLightbox);
    assert.strictEqual(
      focusAfterLightbox.isInsideShield || focusAfterLightbox.tag === 'BUTTON',
      true,
      'Focus must return to the photo button in ActivityDetailModal after Lightbox closes'
    );

    // Press Escape (Second Escape: should close DetailModal)
    console.log('Pressing Escape (2nd time)...');
    await s.page.keyboard.press('Escape');
    await s.page.waitForTimeout(300);

    const dialogCountAfterSecondEscape = await s.page.getByRole('dialog').count();
    console.log(`Dialog count after 2nd Escape: ${dialogCountAfterSecondEscape}`);
    assert.strictEqual(
      dialogCountAfterSecondEscape,
      0,
      `Second Escape must close DetailModal. Got ${dialogCountAfterSecondEscape} dialogs.`
    );

    console.log('✓ Test 2 Passed\n');
    await s.context.close();
  } catch (err) {
    console.error('✗ Test 2 FAILED:', err.message, '\n');
    failures.push({ test: 'Test 2: Nested Escape Order & Focus Return', error: err.message });
  }

  // -------------------------------------------------------------
  // Test 3: PhotoLightbox Tab Trap and Initial Focus
  // -------------------------------------------------------------
  console.log('--- Test 3: PhotoLightbox Tab wrap and initial focus ---');
  try {
    const s = await setup(browser);
    await openDetailModal(s);

    const photoTrigger = s.page.locator('[role="dialog"] .protected-asset-shield');
    await photoTrigger.click();
    await s.page.waitForTimeout(300);

    const lightbox = s.page.getByRole('dialog', { name: 'معرض صور النشاط' });
    await lightbox.waitFor({ timeout: 4000 });

    // Initial focus must be inside Lightbox
    const initialFocusInside = await lightbox.evaluate((d) => d.contains(document.activeElement));
    console.log('Lightbox initialFocusInside:', initialFocusInside);
    assert.strictEqual(initialFocusInside, true, 'Initial focus must be placed inside PhotoLightbox');

    // Tab trap: Tab through all focusable elements + wrap test
    let tabEscaped = false;
    for (let i = 0; i < 10; i++) {
      await s.page.keyboard.press('Tab');
      const inside = await lightbox.evaluate((d) => d.contains(document.activeElement));
      if (!inside) {
        tabEscaped = true;
        break;
      }
    }
    console.log('Lightbox tabEscaped during forward tabs:', tabEscaped);
    assert.strictEqual(tabEscaped, false, 'Tab must wrap within PhotoLightbox and never escape');

    // Shift+Tab wrap test
    let shiftTabEscaped = false;
    for (let i = 0; i < 10; i++) {
      await s.page.keyboard.press('Shift+Tab');
      const inside = await lightbox.evaluate((d) => d.contains(document.activeElement));
      if (!inside) {
        shiftTabEscaped = true;
        break;
      }
    }
    console.log('Lightbox shiftTabEscaped during backward tabs:', shiftTabEscaped);
    assert.strictEqual(shiftTabEscaped, false, 'Shift+Tab must wrap within PhotoLightbox and never escape');

    console.log('✓ Test 3 Passed\n');
    await s.context.close();
  } catch (err) {
    console.error('✗ Test 3 FAILED:', err.message, '\n');
    failures.push({ test: 'Test 3: PhotoLightbox Tab Wrap', error: err.message });
  }

  // -------------------------------------------------------------
  // Test 4: VideoPlayerModal Tab Trap, Initial Focus, and Focus Return
  // -------------------------------------------------------------
  console.log('--- Test 4: VideoPlayerModal Tab wrap, initial focus, and focus return ---');
  try {
    const s = await setup(browser);
    const { detailModal } = await openDetailModal(s);

    // Find and click the video button inside DetailModal
    const videoBtn = detailModal.locator('button', { hasText: 'فيديو' }).first();
    await videoBtn.waitFor({ timeout: 4000 });
    await videoBtn.click();
    await s.page.waitForTimeout(300);

    const videoModal = s.page.locator('[role="dialog"][aria-labelledby="video-modal-title"]');
    await videoModal.waitFor({ timeout: 4000 });

    // Initial focus must be inside VideoModal
    const initialFocusInside = await videoModal.evaluate((d) => d.contains(document.activeElement));
    console.log('VideoModal initialFocusInside:', initialFocusInside);
    assert.strictEqual(initialFocusInside, true, 'Initial focus must be placed inside VideoPlayerModal');

    // Tab trap: Tab through all focusable elements + wrap test
    let tabEscaped = false;
    for (let i = 0; i < 12; i++) {
      await s.page.keyboard.press('Tab');
      const inside = await videoModal.evaluate((d) => d.contains(document.activeElement));
      if (!inside) {
        tabEscaped = true;
        break;
      }
    }
    console.log('VideoModal tabEscaped during forward tabs:', tabEscaped);
    assert.strictEqual(tabEscaped, false, 'Tab must wrap within VideoPlayerModal and never escape');

    // Shift+Tab wrap test
    let shiftTabEscaped = false;
    for (let i = 0; i < 12; i++) {
      await s.page.keyboard.press('Shift+Tab');
      const inside = await videoModal.evaluate((d) => d.contains(document.activeElement));
      if (!inside) {
        shiftTabEscaped = true;
        break;
      }
    }
    console.log('VideoModal shiftTabEscaped during backward tabs:', shiftTabEscaped);
    assert.strictEqual(shiftTabEscaped, false, 'Shift+Tab must wrap within VideoPlayerModal and never escape');

    // Close VideoModal via Escape and check focus return
    await s.page.keyboard.press('Escape');
    await s.page.waitForTimeout(300);

    const videoModalClosed = (await videoModal.count()) === 0;
    assert.strictEqual(videoModalClosed, true, 'VideoPlayerModal must close on Escape');

    const focusAfterVideoClose = await s.page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el?.tagName,
        text: el?.textContent?.trim(),
      };
    });
    console.log('Focus after VideoModal close:', focusAfterVideoClose);
    assert.ok(
      focusAfterVideoClose.text?.includes('فيديو') || focusAfterVideoClose.tag === 'BUTTON',
      'Focus must return to the video trigger button after VideoPlayerModal closes'
    );

    console.log('✓ Test 4 Passed\n');
    await s.context.close();
  } catch (err) {
    console.error('✗ Test 4 FAILED:', err.message, '\n');
    failures.push({ test: 'Test 4: VideoPlayerModal Accessibility', error: err.message });
  }

  // -------------------------------------------------------------
  // Test 5: Re-render does not steal focus (Suspicion 4)
  // -------------------------------------------------------------
  console.log('--- Test 5: Re-render with new inline onClose does not steal focus ---');
  try {
    const s = await setup(browser);
    await s.page.goto(s.url + '/search');
    await s.page.waitForTimeout(600);

    // Open FilterDrawer
    const openDrawerBtn = s.page.getByRole('button', { name: /فلترة متقدمة/ });
    await openDrawerBtn.waitFor({ timeout: 5000 });
    await openDrawerBtn.click();
    await s.page.waitForTimeout(400);

    const drawer = s.page.locator('[role="dialog"][aria-labelledby="filter-drawer-title"]');
    await drawer.waitFor({ timeout: 5000 });

    // Focus the governorate select element (not the first element, which is the close button)
    const govSelect = drawer.locator('select').first();
    await govSelect.focus();
    await s.page.waitForTimeout(100);

    const activeBefore = await s.page.evaluate(() => document.activeElement?.tagName);
    console.log('Active element before re-render:', activeBefore);
    assert.strictEqual(activeBefore, 'SELECT', 'Select must be the active element before re-render');

    // Trigger state change in parent (select 'الجيزة')
    // This calls onGovChange, updating SearchView state and passing a new inline onClose arrow function
    await govSelect.selectOption('الجيزة');
    // Wait past the 50ms setTimeout in useAccessibleDialog
    await s.page.waitForTimeout(200);

    const activeAfter = await s.page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      ariaLabel: document.activeElement?.getAttribute('aria-label'),
      text: document.activeElement?.textContent?.trim().slice(0, 30),
      id: document.activeElement?.id,
    }));
    console.log('Active element after re-render:', activeAfter);

    assert.strictEqual(
      activeAfter.tag,
      'SELECT',
      `Focus was stolen by re-render! Expected SELECT to stay focused, but got <${activeAfter.tag}> (aria-label: ${activeAfter.ariaLabel})`
    );

    console.log('✓ Test 5 Passed\n');
    await s.context.close();
  } catch (err) {
    console.error('✗ Test 5 FAILED:', err.message, '\n');
    failures.push({ test: 'Test 5: Re-render Focus Steal', error: err.message });
  }

  await browser.close();

  console.log('===================================================');
  console.log(`TOTAL TESTS RUN: 5, FAILURES: ${failures.length}`);
  if (failures.length > 0) {
    console.log('FAILED TESTS:');
    for (const f of failures) {
      console.log(`- ${f.test}: ${f.error}`);
    }
    process.exit(1);
  } else {
    console.log('ALL TESTS PASSED!');
    process.exit(0);
  }
}

runTests().catch((e) => {
  console.error('Test script crashed:', e);
  process.exit(1);
});
