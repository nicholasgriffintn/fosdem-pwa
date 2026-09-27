import { describe, expect, it, vi } from "vitest";

vi.mock("~/constants", () => ({
	constants: {
		TIME_ZONE: "UTC",
	},
}));

import type { ConferenceData, Event } from "~/types/conference";
import { getEventMetadataJson } from "~/utils/event-metadata";
import {
	formatTime,
	createStandardDate,
	formatDate,
	get24HrFormat,
	calculateEndTime,
	parseEventDuration,
	getEventDateTime,
	isEventLive,
	isEventUpcoming,
	isEventFinished,
	calculateTransitionTime,
	isConferenceMoreThanOneMonthAway,
} from "~/lib/dateTime";

const baseConference: ConferenceData = {
	acronym: "F",
	title: "FOSDEM",
	venue: "Venue",
	city: "City",
	start: "2024-02-03",
	end: "2024-02-04",
	days: ["2024-02-03", "2024-02-04"],
	day_change: "",
	timeslot_duration: "",
	time_zone_name: "UTC",
};

const buildEvent = (overrides: Partial<Event> = {}): Event => ({
	title: "Event",
	description: "desc",
	room: "room",
	persons: ["Alice"],
	id: "1",
	startTime: "10:00",
	duration: "01:00",
	abstract: "",
	chat: "",
	links: [],
	attachments: [],
	streams: [],
	day: "1",
	trackKey: "track",
	isLive: false,
	status: "",
	type: "",
	url: "",
	feedbackUrl: "",
	language: "en",
	...overrides,
});

describe("dateTime helpers", () => {
	it("formats seconds into mm:ss output", () => {
		expect(formatTime(65)).toBe("1:05");
		expect(formatTime(null)).toBeNull();
	});

	it("creates a Date instance fixed in the configured timezone", () => {
		const date = createStandardDate("2024-02-03T12:00:00Z");
		expect(date.toISOString()).toBe("2024-02-03T12:00:00.000Z");
	});

	it("delegates formatting to toLocaleDateString with expected options", () => {
		const spy = vi
			.spyOn(Date.prototype, "toLocaleDateString")
			.mockReturnValue("formatted");

		const result = formatDate("2024-02-03T12:00:00Z");

		expect(result).toBe("formatted");
		expect(spy).toHaveBeenCalledWith(undefined, {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			timeZone: "UTC",
		});

		spy.mockRestore();
	});

	it("converts 12hr strings to 24hr format", () => {
		expect(get24HrFormat("01:30 pm")).toBe("1330");
	});

	it("calculates end time based on start and duration", () => {
		expect(calculateEndTime("09:30", "01:15")).toBe("10:45");
	});

	it("parses durations into milliseconds", () => {
		expect(parseEventDuration("01:30")).toBe(90 * 60 * 1000);
	});

	it("builds a Date for an event start time", () => {
		const event = buildEvent();
		const result = getEventDateTime(event, baseConference);
		expect(result).not.toBeNull();
		expect(result?.getUTCHours()).toBe(10);
	});

	it("returns null when event references missing day", () => {
		const event = buildEvent({ day: "5" });
		expect(getEventDateTime(event, baseConference)).toBeNull();
	});

	it("keeps event dates correct west of UTC and compares actual instants", () => {
		const conference = {
			...baseConference,
			days: ["2027-06-10", "2027-06-11"],
			time_zone_name: "America/New_York",
		};
		const event = buildEvent({ day: 2, startTime: "09:00", duration: "01:00" });
		expect(getEventDateTime(event, conference)?.toISOString()).toBe(
			"2027-06-11T13:00:00.000Z",
		);
		expect(
			isEventLive(event, conference, new Date("2027-06-11T13:30:00Z")),
		).toBe(true);
		expect(
			isEventLive(event, conference, new Date("2027-06-10T13:30:00Z")),
		).toBe(false);
	});

	it("publishes the right event day and duration without allowing script markup", () => {
		const event = buildEvent({
			day: 2,
			title: "Talk </script>",
			startTime: "23:30",
			duration: "01:00",
		});
		const json = getEventMetadataJson(event, baseConference, 2024);
		expect(json).not.toContain("</script>");
		expect(JSON.parse(json)).toMatchObject({
			name: "Talk </script>",
			startDate: "2024-02-04T23:30:00.000Z",
			endDate: "2024-02-05T00:30:00.000Z",
		});
	});

	it("detects live events based on reference time", () => {
		const event = buildEvent({ startTime: "10:00", duration: "00:30" });
		const reference = new Date("2024-02-03T10:10:00Z");

		expect(isEventLive(event, baseConference, reference)).toBe(true);
		expect(
			isEventLive(event, baseConference, new Date("2024-02-03T11:00:00Z")),
		).toBe(false);
	});

	it("detects upcoming events", () => {
		const event = buildEvent({ startTime: "10:00" });
		const reference = new Date("2024-02-03T09:45:00Z");

		expect(isEventUpcoming(event, baseConference, 30, reference)).toBe(true);
		expect(isEventUpcoming(event, baseConference, 10, reference)).toBe(false);
	});

	it("detects finished events", () => {
		const event = buildEvent({ startTime: "10:00", duration: "00:15" });
		expect(
			isEventFinished(event, baseConference, new Date("2024-02-03T10:20:00Z")),
		).toBe(true);
		expect(
			isEventFinished(event, baseConference, new Date("2024-02-03T10:10:00Z")),
		).toBe(false);
	});

	it("calculates transition time between two events", () => {
		const event1 = buildEvent({ startTime: "10:00", duration: "00:30" });
		const event2 = buildEvent({ id: "2", startTime: "11:15" });
		expect(calculateTransitionTime(event1, event2)).toBe(45);
	});

	it("checks if a conference is more than one month away", () => {
		const reference = new Date("2024-01-01T00:00:00Z");
		expect(isConferenceMoreThanOneMonthAway(baseConference, reference)).toBe(
			true,
		);
	});
});
