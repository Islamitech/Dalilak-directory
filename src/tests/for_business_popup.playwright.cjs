const assert = require('node:assert/strict');
const { chromium, setup } = require('../../verification/browser-harness.cjs');

async function runTests() {
  console.log('=== RUNNING FOR BUSINESS POPUP BLOCKED PLAYWRIGHT TEST ===\n');

  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });

  const failures = [];

  try {
    const s = await setup(browser);

    // Navigate to ForBusinessView
    await s.page.goto(s.url + '/for-business');
    await s.page.waitForTimeout(500);

    // Verify form is present
    const bizNameInput = s.page.getByLabel('اسم النشاط');
    await bizNameInput.waitFor({ timeout: 5000 });
    const phoneInput = s.page.getByLabel('رقم الهاتف');
    await phoneInput.waitFor({ timeout: 5000 });

    // Fill valid business details
    await bizNameInput.fill('مطعم البركة الحديث');
    await phoneInput.fill('01012345678');

    const ownerInput = s.page.getByLabel('اسم المسؤول');
    if ((await ownerInput.count()) > 0) {
      await ownerInput.fill('أحمد محمد');
    }

    // Submit form (window.open is stubbed to return null in browser-harness.cjs)
    const submitBtn = s.page.getByRole('button', { name: /متابعة الطلب عبر واتساب/ });
    await submitBtn.click();
    await s.page.waitForTimeout(500);

    // 1. Success message must NOT be shown
    const successMsg = s.page.getByText('تم تجهيز طلب الإدراج بنجاح');
    const isSuccessVisible = await successMsg.isVisible().catch(() => false);
    console.log('Success banner visible:', isSuccessVisible);
    assert.strictEqual(
      isSuccessVisible,
      false,
      'When window.open returns null (popup blocked), the UI must NOT show success'
    );

    // 2. Clear Arabic popup blocked alert must be shown
    const blockedAlert = s.page.locator('[role="alert"]').filter({ hasText: /تعذر فتح واتساب|حظر النوافذ المنبثقة/ });
    await blockedAlert.waitFor({ timeout: 3000 });
    console.log('Popup blocked alert is displayed');

    // 3. Action "افتح واتساب مرة أخرى" must be present
    const retryAction = s.page.getByRole('button', { name: 'افتح واتساب مرة أخرى' });
    await retryAction.waitFor({ timeout: 3000 });
    assert.strictEqual(await retryAction.isVisible(), true, 'Action "افتح واتساب مرة أخرى" must be visible');

    // 4. Action "انسخ الرسالة" must be present
    const copyAction = s.page.getByRole('button', { name: 'انسخ الرسالة' });
    await copyAction.waitFor({ timeout: 3000 });
    assert.strictEqual(await copyAction.isVisible(), true, 'Action "انسخ الرسالة" must be visible');

    // 5. Test clipboard write action
    // Grant clipboard permissions to browser context
    await s.context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await copyAction.click();
    await s.page.waitForTimeout(300);

    const clipboardStatus = s.page.locator('[role="status"]').filter({ hasText: /تم نسخ الرسالة بنجاح/ });
    await clipboardStatus.waitFor({ timeout: 2000 });
    assert.strictEqual(await clipboardStatus.isVisible(), true, 'Feedback indicating message was copied must appear');

    // 6. Draft must be preserved
    const preservedName = await bizNameInput.inputValue();
    const preservedPhone = await phoneInput.inputValue();
    console.log('Preserved form values:', { preservedName, preservedPhone });
    assert.strictEqual(preservedName, 'مطعم البركة الحديث', 'Business name draft must be preserved');
    assert.strictEqual(preservedPhone, '01012345678', 'Phone draft must be preserved');

    console.log('✓ ForBusinessView popup-blocked test passed successfully!\n');
    await s.context.close();
  } catch (err) {
    console.error('✗ ForBusinessView popup-blocked test FAILED:', err.message, '\n');
    failures.push({ test: 'Popup Blocked Test', error: err.message });
  }

  await browser.close();

  if (failures.length > 0) {
    console.log('FAILED TESTS:');
    for (const f of failures) {
      console.log(`- ${f.test}: ${f.error}`);
    }
    process.exit(1);
  } else {
    console.log('ALL PLAYWRIGHT TESTS PASSED!');
    process.exit(0);
  }
}

runTests().catch((e) => {
  console.error('Test crashed:', e);
  process.exit(1);
});
