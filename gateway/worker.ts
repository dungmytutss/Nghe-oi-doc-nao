import { parseStudentCode } from '../src/cloud/codes';

interface Limiter { limit(options: { key: string }): Promise<{ success: boolean }> }
export interface GatewayEnv {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  STUDENT_GATEWAY_SECRET: string;
  ALLOWED_ORIGINS: string;
  ENTRY_IP: Limiter;
  ENTRY_CODE: Limiter;
  DEVICE: Limiter;
  TOTAL: Limiter;
}
const routes = new Set(['redeem_student_code', 'read_student_device', 'save_student_code_progress']);
const validToken = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const digest = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))))
  .map(byte => byte.toString(16).padStart(2, '0')).join('');

function reply(body: unknown, status: number, origin?: string) {
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer', 'Vary': 'Origin', ...(status === 429 ? { 'Retry-After': '60' } : {}),
    ...(origin ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600' } : {}),
  } });
}

async function readBody(request: Request) {
  const max = 524288;
  if (Number(request.headers.get('Content-Length')) > max) throw new Error('body_too_large');
  if (!request.body) throw new Error('invalid_body');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = []; let length = 0;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const read = async () => {
      while (true) {
        const chunk = await reader.read(); if (chunk.done) break;
        length += chunk.value.byteLength;
        if (length > max) throw new Error('body_too_large');
        chunks.push(chunk.value);
      }
    };
    await Promise.race([read(), new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('body_timeout')), 5000); })]);
    const buffer = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.byteLength; }
    const data: unknown = JSON.parse(new TextDecoder().decode(buffer));
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('invalid_body');
    return data as Record<string, unknown>;
  } finally { clearTimeout(timeout); await reader.cancel().catch(() => {}); }
}

export default {
  async fetch(request: Request, env: GatewayEnv): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGINS?.split(',').map(item => item.trim()).filter(Boolean) || [];
    if (!origin || !allowed.includes(origin)) return reply({ code: 'origin_not_allowed', message: 'Origin not allowed.' }, 403);
    const name = url.pathname.replace(/^\/student\//, '');
    if (!url.pathname.startsWith('/student/') || !routes.has(name) || url.search) return reply({ code: 'not_found' }, 404, origin);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: reply(null, 200, origin).headers });
    if (request.method !== 'POST') return reply({ code: 'method_not_allowed' }, 405, origin);
    if (!env.STUDENT_GATEWAY_SECRET || !/^[0-9a-f]{64}$/.test(env.STUDENT_GATEWAY_SECRET)
      || !env.SUPABASE_PUBLISHABLE_KEY || !env.SUPABASE_URL?.startsWith('https://')) return reply({ code: 'gateway_not_configured' }, 503, origin);
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply({ code: 'invalid_content_type' }, 415, origin);
    let stage = 'rate_limit';
    try {
      // CF-Connecting-IP is set by Cloudflare, not accepted from a JSON/client ID.
      const ip = request.headers.get('CF-Connecting-IP');
      if (!ip) return reply({ code: 'gateway_ip_missing' }, 503, origin);
      if (!(await env.TOTAL.limit({ key: 'pilot-total' })).success) return reply({ code: 'rate_limited' }, 429, origin);
      if (name === 'redeem_student_code' && !(await env.ENTRY_IP.limit({ key: await digest(ip) })).success) return reply({ code: 'rate_limited' }, 429, origin);
      stage = 'body';
      const body = await readBody(request);
      const permitted = name === 'redeem_student_code' ? ['p_code', 'p_device_token']
        : name === 'read_student_device' ? ['p_token'] : ['p_token','p_progress','p_expected_revision','p_events','p_lesson'];
      if (Object.keys(body).some(key => !permitted.includes(key))) return reply({ code: 'invalid_body' }, 400, origin);
      if (name === 'redeem_student_code') {
        if (typeof body.p_code !== 'string' || body.p_code.length > 200) return reply({ code: 'invalid_student_code' }, 400, origin);
        const parsed = parseStudentCode(body.p_code);
        if (!parsed || (body.p_device_token != null && !validToken(body.p_device_token))) return reply({ code: 'invalid_student_code' }, 400, origin);
        body.p_code = parsed.code;
        if (!(await env.ENTRY_CODE.limit({ key: await digest(parsed.code) })).success) return reply({ code: 'rate_limited' }, 429, origin);
      } else {
        if (!validToken(body.p_token)) return reply({ code: 'invalid_student_device' }, 400, origin);
        if (!(await env.DEVICE.limit({ key: await digest(body.p_token) })).success) return reply({ code: 'rate_limited' }, 429, origin);
        if (name === 'save_student_code_progress' && (!Number.isSafeInteger(body.p_expected_revision) || Number(body.p_expected_revision) < 0
          || !Number.isInteger(body.p_lesson) || Number(body.p_lesson) < 1 || Number(body.p_lesson) > 50
          || !Array.isArray(body.p_events) || body.p_events.length > 100 || !body.p_progress || typeof body.p_progress !== 'object')) {
          return reply({ code: 'invalid_learning_data' }, 400, origin);
        }
      }
      stage = 'upstream';
      const upstream = new URL(`/rest/v1/rpc/${name}`, env.SUPABASE_URL);
      const result = await fetch(upstream, {
        method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(8000),
        headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json', 'x-nghe-gateway': env.STUDENT_GATEWAY_SECRET },
        body: JSON.stringify(body),
      });
      // Workers does not implement redirect:'error'. Reject without following;
      // the gateway credential must never be forwarded to another origin.
      if (result.status >= 300 && result.status < 400) return reply({ code: 'upstream_unavailable' }, 503, origin);
      if (result.ok) return reply(await result.json(), 200, origin);
      const error = await result.json() as { code?: string; message?: string };
      const known = ['invalid_student_code','invalid_student_device','device_limit_reached','rate_limited','progress_conflict','invalid_learning_data','invalid_lesson'];
      const message = known.find(value => error.message?.includes(value));
      return reply({ code: message || 'upstream_unavailable', message: message || 'Student service unavailable.' }, result.status === 429 ? 429 : message ? result.status : 503, origin);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'body_too_large') return reply({ code: message }, 413, origin);
      if (message === 'invalid_body' || error instanceof SyntaxError) return reply({ code: 'invalid_body' }, 400, origin);
      // Only operational metadata: never log student codes, credentials or bodies.
      const reason = ['Illegal invocation', 'AbortSignal.timeout', 'Invalid URL', 'fetch failed', 'signal', 'not implemented']
        .find(value => message.includes(value)) || 'unclassified';
      console.error('student_gateway_failure', { stage, name: error instanceof Error ? error.name : 'unknown', reason });
      return reply({ code: 'gateway_unavailable' }, 503, origin);
    }
  },
};
