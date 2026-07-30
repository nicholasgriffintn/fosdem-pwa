import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'

export default defineConfig(({ mode }) => ({
  build: {
    sourcemap: mode === 'production',
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    devtools(),
    cloudflare({
      viteEnvironment: { name: 'ssr' },
      persistState: { path: "../cloudflare/state" },
      inspectorPort: process.env.NODE_ENV === "test" ? false : undefined,
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
}))
