import { describe, expect, it } from "vitest";

import type { Event } from "~/types/fosdem";
import { detectEventConflicts, generateTimeSlots } from "~/lib/fosdem";

const buildEvent = (overrides: Partial<Event>): Event =>
	({
		title: "Event",
		description: "",
		room: "room",
		persons: [],
		id: Math.random().toString(),
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
	}) as Event;

describe("fosdem helpers", () => {
	it("detects overlapping events on the same day", () => {
		const events = [
			buildEvent({ id: "1", startTime: "10:00", duration: "01:00" }),
			buildEvent({ id: "2", startTime: "10:30", duration: "01:00" }),
			buildEvent({ id: "3", startTime: "12:00", duration: "01:00" }),
		];

		const conflicts = detectEventConflicts(events, 2024);
		expect(conflicts).toHaveLength(1);
		expect(conflicts[0].event1.id).toBe("1");
		expect(conflicts[0].event2.id).toBe("2");
		expect(conflicts[0].overlapDuration).toBe(30);
	});

	it("groups events by their start time", () => {
		const events = [
			buildEvent({ id: "1", startTime: "09:00" }),
			buildEvent({ id: "2", startTime: "09:00" }),
			buildEvent({ id: "3", startTime: "11:00" }),
		];

		const slots = generateTimeSlots(events);
		expect(slots).toEqual([
			{ time: "09:00", events: [events[0], events[1]] },
			{ time: "11:00", events: [events[2]] },
		]);
	});
});
