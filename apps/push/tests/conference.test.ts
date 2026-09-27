import { afterEach, describe, expect, it, vi } from "vitest";
import { testConference as example } from "@roomisfull/conference/testing";
import { getCurrentDay, getConferenceData } from "../src/lib/conference-data";
import { createDailySummaryPayload } from "../src/lib/notifications";

vi.mock("@roomisfull/conference", async () => ({
	conferenceConfig: (await import("@roomisfull/conference/testing"))
		.testConference,
}));
afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe("conference notification configuration", () => {
	it("resolves days at conference-local midnight", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2027-06-11T02:00:00Z"));
		expect(getCurrentDay()).toBe("1");
		vi.setSystemTime(new Date("2027-06-11T04:00:00Z"));
		expect(getCurrentDay()).toBe("2");
		vi.setSystemTime(new Date("2027-06-13T04:00:00Z"));
		expect(getCurrentDay()).toBeUndefined();
	});

	it("uses the configured last day and app origin in summaries", () => {
		expect(createDailySummaryPayload([], "2", true).body).toContain(
			"See you tomorrow",
		);
		const summary = createDailySummaryPayload([], "3", true);
		expect(summary.title).toContain(example.name);
		expect(summary.body).toContain("is over");
		expect(summary.url).toBe(
			"https://companion.example.org/profile/year-in-review?year=2027",
		);
	});

	it("fetches the selected conference feed", async () => {
		const request = vi.fn().mockResolvedValue(Response.json({ events: {} }));
		vi.stubGlobal("fetch", request);
		await getConferenceData();
		expect(request).toHaveBeenCalledWith(
			"https://data.example.org/example-2027-events.json",
			expect.any(Object),
		);
	});
});
