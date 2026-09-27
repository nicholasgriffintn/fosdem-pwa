import { afterEach, describe, expect, it, vi } from "vitest";
import schedule from "./fixtures/example-schedule.json";
import { testConference as example } from "@roomisfull/conference/testing";
import { getConferenceConfig } from "@roomisfull/conference/registry";
import { getDataUrl } from "@roomisfull/conference/paths";
import { buildData } from "../src/providers";
import { buildData as buildFosdem } from "../src/providers/fosdem";
import { createYearTemplate, uploadYearFiles } from "../src/lib/year-files";

vi.mock("../src/providers/fosdem", () => ({ buildData: vi.fn() }));
afterEach(() => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

describe("conference provider boundary", () => {
	it("publishes a generic schedule under its own prefix without invoking FOSDEM", async () => {
		const request = vi.fn().mockResolvedValue(Response.json(schedule));
		vi.stubGlobal("fetch", request);
		const data = await buildData({ year: "2027" }, example);
		const put = vi.fn();
		await uploadYearFiles(
			{ head: vi.fn(), put },
			data,
			"2027",
			{ info: vi.fn() },
			example,
		);
		expect(request).toHaveBeenCalledWith(
			"https://conference.example.org/schedule-2027.json",
			expect.any(Object),
		);
		expect(buildFosdem).not.toHaveBeenCalled();
		expect(put.mock.calls.map(([key]) => key).sort()).toEqual([
			"example-2027-core.json",
			"example-2027-events.json",
			"example-2027-persons.json",
			"example-2027-tracks.json",
			"example-2027.json",
		]);
		expect(
			JSON.parse(
				put.mock.calls.find(([key]) => key === "example-2027.json")[1],
			),
		).toEqual(schedule);
		expect(getDataUrl(example, 2027)).toBe(
			"https://data.example.org/example-2027.json",
		);
	});

	it("selects FOSDEM parsing only for the FOSDEM deployment", async () => {
		await buildData({ year: "2027" }, getConferenceConfig("fosdem"));
		expect(buildFosdem).toHaveBeenCalledWith({ year: "2027" });
		expect(() => getConferenceConfig("missing")).toThrow("Unknown conference");
		expect(() => getConferenceConfig("toString")).toThrow("Unknown conference");
	});

	it("uses configured dates and timezone for a three-day template", () => {
		const template = createYearTemplate("2027", example);
		expect(template.conference.time_zone_name).toBe("America/New_York");
		expect(template.conference.days).toEqual([
			"2027-06-10",
			"2027-06-11",
			"2027-06-12",
		]);
		expect(template.days[3].date).toBe("2027-06-12");
		expect(template.days[1].start).toBe("2027-06-10T04:00:00.000Z");
		expect(() => createYearTemplate("2026", example)).toThrow(
			"No conference dates",
		);
	});

	it.each([
		{
			...schedule,
			events: { opening: { ...schedule.events.opening, trackKey: "missing" } },
		},
		{
			...schedule,
			events: { opening: { ...schedule.events.opening, startTime: "25:00" } },
		},
		{
			...schedule,
			conference: { ...schedule.conference, time_zone_name: "Europe/Brussels" },
		},
		{
			...schedule,
			conference: { ...schedule.conference, days: ["2027-06-10"] },
		},
		{ ...schedule, events: null },
		{
			...schedule,
			events: {
				opening: { ...schedule.events.opening, url: "javascript:alert(1)" },
			},
		},
	])("rejects invalid schedules before publishing", async (invalid) => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(invalid)));
		await expect(buildData({ year: "2027" }, example)).rejects.toThrow();
	});

	it("rejects upstream failures", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response("Unavailable", { status: 503 })),
		);
		await expect(buildData({ year: "2027" }, example)).rejects.toThrow("503");
	});
});
