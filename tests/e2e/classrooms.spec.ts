import { expect, test } from '@playwright/test';

const teacherId = '00000000-0000-4000-8000-000000000001';
const classId = '00000000-0000-4000-8000-000000000002';
const studentId = '00000000-0000-4000-8000-000000000003';
const deviceId = '00000000-0000-4000-8000-000000000004';
const child = { id: studentId, local_code: 'HS01', avatar: '🐰' };
const issuedCode = `NGHE1-SB-C642891-HS01-B21-${'A'.repeat(32)}`;

test('parent enters a fixed student code once and returns to the same learning record', async ({ page }) => {
  let savedProgress: unknown;
  const savedEvents: unknown[] = [];
  let revision = 0;
  await page.route('https://classroom-test.supabase.co/**', route => route.abort('blockedbyclient'));
  await page.route('https://student-api.example.test/student/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const metadata = { student_id: studentId, local_code: 'HS01', avatar: '🐰', class_name: 'Lớp 1A', lesson: 21, check_code: 'ABC123' };
    if (path.endsWith('/redeem_student_code')) {
      expect(route.request().postDataJSON().p_code).toBe(issuedCode);
      expect(route.request().headers().authorization).toBeUndefined();
      return route.fulfill({ json: { ...metadata, device_token: 'a'.repeat(64), status: 'approved', revision } });
    }
    if (path.endsWith('/read_student_device')) return route.fulfill({ json: { ...metadata, status: 'approved', revision, ...(savedProgress ? { progress: savedProgress } : {}) } });
    if (path.endsWith('/save_student_code_progress')) {
      const body = route.request().postDataJSON();
      savedEvents.push(...body.p_events); savedProgress = body.p_progress; revision++;
      return route.fulfill({ json: revision });
    }
    return route.fulfill({ status: 400, json: { message: `Unexpected test request ${path}` } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Nhập mã học sinh' }).click();
  await page.getByRole('textbox', { name: 'Mã học sinh', exact: true }).fill(issuedCode);
  await page.getByRole('button', { name: 'Mở hồ sơ học sinh' }).click();
  await expect(page.locator('.student-connection')).toContainText('HS01');
  await expect(page.locator('#dauBaiNay')).toContainText('21');
  await expect(page.locator('#dauQuen')).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.locator('.student-connection')).toContainText('Tiến trình tự gửi');
  await page.locator('#batDau').click();
  await page.locator('#thanh [data-di="doc"]').click();
  await page.locator('#docXong').click();
  await expect.poll(() => savedEvents.length, { timeout: 15000 }).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator('.student-connection')).toContainText('Lớp 1A');
  await expect(page.locator('.class-enrollment')).toHaveCount(0);
});

test('teacher generates a class code with lesson and student count and approves a device', async ({ page }) => {
  let created = false;
  let approved = false;
  await page.route('https://classroom-test.supabase.co/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/token')) {
      const payload = Buffer.from(JSON.stringify({ sub: teacherId, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
      return route.fulfill({ json: { access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`, refresh_token: 'test-refresh', expires_in: 3600, token_type: 'bearer',
        user: { id: teacherId, email: 'teacher@example.test', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } } });
    }
    if (path.endsWith('/profiles')) return route.fulfill({ json: { role: 'teacher' } });
    if (path.endsWith('/classrooms')) return route.fulfill({ json: created ? [{ id: classId, name: 'Lớp 1A', current_lesson: 21, class_code: '642891' }] : [] });
    if (path.endsWith('/create_classroom_with_codes')) {
      expect(route.request().postDataJSON()).toEqual({ p_name: 'Lớp 1A', p_student_count: 35, p_lesson: 21 });
      created = true; return route.fulfill({ json: classId });
    }
    if (path.endsWith('/students')) return route.fulfill({ json: [child] });
    if (path.endsWith('/student_progress')) return route.fulfill({ json: [] });
    if (path.endsWith('/student_codes')) return route.fulfill({ json: [{ student_id: studentId, issued_code: issuedCode, start_lesson: 21 }] });
    if (path.endsWith('/student_devices')) return route.fulfill({ json: [{ id: deviceId, student_id: studentId, status: approved ? 'approved' : 'pending', check_code: 'ABC123', created_at: new Date().toISOString() }] });
    if (path.endsWith('/set_student_device_status')) {
      expect(route.request().postDataJSON()).toEqual({ p_device_id: deviceId, p_status: 'approved' });
      approved = true; return route.fulfill({ json: null });
    }
    return route.fulfill({ status: 400, json: { message: `Unexpected test request ${path}` } });
  });
  await page.goto('/');
  await page.getByRole('link', { name: '👩‍🏫 Góc của cô', exact: true }).click();
  await page.getByLabel('Email', { exact: true }).fill('teacher@example.test');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('test-password-123');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.getByLabel('Bắt đầu từ bài').fill('21');
  await page.getByLabel('Số học sinh').fill('35');
  await page.getByRole('button', { name: 'Tạo lớp và cấp mã học sinh', exact: true }).click();
  await expect(page.locator('.class-code')).toContainText('C642891');
  await page.getByText('Xem mã HS01', { exact: true }).click();
  await expect(page.locator('.student-issued-code')).toContainText(issuedCode);
  await page.getByRole('button', { name: 'Xác nhận thiết bị', exact: true }).click();
  await expect(page.locator('.device-list')).toContainText('Đã kết nối');
  await page.screenshot({ path: 'test-results/teacher-class-code.png', fullPage: true });
});
