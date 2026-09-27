import { brand } from "@roomisfull/conference/brand";
import type { Deployment } from "@roomisfull/conference/deployment";
import type { Plugin } from "vite";

export function conferenceAssets(deployment: Deployment): Plugin {
	const config = deployment.conference;
	const manifest = JSON.stringify(
		{
			id: "/",
			name: config ? `${brand.name} · ${config.name}` : brand.name,
			short_name: brand.name,
			description: config
				? `Your conference companion for ${config.name}`
				: brand.description,
			start_url: "/",
			scope: "/",
			display: "standalone",
			theme_color: brand.themeColor,
			background_color: "#f6faf8",
			icons: [
				{
					src: "/brand/icon.svg",
					sizes: "any",
					type: "image/svg+xml",
					purpose: "any",
				},
				{
					src: "/icons/android-chrome-192x192.png",
					sizes: "192x192",
					type: "image/png",
				},
				{
					src: "/icons/android-chrome-512x512.png",
					sizes: "512x512",
					type: "image/png",
					purpose: "any maskable",
				},
			],
		},
		null,
		2,
	);
	return {
		name: "conference-assets",
		configureServer(server) {
			server.middlewares.use("/manifest.webmanifest", (_req, res) => {
				res.setHeader("Content-Type", "application/manifest+json");
				res.end(manifest);
			});
		},
		generateBundle() {
			if (this.environment.name === "client") {
				this.emitFile({
					type: "asset",
					fileName: "manifest.webmanifest",
					source: manifest,
				});
				this.emitFile({
					type: "asset",
					fileName: "conference-build.json",
					source: JSON.stringify({ id: config?.id ?? null }),
				});
			}
		},
	};
}
