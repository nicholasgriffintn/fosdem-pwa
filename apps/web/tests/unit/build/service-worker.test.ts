import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateServiceWorker } from "../../../build/service-worker";

let outputDir: string;
const functionId = "a".repeat(64);

beforeEach(async () => {
	outputDir = await mkdtemp(join(tmpdir(), "roomisfull-worker-"));
	await Promise.all([
		mkdir(join(outputDir, "client/assets"), { recursive: true }),
		mkdir(join(outputDir, "server/assets"), { recursive: true }),
	]);
	await Promise.all([
		writeFile(
			join(outputDir, "client/conference-build.json"),
			JSON.stringify({ id: "fosdem" }),
		),
		writeFile(
			join(outputDir, "client/assets/app.js"),
			"export const version = 1;",
		),
		writeFile(join(outputDir, "client/assets/app.js.map"), "source map"),
		writeFile(
			join(outputDir, "server/assets/server.js"),
			`const functions = {"${functionId}": {functionName: "getAllData_createServerFn_handler"}};`,
		),
	]);
});

afterEach(async () => {
	await rm(outputDir, { recursive: true, force: true });
});

describe("service worker generation", () => {
	it("produces an executable worker with conference data and only runtime assets", async () => {
		await generateServiceWorker(outputDir);
		const source = await readFile(join(outputDir, "client/sw.js"), "utf8");
		const { config, matchers, events, showNotification } = loadWorker(source);
		expect(config?.cachePrefix).toBe("roomisfull-fosdem");
		expect(config?.urls).toContain("/offline");
		expect(config?.urls).toContain("/assets/app.js");
		expect(config?.urls).not.toContain("/assets/app.js.map");
		expect(config?.urls).not.toContain("/conference-build.json");
		expect(config?.schedulePath).toBe(`/_serverFn/${functionId}`);
		const scheduleUrl = config?.urls.find((url) =>
			url.startsWith("/_serverFn/"),
		);
		expect(scheduleUrl).toContain("2027");
		expect(
			matchers.some((match) =>
				match({
					url: new URL(`https://fosdempwa.com/_serverFn/${functionId}`),
				}),
			),
		).toBe(true);
		expect(
			matchers.some((match) =>
				match({ url: new URL("https://fosdempwa.com/_serverFn/getSession") }),
			),
		).toBe(false);
		expect(
			matchers.some((match) =>
				match({
					url: new URL(`https://untrusted.test/_serverFn/${functionId}`),
				}),
			),
		).toBe(false);
		const waitUntil = vi.fn();
		events.get("push")?.({
			data: {
				json: () => ({
					title: "Talk starts soon",
					url: "https://fosdempwa.com/event/talk",
				}),
			},
			waitUntil,
		});
		expect(showNotification).toHaveBeenCalledWith(
			"Talk starts soon",
			expect.objectContaining({ data: "https://fosdempwa.com/event/talk" }),
		);
		expect(waitUntil).toHaveBeenCalledWith(
			showNotification.mock.results[0].value,
		);
	});

	it("reuses the revision until worker inputs change", async () => {
		await generateServiceWorker(outputDir);
		const initial = await readFile(join(outputDir, "client/sw.js"), "utf8");
		await generateServiceWorker(outputDir);
		expect(await readFile(join(outputDir, "client/sw.js"), "utf8")).toBe(
			initial,
		);
		await writeFile(
			join(outputDir, "client/assets/app.js"),
			"export const version = 2;",
		);
		await generateServiceWorker(outputDir);
		expect(
			loadWorker(await readFile(join(outputDir, "client/sw.js"), "utf8")).config
				?.revision,
		).not.toBe(loadWorker(initial).config?.revision);
	});

	it("removes the development worker from directory builds", async () => {
		await writeFile(
			join(outputDir, "client/conference-build.json"),
			JSON.stringify({ id: null }),
		);
		await writeFile(join(outputDir, "client/sw.js"), "development worker");
		await generateServiceWorker(outputDir);
		await expect(
			readFile(join(outputDir, "client/sw.js")),
		).rejects.toMatchObject({ code: "ENOENT" });
	});

	it("fails rather than publishing a worker with an unresolvable schedule endpoint", async () => {
		await rm(join(outputDir, "server/assets/server.js"));
		await expect(generateServiceWorker(outputDir)).rejects.toThrow(
			"Expected one compiled schedule function",
		);
	});

	it("rejects invalid build metadata", async () => {
		await writeFile(
			join(outputDir, "client/conference-build.json"),
			JSON.stringify({ id: 12 }),
		);
		await expect(generateServiceWorker(outputDir)).rejects.toThrow(
			"Invalid conference build metadata",
		);
	});
});

interface WorkerConfig {
	cachePrefix: string;
	revision: string;
	schedulePath: string;
	urls: string[];
}

function loadWorker(source: string) {
	const matchers: Array<(context: { url: URL }) => boolean> = [];
	const events = new Map<string, (event: Record<string, unknown>) => void>();
	const showNotification = vi.fn().mockResolvedValue(undefined);
	const worker: {
		__SERVICE_WORKER_CONFIG__?: WorkerConfig;
		location: { origin: string };
		addEventListener: (
			name: string,
			handler: (event: Record<string, unknown>) => void,
		) => void;
		registration: { showNotification: typeof showNotification };
	} = {
		location: { origin: "https://fosdempwa.com" },
		addEventListener: (name, handler) => {
			events.set(name, handler);
		},
		registration: { showNotification },
	};
	class WorkboxStrategy {}
	class NavigationRoute {
		constructor(readonly strategy: unknown) {}
	}
	runInNewContext(source, {
		self: worker,
		importScripts: vi.fn(),
		Response,
		workbox: {
			core: { setCacheNameDetails: vi.fn() },
			precaching: { precacheAndRoute: vi.fn() },
			strategies: {
				NetworkFirst: WorkboxStrategy,
				CacheFirst: WorkboxStrategy,
				NetworkOnly: WorkboxStrategy,
			},
			cacheableResponse: { CacheableResponsePlugin: WorkboxStrategy },
			expiration: { ExpirationPlugin: WorkboxStrategy },
			routing: {
				registerRoute: (
					matcher: NavigationRoute | ((context: { url: URL }) => boolean),
				) => {
					if (!(matcher instanceof NavigationRoute)) matchers.push(matcher);
				},
				NavigationRoute,
				setDefaultHandler: vi.fn(),
				setCatchHandler: vi.fn(),
			},
		},
	});
	return {
		config: worker.__SERVICE_WORKER_CONFIG__,
		matchers,
		events,
		showNotification,
	};
}
