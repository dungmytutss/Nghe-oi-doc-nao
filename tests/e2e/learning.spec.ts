import { expect, test } from '@playwright/test';

test('preserves student entry, lesson stages and adult settings without cloud credentials', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#man-dau')).toBeVisible();
  await page.locator('[data-ma="HS01"]').click();
  await page.locator('#dauXong').click();
  await page.locator('#batDau').click();
  await expect(page.locator('#man-nghe')).toBeVisible();
  await page.locator('#thanh [data-di="tau"]').click();
  await expect(page.locator('#man-choi')).toBeVisible();
  await page.locator('#thanh [data-di="doc"]').click();
  await expect(page.locator('#man-doc')).toBeVisible();
  await page.locator('#thanh [data-di="dau"]').click();
  await page.locator('#moNguoiLon').click();
  await expect(page.locator('#cloud-title')).toBeVisible();
  expect(errors).toEqual([]);
});

test('loads existing browser progress instead of resetting it', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nghe-oi-doc-nao.v1', JSON.stringify({
    caiDat: { hsCuoi: 'HS05', baiToi: 21 },
    hs: { HS05: { conVat: '🐸', muc: {}, am: { a: 5 }, loi: {}, loiCT: [], phut: {}, daDoc: {}, docTheo: 7 } },
  })));
  await page.goto('/');
  await expect(page.locator('#dauMa')).toHaveText('HS05');
  await expect(page.locator('#dauBaiNay')).toContainText('21');
  await page.locator('#dauVuon').click();
  await expect(page.locator('#man-vuon')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nghe-oi-doc-nao.v1')!).hs.HS05.docTheo)).toBe(7);
});
