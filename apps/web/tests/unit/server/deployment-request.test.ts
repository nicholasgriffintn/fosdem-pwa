import { describe, expect, it } from "vitest";
import { getDeployment } from "@roomisfull/conference/deployment";
import { getConferences } from "@roomisfull/conference/registry";
import { handleDeploymentRequest } from "~/server/lib/deployment-request";
import { canonicalUrl, shouldNoIndex } from "~/utils/canonical";

const directory = getDeployment(null);
const fosdem = getDeployment("fosdem");

describe("deployment domains", () => {
	it.each([
		[
			directory,
			"http://roomisfull.com/?utm_source=link",
			"https://roomisfull.app/?utm_source=link",
		],
		[directory, "https://www.roomisfull.app/", "https://roomisfull.app/"],
		[
			fosdem,
			"https://fosdem.roomisfull.app/event/talk?year=2025",
			"https://fosdempwa.com/event/talk?year=2025",
		],
		[
			fosdem,
			"http://www.fosdempwa.com/track/rust?year=2026&day=1",
			"https://fosdempwa.com/track/rust?year=2026&day=1",
		],
		[
			fosdem,
			"https://fosdem.roomisfull.app/sw.js",
			"https://fosdempwa.com/sw.js",
		],
		[
			fosdem,
			"https://fosdem.roomisfull.app//untrusted.test/",
			"https://fosdempwa.com//untrusted.test/",
		],
	])("redirects aliases in one permanent hop", (config, source, target) => {
		const response = handleDeploymentRequest(new Request(source), config);
		expect(response?.status).toBe(308);
		expect(response?.headers.get("location")).toBe(target);
		expect(
			handleDeploymentRequest(new Request(target), config),
		).toBeUndefined();
	});

	it("does not route an unknown hostname into another conference", () => {
		const request = new Request("https://unknown.roomisfull.app/", {
			headers: { "X-Forwarded-Host": "fosdempwa.com" },
		});
		expect(handleDeploymentRequest(request, fosdem)?.status).toBe(421);
		expect(
			handleDeploymentRequest(new Request(fosdem.origin), directory)?.status,
		).toBe(421);
		expect(() => getDeployment("example")).toThrow("Unknown conference");
		expect(getConferences().map((conference) => conference.id)).toEqual([
			"fosdem",
		]);
	});

	it("allows localhost only during development", () => {
		const request = new Request("http://localhost:3000/");
		expect(handleDeploymentRequest(request, fosdem)?.status).toBe(421);
		expect(handleDeploymentRequest(request, fosdem, true)).toBeUndefined();
	});

	it.each([directory, fosdem])(
		"serves a sitemap and robots file for the canonical origin",
		async (config) => {
			const sitemap = await handleDeploymentRequest(
				new Request(`${config.origin}/sitemap.xml`),
				config,
			)?.text();
			const robots = await handleDeploymentRequest(
				new Request(`${config.origin}/robots.txt`),
				config,
			)?.text();
			expect(robots).toContain(`Sitemap: ${config.origin}/sitemap.xml`);
			const document = new DOMParser().parseFromString(
				sitemap ?? "",
				"application/xml",
			);
			expect(document.querySelector("parsererror")).toBeNull();
			const urls = [...document.querySelectorAll("loc")].map(
				(node) => node.textContent ?? "",
			);
			expect(urls.length).toBeGreaterThan(0);
			expect(urls.every((url) => url.startsWith(`${config.origin}/`))).toBe(
				true,
			);
			expect(urls.every((url) => !shouldNoIndex(url))).toBe(true);
			expect(urls.every((url) => canonicalUrl(url, config) === url)).toBe(true);
			if (config.conference)
				expect(urls).toContain("https://fosdempwa.com/?year=2025");
			const head = handleDeploymentRequest(
				new Request(`${config.origin}/sitemap.xml`, { method: "HEAD" }),
				config,
			);
			expect(await head?.text()).toBe("");
		},
	);
});

describe("canonical page identity", () => {
	it("keeps archive years while dropping tracking and display options", () => {
		expect(
			canonicalUrl(
				"/event/talk/?year=2025&utm_source=social&test=false#notes",
				fosdem,
			),
		).toBe("https://fosdempwa.com/event/talk?year=2025");
		expect(canonicalUrl("/rooms?year=2026&day=1", fosdem)).toBe(
			"https://fosdempwa.com/rooms?year=2026",
		);
		expect(canonicalUrl("/?year=2025", directory)).toBe(
			"https://roomisfull.app/",
		);
		expect(canonicalUrl("/event/talk?year=invalid", fosdem)).toBe(
			`https://fosdempwa.com/event/talk?year=${fosdem.conference?.defaultYear}`,
		);
	});

	it.each([
		"/bookmarks",
		"/profile/12",
		"/search?q=rust",
		"/signin",
		"/tester",
		"/event/talk?test=true",
		"/api/auth/callback/github?code=secret",
	])("excludes personal, search and test pages from indexing", (url) => {
		expect(shouldNoIndex(url)).toBe(true);
	});
});
