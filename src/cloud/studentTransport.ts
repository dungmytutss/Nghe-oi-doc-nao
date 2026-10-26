export function gatewayClient(baseUrl: string) {
  return {
    async rpc(name: string, payload: unknown) {
      try {
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/student/${name}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
          signal: AbortSignal.timeout(12000), credentials: 'omit', cache: 'no-store',
        });
        const data = await response.json();
        return response.ok ? { data, error: null } : { data: null, error: {
          code: data.code || 'gateway_unavailable', message: data.message || data.code || 'gateway_unavailable',
          retryAfter: response.status === 429 ? Math.max(1, Number(response.headers.get('Retry-After')) || 60) : undefined,
        } };
      } catch { return { data: null, error: { code: 'network_error', message: 'Network connection unavailable.' } }; }
    },
  };
}
