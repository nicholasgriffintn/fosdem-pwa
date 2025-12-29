import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/constants", () => ({
	constants: {
		YEAR: 2026,
		DATA_LINK: "https://example.com/fosdem-${YEAR}-events.json",
		DAYS_MAP: {},
	},
}));

describe("getFosdemData caching", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.resetModules();
	});

	it("reuses cached data within TTL", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue({ ok: true, json: async () => ({ events: {} }) });
		vi.stubGlobal("fetch", fetchMock);

		const { getFosdemData } = await import("../src/lib/fosdem-data");

		await getFosdemData();
		await getFosdemData();

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});
