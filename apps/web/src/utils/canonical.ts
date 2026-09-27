import type { Deployment } from "@roomisfull/conference/deployment";

export const schedulePaths = ["/", "/rooms", "/speakers", "/live", "/map"];

export function isSchedulePath(pathname: string): boolean {
	return (
		schedulePaths.includes(pathname) ||
		["/event/", "/track/", "/type/", "/rooms/", "/speakers/"].some((prefix) =>
			pathname.startsWith(prefix),
		)
	);
}

export function canonicalUrl(href: string, config: Deployment): string {
	const source = new URL(href, config.origin);
	const url = new URL(config.origin);
	url.pathname = source.pathname.replace(/\/+$/, "") || "/";
	if (config.conference && isSchedulePath(url.pathname)) {
		const year = Number(source.searchParams.get("year"));
		url.searchParams.set(
			"year",
			String(
				config.conference.years.includes(year)
					? year
					: config.conference.defaultYear,
			),
		);
	}
	return url.href;
}

export function shouldNoIndex(href: string): boolean {
	const url = new URL(href, "https://roomisfull.app");
	return (
		url.searchParams.get("test") === "true" ||
		[
			"/api",
			"/_serverFn",
			"/bookmarks",
			"/offline",
			"/profile",
			"/search",
			"/signin",
			"/tester",
		].some(
			(path) => url.pathname === path || url.pathname.startsWith(`${path}/`),
		)
	);
}
