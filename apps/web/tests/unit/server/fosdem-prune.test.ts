import { describe, expect, it } from "vitest";

import { pruneFosdemData } from "~/server/lib/fosdem-prune";
import type { Conference } from "~/types/fosdem";
import type { Bookmark } from "~/server/db/schema";

const baseConference = (): Conference => ({
	conference: {
		acronym: "FOSDEM",
		title: "FOSDEM",
		venue: "Venue",
		city: "City",
		end: "2026-02-02",
		start: "2026-02-01",
		days: ["1", "2"],
		day_change: "09:00",
		timeslot_duration: "00:30",
		time_zone_name: "UTC",
	},
	types: {},
	buildings: {},
	rooms: {},
	days: {
		"1": {
			id: "1",
			name: "Day 1",
			date: "2026-02-01",
			start: "09:00",
			end: "18:00",
			eventCount: 1,
			trackCount: 1,
			roomCount: 1,
			buildingCount: 1,
		},
		"2": {
			id: "2",
			name: "Day 2",
			date: "2026-02-02",
			start: "09:00",
			end: "18:00",
			eventCount: 1,
			trackCount: 1,
			roomCount: 1,
			buildingCount: 1,
		},
	},
	tracks: {
		"track-a": {
			id: "track-a",
			name: "Track A",
			description: "Desc",
			room: "Room 1",
			type: "devroom",
			day: 2,
			eventCount: 3,
		},
	},
	events: {
		"event-a": {
			title: "Event A",
			description: "Desc",
			room: "Room 1",
			persons: ["Alice"],
			id: "event-a",
			startTime: "10:00",
			duration: "00:45",
			abstract: "Abstract",
			chat: "",
			links: [],
			attachments: [],
			streams: [],
			day: ["1", "2"],
			trackKey: "track-a",
			isLive: false,
			status: "confirmed",
			type: "devroom",
			url: "https://example.com/event-a",
			feedbackUrl: "https://example.com/event-a/feedback",
			language: "en",
		},
	},
	persons: {},
});

const makeBookmark = (overrides: Partial<Bookmark>): Bookmark =>
	({
		id: "b1",
		slug: "event-a",
		user_id: 1,
		type: "bookmark_event",
		status: "favourited",
		year: 2026,
		priority: null,
		last_notification_sent_at: null,
		watch_later: false,
		watch_status: "unwatched",
		watch_progress_seconds: 0,
		playback_speed: "1",
		last_watched_at: null,
		attended: false,
		attended_at: null,
		attended_in_person: false,
		created_at: "2026-01-01T00:00:00.000Z",
		updated_at: "2026-01-01T00:00:00.000Z",
		...overrides,
	}) as Bookmark;

describe("pruneFosdemData", () => {
	it("returns empty collections when no bookmarks exist", () => {
		const conference = baseConference();
		const result = pruneFosdemData(conference, []);

		expect(result.conference).toEqual(conference.conference);
		expect(result.days).toEqual({});
		expect(result.tracks).toEqual({});
		expect(result.events).toEqual({});
	});

	it("keeps only bookmarked events/tracks and related days", () => {
		const conference = baseConference();
		const bookmarks = [
			makeBookmark({ slug: "event-a", type: "bookmark_event" }),
			makeBookmark({ id: "b2", slug: "track-a", type: "bookmark_track" }),
			makeBookmark({ id: "b3", slug: "missing", type: "bookmark_event" }),
		];

		const result = pruneFosdemData(conference, bookmarks);

		expect(Object.keys(result.events)).toEqual(["event-a"]);
		expect(Object.keys(result.tracks)).toEqual(["track-a"]);
		expect(Object.keys(result.days).sort()).toEqual(["1", "2"]);
	});
});
