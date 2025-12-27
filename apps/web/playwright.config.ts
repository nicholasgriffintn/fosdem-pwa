import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PLAYWRIGHT_PORT ?? "3000";
const baseURL =
	process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;
const isLocalhost = baseURL.includes("localhost");

export default defineConfig({
	testDir: "./tests/playwright/specs",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: [["list"], ["html", { outputFolder: "tests/playwright/results" }]],
	use: {
		baseURL,
		trace: "retain-on-failure",
		video: "retain-on-failure",
		serviceWorkers: "allow",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: isLocalhost
		? {
			command: `pnpm dev`,
			url: baseURL,
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
		}
		: undefined,
});
