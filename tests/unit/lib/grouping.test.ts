import { describe, expect, it } from "vitest";

import type { Event, Track } from "~/types/fosdem";
import { groupByDay, groupEventsByDay, groupTracksByDay } from "~/lib/grouping";

describe("grouping helpers", () => {
	it("groups arbitrary items by the day selector", () => {
		const items = [
			{ id: 1, day: "1" },
			{ id: 2, day: ["1", "2"] },
		];

		const grouped = groupByDay(items, (item) => item.day);

		expect(grouped["1"]).toHaveLength(2);
		expect(grouped["2"]).toHaveLength(1);
	});

	it("groups events by day", () => {
		const events: Event[] = [
			{ id: "1", day: "1" } as Event,
			{ id: "2", day: "2" } as Event,
		];

		const grouped = groupEventsByDay(events);
		expect(grouped["1"]).toHaveLength(1);
		expect(grouped["2"]).toHaveLength(1);
	});

	it("groups tracks by day", () => {
		const tracks: Track[] = [
			{ id: "a", day: 1 } as Track,
			{ id: "b", day: 1 } as Track,
		];

		const grouped = groupTracksByDay(tracks);
		expect(grouped["1"]).toHaveLength(2);
	});
});
