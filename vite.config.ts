import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'SIRWISE Global Digital Hub',
          short_name: 'SIRWISE',
          description: 'Global Digital Knowledge Hub powered by AI Professor.',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.js\/?.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24, // 1 day
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    define: {
      'process.env.PI_TESTNET_ENABLED': JSON.stringify(process.env.PI_TESTNET_ENABLED ?? 'true'),
      'process.env.NEXT_PUBLIC_PI_TESTNET_ENABLED': JSON.stringify(process.env.NEXT_PUBLIC_PI_TESTNET_ENABLED ?? process.env.PI_TESTNET_ENABLED ?? 'true'),
      'process.env.PAYSTACK_PUBLIC_KEY': JSON.stringify(process.env.PAYSTACK_PUBLIC_KEY ?? process.env.VITE_PAYSTACK_PUBLIC_KEY ?? ''),
      'process.env.FLUTTERWAVE_PUBLIC_KEY': JSON.stringify(process.env.FLUTTERWAVE_PUBLIC_KEY ?? process.env.VITE_FLW_PUBLIC_KEY ?? process.env.VITE_FLUTTERWAVE_PUBLIC_KEY ?? ''),
      'process.env.PI_API_KEY': JSON.stringify(process.env.PI_API_KEY ?? ''),
      'process.env.PI_MAINNET_KYC_WALLET': JSON.stringify(process.env.PI_MAINNET_KYC_WALLET ?? ''),
      'process.env.VALIDATION_KEY': JSON.stringify(process.env.VALIDATION_KEY ?? 'f1d2fd990366c6095405cabec435395ab465da166fa9a20d93eb95175cafee6ef988eddcf245344be1f69b19b70712896cd5ce371bf0a8da46ff77f0b5000bc1')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
