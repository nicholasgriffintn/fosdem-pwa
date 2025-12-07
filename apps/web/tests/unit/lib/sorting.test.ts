import { describe, expect, it } from "vitest";
import type { Event, Track, RoomData } from "~/types/fosdem";

import {
	sortEvents,
	sortTracks,
	sortEventsWithFavorites,
	sortTracksWithFavorites,
	sortRooms,
	sortUpcomingEvents,
	sortScheduleEvents,
} from "~/lib/sorting";

let eventCounter = 0;
const buildEvent = (overrides: Partial<Event> = {}): Event =>
	({
		id: overrides.id ?? `event-${eventCounter++}`,
		title: "Event",
		day: "1",
		startTime: "10:00",
		duration: "01:00",
		...overrides,
	}) as Event;

describe("sorting helpers", () => {
	it("sorts events by priority, day, time, duration, and title", () => {
		const events = [
			buildEvent({ id: "c", priority: 2 }),
			buildEvent({ id: "a", priority: 1 }),
			buildEvent({ id: "b", priority: 1, title: "A" }),
		];

		const sorted = [...events].sort(sortEvents);
		expect(sorted.map((e) => e.id)).toEqual(["b", "a", "c"]);
	});

	it("sorts tracks alphabetically", () => {
		const tracks = [
			{ id: "1", name: "Z" },
			{ id: "2", name: "A" },
		] as Track[];

		const sorted = [...tracks].sort(sortTracks);
		expect(sorted.map((t) => t.name)).toEqual(["A", "Z"]);
	});

	it("prioritizes favorite events", () => {
		const events = [
			buildEvent({ id: "fav" }),
			buildEvent({ id: "plain" }),
		];
		const sorter = sortEventsWithFavorites({ fav: true });
		const sorted = [...events].sort(sorter);
		expect(sorted[0].id).toBe("fav");
	});

	it("prioritizes favorite tracks", () => {
		const tracks = [
			{ id: "fav", name: "B" },
			{ id: "plain", name: "A" },
		] as Track[];

		const sorter = sortTracksWithFavorites({ fav: true });
		const sorted = [...tracks].sort(sorter);
		expect(sorted[0].id).toBe("fav");
	});

	it("sorts rooms preferring on-site rooms first, then building and name", () => {
		const rooms = [
			{ name: "Online Room", buildingId: "B" },
			{ name: "A Room", buildingId: "A" },
			{ name: "B Room", building: { id: "B" } },
		] as RoomData[];

		const sorted = [...rooms].sort(sortRooms);
		expect(sorted.map((r) => r.name)).toEqual([
			"A Room",
			"B Room",
			"Online Room",
		]);
	});

	it("sorts upcoming events by start time, then duration and title", () => {
		const events = [
			buildEvent({ id: "a", startTime: "10:00" }),
			buildEvent({ id: "b", startTime: "09:00" }),
		];

		const sorted = [...events].sort(sortUpcomingEvents);
		expect(sorted.map((e) => e.id)).toEqual(["b", "a"]);
	});

	it("sorts schedule events by day then time", () => {
		const events = [
			buildEvent({ id: "day2", day: "2", startTime: "09:00" }),
			buildEvent({ id: "day1", day: "1", startTime: "11:00" }),
		];

		const sorted = [...events].sort(sortScheduleEvents);
		expect(sorted.map((e) => e.id)).toEqual(["day1", "day2"]);
	});
});
