import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo192.png'],
      manifest: {
        name: 'Summit – Parliamentary Session System',
        short_name: 'Summit',
        description: 'Model Lok Sabha Session Management',
        theme_color: '#FF9933',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'logo192.png', sizes: '192x192', type: 'image/png' },
          { src: 'logo512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/auth': 'http://localhost:3001',
      '/session': 'http://localhost:3001',
      '/hand': 'http://localhost:3001',
      '/queue': 'http://localhost:3001',
      '/speaker': 'http://localhost:3001',
      '/polls': 'http://localhost:3001',
      '/points': 'http://localhost:3001',
      '/moderator': 'http://localhost:3001',
      '/party': 'http://localhost:3001',
    },
  },
});
