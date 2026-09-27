import { defineConfig } from "vitest/config";

export default defineConfig({
	define: { __CONFERENCE_ID__: JSON.stringify("fosdem") },
	test: {
		include: ["tests/**/*.test.ts"],
		environment: "node",
		coverage: {
			reporter: ["text", "html"],
		},
	},
});
