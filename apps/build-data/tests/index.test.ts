import { afterEach, describe, expect, it, vi } from "vitest";

import { buildData } from "../src/lib/fosdem";
import handler from "../src/index";

vi.mock("@sentry/cloudflare", () => ({
	withSentry: (_options, handlers) => handlers,
}));

vi.mock("../src/lib/fosdem", () => ({
	buildData: vi.fn(),
}));

describe("build-data worker entrypoint", () => {
	const makeMockData = () => ({
		conference: { title: "FOSDEM" },
		events: { "event-1": { title: "Keynote" } },
		tracks: { t: { id: "t" } },
		rooms: { r: { name: "r" } },
		days: { 1: { id: 1 } },
		types: { keynote: { id: "keynote" } },
		buildings: { H: { id: "H" } },
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("stores built data in R2 and returns it from fetch", async () => {
		const mockData = makeMockData();
		(buildData as vi.Mock).mockResolvedValue(mockData);

		const put = vi.fn();
		const env = { R2: { put } };

		const response = await handler.fetch(
			new Request("https://example.com"),
			env as any,
			{} as any,
		);

		expect(buildData).toHaveBeenCalledWith({ year: "2026" });
		expect(put).toHaveBeenCalledWith(
			"fosdem-2026.json",
			JSON.stringify(mockData, null, 2),
			expect.objectContaining({
				httpMetadata: expect.objectContaining({
					contentType: "application/json",
				}),
				customMetadata: expect.objectContaining({
					year: "2026",
					etag: expect.any(String),
				}),
			}),
		);
		expect(await response.json()).toEqual(mockData);
	});

	it("uses env year and clamps to valid range", async () => {
		const mockData = makeMockData();
		(buildData as vi.Mock).mockResolvedValue(mockData);

		const put = vi.fn();
		const env = { R2: { put }, YEAR: "1999" };

		await handler.fetch(new Request("https://example.com"), env as any, {} as any);

		expect(buildData).toHaveBeenCalledWith({ year: "2000" });
		expect(put).toHaveBeenCalledWith(
			"fosdem-2000.json",
			JSON.stringify(mockData, null, 2),
			expect.any(Object),
		);
	});

	it("throws when generated data is missing events", async () => {
		const mockData = {
			conference: {},
			events: {},
			tracks: {},
			rooms: {},
			days: {},
			types: {},
			buildings: {},
		};
		(buildData as vi.Mock).mockResolvedValue(mockData);

		const put = vi.fn();
		const env = { R2: { put } };

		await expect(
			handler.fetch(new Request("https://example.com"), env as any, {} as any),
		).rejects.toThrow("Generated data contains no events");

		expect(put).not.toHaveBeenCalled();
	});

	it("triggers build during scheduled events", async () => {
		const mockData = makeMockData();
		(buildData as vi.Mock).mockResolvedValue(mockData);

		const put = vi.fn();
		const waitUntil = vi.fn(async (promise: Promise<unknown>) => promise);
		const env = { R2: { put } };

		await handler.scheduled({}, env as any, { waitUntil } as any);

		expect(waitUntil).toHaveBeenCalledTimes(1);

		const buildPromise = waitUntil.mock.calls[0]?.[0] as Promise<unknown>;
		await buildPromise;

		expect(buildData).toHaveBeenCalledWith({ year: "2026" });
		expect(put).toHaveBeenCalledWith(
			"fosdem-2026.json",
			JSON.stringify(mockData, null, 2),
			expect.any(Object),
		);
	});
});
