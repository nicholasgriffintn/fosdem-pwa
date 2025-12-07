import { defineConfig } from "@tanstack/start/config";
import tsConfigPaths from "vite-tsconfig-paths";
import { cloudflare } from 'unenv'

export default defineConfig({
  vite: {
    plugins: [
      tsConfigPaths(),
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