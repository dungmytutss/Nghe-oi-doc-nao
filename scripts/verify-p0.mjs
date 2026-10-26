import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

// Read-only live probes: fake credentials cannot enroll or alter a student.
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/)
  .filter(line => line.includes('=') && !line.startsWith('#'))
  .map(line => { const i = line.indexOf('='); return [line.slice(0, i).trim(), line.slice(i + 1).trim()]; }));
const origin = 'http://127.0.0.1:5173';
const gateway = env.VITE_STUDENT_GATEWAY_URL;
assert.ok(gateway, 'Configure VITE_STUDENT_GATEWAY_URL first.');
const base = `${env.VITE_SUPABASE_URL}/rest/v1/rpc`;
const fakeToken = '0'.repeat(64);
async function post(url, body, headers) {
  const response = await fetch(url, { method: 'POST', redirect: 'error',
    signal: AbortSignal.timeout(12000), headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}
const headers = { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY };
for (const extra of [{}, { 'x-nghe-gateway': fakeToken }]) {
  const result = await post(`${base}/read_student_device`, { p_token: fakeToken }, { ...headers, ...extra });
  assert.ok([401, 403].includes(result.status) && result.body.message === 'gateway_required', 'Direct student access must require the gateway.');
}
const helper = await post(`${base}/student_device_id`, { p_token: fakeToken }, headers);
assert.ok([401, 403].includes(helper.status) && helper.body.code === '42501', 'Internal helper must be denied.');
const permitted = await post(`${gateway}/student/read_student_device`, { p_token: fakeToken }, { Origin: origin });
assert.equal(permitted.status, 403);
assert.equal(permitted.body.code, 'invalid_student_device');
const denied = await post(`${gateway}/student/read_student_device`, { p_token: fakeToken }, { Origin: 'https://untrusted.example' });
assert.equal(denied.status, 403);
assert.equal(denied.body.code, 'origin_not_allowed');
const preflight = await fetch(`${gateway}/student/read_student_device`, { method: 'OPTIONS',
  signal: AbortSignal.timeout(12000), headers: { Origin: origin, 'Access-Control-Request-Method': 'POST' } });
assert.equal(preflight.status, 204);
assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), origin);
console.log('P0 live checks passed: direct bypass denied, internal helper denied, gateway reaches Supabase, CORS enforced. No student records changed.');
