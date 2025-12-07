import { describe, expect, it } from "vitest";
import type { Event, Track, RoomData } from "~/types/fosdem";

import {
	createSearchIndex,
	formatSearchResults,
	formatTrack,
	formatEvent,
	formatRoom,
} from "~/lib/search";

describe("search helpers", () => {
	it("creates an index that can find matching items", () => {
		const tracks = [
			{ id: "1", name: "Devroom", description: "", room: "", type: "", day: 1, eventCount: 0 },
			{ id: "2", name: "Keynotes", description: "", room: "", type: "", day: 1, eventCount: 0 },
		] as Track[];

		const fuse = createSearchIndex(tracks, [{ name: "name", weight: 1 }]);
		const results = fuse.search("Devroom");

		expect(results).toHaveLength(1);
		expect(results[0].item.id).toBe("1");
	});

	it("formats Fuse results with consistent structure", () => {
		const results = formatSearchResults(
			[
				{ item: { id: "a" }, score: 0.2, refIndex: 0 },
				{ item: { id: "b" }, score: 0.1, refIndex: 1 },
			],
			"track",
			1,
		);

		expect(results).toEqual([
			{
				type: "track",
				item: { id: "b" },
				score: 0.1,
			},
		]);
	});

	it("enriches tracks with event counts", () => {
		const track = {
			id: "t",
			name: "Track",
			room: "A",
		} as Track;
		const events = {
			a: { trackKey: "Track" },
			b: { trackKey: "Other" },
		} as unknown as Record<string, Event>;

		const formatted = formatTrack(track, events);
		expect(formatted.eventCount).toBe(1);
	});

	it("limits events to the fields used by search results", () => {
		const event = {
			id: "1",
			title: "Title",
			startTime: "10:00",
			duration: "00:30",
			room: "A",
			persons: ["Alice"],
		} as Event;

		expect(formatEvent(event)).toEqual({
			id: "1",
			title: "Title",
			startTime: "10:00",
			duration: "00:30",
			room: "A",
			persons: ["Alice"],
		});
	});

	it("normalizes room data", () => {
		const room = {
			name: "Janson",
			slug: "janson",
			building: { id: "J" },
			eventCount: 10,
		} as RoomData;

		expect(formatRoom(room)).toEqual({
			name: "Janson",
			slug: "janson",
			buildingId: "J",
			eventCount: 10,
		});
	});
});
