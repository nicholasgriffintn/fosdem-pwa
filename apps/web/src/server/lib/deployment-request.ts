import type { Deployment } from "@roomisfull/conference/deployment";
import { createRobots, createSitemap } from "../../utils/sitemap";

export function handleDeploymentRequest(
	request: Request,
	config: Deployment,
	development = false,
): Response | undefined {
	const url = new URL(request.url);
	const canonical = new URL(config.origin);
	const hosts = [
		canonical.hostname,
		...config.aliases.map((alias) => new URL(alias).hostname),
	];
	const local =
		development && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
	if (!local && !hosts.includes(url.hostname)) {
		return new Response("Unknown deployment host", {
			status: 421,
			headers: { "X-Robots-Tag": "noindex" },
		});
	}
	if (!local && url.origin !== config.origin) {
		canonical.pathname = url.pathname;
		canonical.search = url.search;
		return Response.redirect(canonical.href, 308);
	}
	if (request.method !== "GET" && request.method !== "HEAD") return;
	const documents = {
		"/robots.txt": { type: "text/plain", body: () => createRobots(config) },
		"/sitemap.xml": {
			type: "application/xml",
			body: () => createSitemap(config),
		},
	};
	const document =
		url.pathname === "/robots.txt" || url.pathname === "/sitemap.xml"
			? documents[url.pathname]
			: undefined;
	if (document) {
		return new Response(request.method === "HEAD" ? null : document.body(), {
			headers: {
				"Content-Type": `${document.type}; charset=utf-8`,
				"Cache-Control": "public, max-age=3600",
			},
		});
	}
}
