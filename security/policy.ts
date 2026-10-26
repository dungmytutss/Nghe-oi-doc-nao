export function contentSecurityPolicy(env: Record<string, string>, development = false) {
  const services = ['VITE_SUPABASE_URL', 'VITE_STUDENT_GATEWAY_URL'].flatMap(key => {
    if (!env[key]) return [];
    const url = new URL(env[key]);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`Invalid secure service URL: ${key}`);
    return [url.origin];
  });
  return ["default-src 'self'", "script-src 'self'", "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:", "media-src 'self' data: blob:",
    `connect-src 'self' ${[...new Set(services)].join(' ')}${development ? ' ws://127.0.0.1:* ws://localhost:*' : ''}`,
    "worker-src 'self'", "manifest-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'self'", "frame-src 'none'",
  ].join('; ');
}
