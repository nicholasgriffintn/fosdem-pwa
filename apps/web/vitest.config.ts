import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
		alias: {
			"cloudflare:workers": fileURLToPath(
				new URL("./tests/mocks/cloudflareWorkers.ts", import.meta.url),
			),
		},
	},
	test: {
		include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
		environment: "jsdom",
		setupFiles: ["./tests/setup.ts"],
		globals: true,
		coverage: {
			reporter: ["text", "html"],
		},
	},
});
