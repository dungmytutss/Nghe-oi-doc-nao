import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { contentSecurityPolicy } from './security/policy';

export default defineConfig(({ mode, command, isPreview }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env } as Record<string, string>;
  const policy = contentSecurityPolicy(env, command === 'serve' && !isPreview);
  const headers = {
    'Content-Security-Policy': `${policy}; frame-ancestors 'none'`,
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
  return {
  base: process.env.VITE_BASE_PATH || '/',
  server: { headers }, preview: { headers },
  plugins: [{ name: 'app-security-policy', transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' },
    { tag: 'meta', attrs: { name: 'referrer', content: 'no-referrer' }, injectTo: 'head-prepend' },
  ] }, VitePWA({
    registerType: 'prompt',
    injectRegister: null,
    manifest: false,
    includeAssets: ['manifest.webmanifest', 'icon-192.png', 'icon-512.png'],
    workbox: {
      globPatterns: ['**/*.{js,css,html,json,png,webmanifest,mp3}'],
      navigateFallback: 'index.html',
      cleanupOutdatedCaches: true,
      // Supabase requests must never enter a shared service-worker cache.
      runtimeCaching: [],
    },
  })],
};
});
