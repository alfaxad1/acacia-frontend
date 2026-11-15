import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Chama Konnect',
        short_name: 'Chama',
        description:
          'Manage your chama contributions, loans, payments and members in one place.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f8f8f6',
        theme_color: '#0f7053',
        icons: [
          {
            src: 'app-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'app-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          }
        ],
        screenshots: [
          {
            src: 'screenshot-desktop.png',
            sizes: '1365x565',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: 'screenshot-mobile.png',
            sizes: '814x1600',
            type: 'image/jpeg'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
