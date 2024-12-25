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
        injectRegister: null,
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'icons/*', 'images/*'],
        manifest: false,
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