import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [VitePWA({
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
});
