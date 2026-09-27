import type { Deployment } from "@roomisfull/conference/deployment";
import { canonicalUrl, schedulePaths } from "./canonical";
import { escapeXml } from "./xml";

export function createSitemap(config: Deployment): string {
	const urls = config.conference
		? [
				...config.conference.years.flatMap((year) =>
					schedulePaths
						.filter((path) => path !== "/map" || config.conference?.map)
						.map((path) => canonicalUrl(`${path}?year=${year}`, config)),
				),
				`${config.origin}/privacy`,
				`${config.origin}/terms`,
			]
		: [`${config.origin}/`];
	return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${escapeXml(url)}</loc></url>`).join("")}</urlset>`;
}

export function createRobots(config: Deployment): string {
	return `User-agent: *\nAllow: /\nSitemap: ${config.origin}/sitemap.xml\n`;
}
