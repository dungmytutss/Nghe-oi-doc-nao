import { expect, test } from '@playwright/test';

test('default page has two entry choices and only the teacher link in its header', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Chọn cách bắt đầu' })).toBeVisible();
  await expect(page.locator('.entry-header nav a')).toHaveCount(1);
  await expect(page.locator('.entry-header nav a')).toHaveText('👩‍🏫 Góc của cô');
  await expect(page.locator('.entry-choice')).toHaveCount(2);
  await page.screenshot({ path: 'test-results/default-entry.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('guest has one resumable progress record and can export/import a portable local code', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Tiếp tục với tư cách khách' }).click();
  await expect(page.locator('#dauMa')).toHaveText('Khách');
  await page.locator('#batDau').click();
  await page.locator('#thanh [data-di="doc"]').click();
  await page.locator('#docXong').click();
  await page.keyboard.press('Escape');
  await page.locator('#thanh [data-di="dau"]').click();
  await page.getByRole('button', { name: '📋 Xuất mã tiến trình', exact: true }).click();
  await expect(page.locator('#guiMa')).toHaveValue(/^NGHE1-LOCAL-KHACH-B\d{2}-[ZJ]/);
  const code = await page.locator('#guiMa').inputValue();
  await page.locator('#guiDong').click();
  await page.getByRole('button', { name: '📂 Nhập mã tiến trình', exact: true }).click();
  await page.locator('#chepNoiDung').fill(code);
  await page.locator('#chepNhap').click();
  await expect(page.locator('#chepNhap')).toHaveText('✅ Đồng ý nhập');
  await page.locator('#chepNhap').click();
  await expect(page.locator('#chepLoi')).toContainText('Đã nhập');
  await page.locator('#chepDong2').click();
  await page.getByRole('button', { name: '‹ Trang chủ' }).click();
  await page.getByRole('button', { name: 'Tiếp tục với tư cách khách' }).click();
  const store = await page.evaluate(() => JSON.parse(localStorage.getItem('nghe-oi-doc-nao.v1')!));
  expect({ profiles: Object.keys(store.hs), readings: store.hs.KHACH.docTheo }).toEqual({ profiles: ['KHACH'], readings: 1 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Chọn cách bắt đầu' })).toBeVisible();
});
