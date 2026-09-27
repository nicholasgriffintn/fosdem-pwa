import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { conferenceAssets } from "./build/assets.ts";
import { getBuildDeployment } from "./build/deployment.ts";

const deployment = getBuildDeployment();

export default defineConfig(({ mode }) => ({
	define: {
		__CONFERENCE_ID__: JSON.stringify(deployment.conference?.id ?? null),
	},
	build: {
		sourcemap: mode === "production",
	},
	resolve: {
		tsconfigPaths: true,
	},
	plugins: [
		devtools(),
		conferenceAssets(deployment),
		cloudflare({
			viteEnvironment: { name: "ssr" },
			persistState: { path: "../cloudflare/state" },
			inspectorPort: process.env.NODE_ENV === "test" ? false : undefined,
		}),
		tailwindcss(),
		tanstackStart(
			deployment.conference
				? {}
				: {
						router: {
							entry: "directory/router.tsx",
							routesDirectory: "directory/routes",
							generatedRouteTree: "directory/routeTree.gen.ts",
						},
					},
		),
		viteReact(),
	],
}));
