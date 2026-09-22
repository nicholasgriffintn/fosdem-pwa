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
	const makeR2 = () => ({
		head: vi.fn().mockResolvedValue({}),
		put: vi.fn(),
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("stores built data in R2 and returns it from fetch", async () => {
		const mockData = makeMockData();
		(buildData as vi.Mock).mockResolvedValue(mockData);

		const R2 = makeR2();
		const env = { R2 };

		const response = await handler.fetch(
			new Request("https://example.com"),
			env as any,
			{} as any,
		);

		expect(buildData).toHaveBeenCalledWith({ year: "2027" });
		expect(R2.put).toHaveBeenCalledWith(
			"fosdem-2027.json",
			JSON.stringify(mockData, null, 2),
			expect.objectContaining({
				httpMetadata: expect.objectContaining({
					contentType: "application/json",
				}),
				customMetadata: expect.objectContaining({
					year: "2027",
					etag: expect.any(String),
				}),
			}),
		);
		expect(await response.json()).toEqual(mockData);
	});

	it("uses env year and clamps to valid range", async () => {
		const mockData = makeMockData();
		(buildData as vi.Mock).mockResolvedValue(mockData);

		const R2 = makeR2();
		const env = { R2, YEAR: "1999" };

		await handler.fetch(new Request("https://example.com"), env as any, {} as any);

		expect(buildData).toHaveBeenCalledWith({ year: "2000" });
		expect(R2.put).toHaveBeenCalledWith(
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

		const R2 = makeR2();
		const env = { R2 };

		await expect(
			handler.fetch(new Request("https://example.com"), env as any, {} as any),
		).rejects.toThrow("Generated data contains no events");

		expect(R2.put).not.toHaveBeenCalled();
	});

	it("creates missing year files from a template when the schedule is unavailable", async () => {
		(buildData as vi.Mock).mockRejectedValue(
			new Error("Failed to fetch schedule: 404 Not Found"),
		);

		const head = vi.fn().mockResolvedValue(null);
		const put = vi.fn();
		const env = { R2: { head, put } };

		const response = await handler.fetch(
			new Request("https://example.com"),
			env as any,
			{} as any,
		);
		const data = await response.json();

		expect(head.mock.calls.map(([key]) => key)).toEqual([
			"fosdem-2027.json",
			"fosdem-2027-core.json",
			"fosdem-2027-tracks.json",
			"fosdem-2027-events.json",
			"fosdem-2027-persons.json",
		]);
		expect(put).toHaveBeenCalledTimes(5);
		expect(put.mock.calls.map(([key]) => key)).toEqual([
			"fosdem-2027.json",
			"fosdem-2027-core.json",
			"fosdem-2027-tracks.json",
			"fosdem-2027-events.json",
			"fosdem-2027-persons.json",
		]);
		expect(data).toMatchObject({
			conference: {
				acronym: "fosdem-2027",
				title: "FOSDEM 2027",
				venue: "ULB (Université Libre de Bruxelles)",
				city: "Brussels",
				start: "2027-01-30",
				end: "2027-01-31",
				base_url: "https://fosdem.org/2027/schedule/",
				time_zone_name: "Europe/Brussels",
			},
			days: {
				1: {
					date: "2027-01-30",
					start: "2027-01-30T09:00:00+01:00",
					end: "2027-01-31T08:59:00+01:00",
				},
				2: {
					date: "2027-01-31",
					start: "2027-01-31T09:00:00+01:00",
					end: "2027-02-01T08:59:00+01:00",
				},
			},
			types: {},
			buildings: {},
			rooms: {},
			tracks: {},
			events: {},
		});
	});

	it("triggers build during scheduled events", async () => {
		const mockData = makeMockData();
		(buildData as vi.Mock).mockResolvedValue(mockData);

		const R2 = makeR2();
		const waitUntil = vi.fn(async (promise: Promise<unknown>) => promise);
		const env = { R2 };

		await handler.scheduled({}, env as any, { waitUntil } as any);

		expect(waitUntil).toHaveBeenCalledTimes(1);

		const buildPromise = waitUntil.mock.calls[0]?.[0] as Promise<unknown>;
		await buildPromise;

		expect(buildData).toHaveBeenCalledWith({ year: "2027" });
		expect(R2.put).toHaveBeenCalledWith(
			"fosdem-2027.json",
			JSON.stringify(mockData, null, 2),
			expect.any(Object),
		);
	});
});
