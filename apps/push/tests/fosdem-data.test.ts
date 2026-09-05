import { afterEach, describe, expect, it, vi } from "vitest";

describe("FOSDEM data", () => {
	afterEach(() => {
		vi.useRealTimers();
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
		expect(fetchMock).toHaveBeenCalledWith(
			"https://r2.fosdempwa.com/fosdem-2027-events.json",
			expect.any(Object),
		);
	});

	it("maps the 2027 conference dates to their event days", async () => {
		vi.useFakeTimers();
		const { getCurrentDay } = await import("../src/lib/fosdem-data");

		vi.setSystemTime(new Date("2027-01-30T12:00:00.000Z"));
		expect(getCurrentDay()).toBe("1");

		vi.setSystemTime(new Date("2027-01-31T12:00:00.000Z"));
		expect(getCurrentDay()).toBe("2");

		vi.setSystemTime(new Date("2027-02-01T12:00:00.000Z"));
		expect(getCurrentDay()).toBeUndefined();
	});
});
