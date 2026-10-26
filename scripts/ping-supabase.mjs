const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in repository Actions secrets.');
  process.exit(1);
}
const endpoint = new URL('/rest/v1/app_health?select=id&id=eq.1', url);
if (endpoint.protocol !== 'https:') throw new Error('Supabase URL must use HTTPS.');
let healthy = false;
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    const response = await fetch(endpoint, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`Database health query returned HTTP ${response.status}`);
    const rows = await response.json();
    if (rows.length !== 1 || rows[0].id !== 1) throw new Error('Health row missing; apply the keepalive migration.');
    console.log('Supabase database query succeeded.');
    healthy = true;
    break;
  } catch (error) {
    console.error(`Attempt ${attempt}: ${error.message}`);
  }
}
if (!healthy) process.exit(1);
