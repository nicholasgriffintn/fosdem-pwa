// app.config.ts
import { defineConfig } from "@tanstack/start/config";
import tsConfigPaths from "vite-tsconfig-paths";
import { cloudflare } from "unenv";
var app_config_default = defineConfig({
  vite: {
    plugins: [
      tsConfigPaths({
        projects: ["./tsconfig.json"]
      })
    ]
  },
  server: {
    preset: "cloudflare-pages",
    unenv: cloudflare
  }
});
export {
  app_config_default as default
};
