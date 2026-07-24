import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'robots.txt',
        'apple-touch-icon.png',
        'launchericon-48x48.png',
        'launchericon-72x72.png',
        'launchericon-96x96.png',
        'launchericon-144x144.png',
        'launchericon-192x192.png',
        'launchericon-512x512.png',
      ],
      manifest: {
        name: 'D-Mart Cashier',
        short_name: 'D-Mart',
        description: 'Cashier management system for D-Mart stores',
        theme_color: '#E31837',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'launchericon-48x48.png', sizes: '48x48', type: 'image/png' },
          { src: 'launchericon-72x72.png', sizes: '72x72', type: 'image/png' },
          { src: 'launchericon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: 'launchericon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: 'launchericon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'launchericon-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
        start_url: '/',
        scope: '/',
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === 'script' || request.destination === 'style',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.origin === import.meta.env.VITE_API_BASE_URL ||
              url.origin === 'http://localhost:5000',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
            },
          },
        ],
      },
    }),
  ],
});