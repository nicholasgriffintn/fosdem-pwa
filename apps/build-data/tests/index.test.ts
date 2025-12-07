import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/cloudflare", () => ({
	withSentry: (_options, handlers) => handlers,
}));

vi.mock("../src/lib/fosdem", () => ({
	buildData: vi.fn(),
}));

const { buildData } = await import("../src/lib/fosdem");
const handler = (await import("../src/index")).default;

describe("build-data worker entrypoint", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("stores built data in R2 and returns it from fetch", async () => {
		const mockData = { events: { "event-1": { title: "Keynote" } } };
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
		);
		expect(await response.json()).toEqual(mockData);
	});

	it("triggers build during scheduled events", async () => {
		const mockData = { events: { "event-2": { title: "Lightning Talk" } } };
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
		);
	});
});
