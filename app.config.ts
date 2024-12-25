import { defineConfig } from "@tanstack/start/config";
import tsConfigPaths from "vite-tsconfig-paths";
import { cloudflare } from 'unenv'
import { VitePWA } from 'vite-plugin-pwa'


export default defineConfig({
  vite: {
    plugins: [
      tsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'icons/*'],
        manifest: {
          name: 'FOSDEM PWA',
          short_name: 'FOSDEM',
          description: 'A companion app for FOSDEM conference',
          theme_color: '#000000',
          background_color: '#d3d7dd',
          start_url: '/',
          display: 'standalone',
          orientation: 'portrait',
          shortcuts: [
            {
              name: 'Homepage',
              url: '/',
              icons: [
                {
                  src: '/icons/android-chrome-96x96.png',
                  sizes: '96x96',
                  type: 'image/png',
                  purpose: 'any monochrome',
                },
              ],
            },
          ],
          icons: [
            {
              src: '/icons/android-chrome-36x36.png',
              sizes: '36x36',
              type: 'image/png',
            },
            {
              src: '/icons/android-chrome-48x48.png',
              sizes: '48x48',
              type: 'image/png',
            },
            {
              src: '/icons/android-chrome-72x72.png',
              sizes: '72x72',
              type: 'image/png',
            },
            {
              src: '/icons/android-chrome-96x96.png',
              sizes: '96x96',
              type: 'image/png',
            },
            {
              src: '/icons/android-chrome-144x144.png',
              sizes: '144x144',
              type: 'image/png',
            },
            {
              src: '/icons/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icons/android-chrome-256x256.png',
              sizes: '256x256',
              type: 'image/png',
            },
            {
              src: '/icons/android-chrome-384x384.png',
              sizes: '384x384',
              type: 'image/png',
            },
            {
              src: '/icons/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
          screenshots: [
            {
              src: 'screenshots/1.jpg',
              sizes: '1080x1920',
              type: 'image/webp',
              form_factor: 'narrow',
            },
            {
              src: 'screenshots/2.png',
              sizes: '3314x1920',
              type: 'image/webp',
              form_factor: 'wide',
            },
          ],
        }
      })
    ],
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
            return
          }
          warn(warning)
        }
      }
    }
  },
  server: {
    preset: 'cloudflare-pages',
    unenv: cloudflare,
  },
})