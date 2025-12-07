import { afterEach, describe, expect, it, vi } from "vitest";

import {
	createDailySummaryPayload,
	createNotificationPayload,
	createScheduleChangePayload,
} from "../src/services/notifications";
import {
	getBookmarksForDay,
	getBookmarksStartingSoon,
} from "../src/services/bookmarks";
import {
	bookmarkNotificationsEnabled,
	scheduleChangeNotificationsEnabled,
} from "../src/services/config";
import type { EnrichedBookmark, ScheduleSnapshot, Env } from "../src/types";

const baseBookmark: EnrichedBookmark = {
	id: "1",
	user_id: "user-1",
	type: "bookmark_event",
	status: "favourited",
	year: 2025,
	slug: "test-talk",
	priority: 1,
	day: "1",
	title: "Test Talk",
	track: "Main",
	persons: ["Speaker"],
	room: "H.1302",
	startTime: "10:00",
	duration: "00:30",
};

describe("notification payloads", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("creates starting-soon payload with correct minutes and URL", () => {
		// 2025-02-01T08:45:00Z -> 09:45 Brussels (UTC+1)
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2025-02-01T08:45:00Z"));

		const payload = createNotificationPayload(baseBookmark);

		expect(payload.title).toBe("Event Starting Soon");
		expect(payload.body).toContain("starts in 15 minutes");
		expect(payload.body).toContain(baseBookmark.room);
		expect(payload.url).toContain("year=2025");
	});

	it("creates daily summary payloads for morning and evening", () => {
		const bookmarks = [
			{ ...baseBookmark, startTime: "09:00" },
			{ ...baseBookmark, id: "2", slug: "test-talk-2", startTime: "12:00" },
		];

		const morning = createDailySummaryPayload(bookmarks, "1", false);
		expect(morning.title).toBe("Your FOSDEM Day 1 Summary");
		expect(morning.body).toContain("09:00");
		expect(morning.body).toContain("12:00");

		const evening = createDailySummaryPayload(bookmarks, "1", true);
		expect(evening.title).toBe("FOSDEM Day 1 Wrap-up");
		expect(evening.body).toContain("You attended 2 events today");
	});

	it("creates schedule change payload with previous details", () => {
		const previous: ScheduleSnapshot = {
			slug: baseBookmark.slug,
			start_time: "09:30",
			duration: "00:30",
			room: "H.1301",
		};

		const payload = createScheduleChangePayload(
			{ ...baseBookmark, startTime: "10:00", room: "H.1302" },
			previous,
		);

		expect(payload.title).toBe("Schedule updated");
		expect(payload.body).toContain("now starts at 10:00 in H.1302");
		expect(payload.body).toContain("was 09:30 in H.1301");
	});
});

describe("bookmark helpers", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("filters bookmarks by day", () => {
		const bookmarks = [
			baseBookmark,
			{ ...baseBookmark, id: "2", slug: "other", day: "2" },
		];

		const dayOne = getBookmarksForDay(bookmarks, "1");
		expect(dayOne).toHaveLength(1);
		expect(dayOne[0].slug).toBe("test-talk");
	});

	it("filters bookmarks starting within 15 minutes in Brussels time", () => {
		// 2025-02-01T08:45:00Z -> 09:45 Brussels
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2025-02-01T08:45:00Z"));

		const bookmarks = [
			{ ...baseBookmark, startTime: "10:00" }, // 15 minutes away
			{ ...baseBookmark, id: "2", slug: "later", startTime: "10:30" }, // 45 minutes
		];

		const startingSoon = getBookmarksStartingSoon(bookmarks);
		expect(startingSoon).toHaveLength(1);
		expect(startingSoon[0].slug).toBe("test-talk");
	});
});

describe("notification feature flags", () => {
	it("enables by default and respects env flags", () => {
		const envDefault = {} as Env;
		const envFalse = { BOOKMARK_NOTIFICATIONS_ENABLED: "false" } as Env;
		const envTrue = { BOOKMARK_NOTIFICATIONS_ENABLED: "true" } as Env;

		expect(bookmarkNotificationsEnabled(envDefault)).toBe(false);
		expect(bookmarkNotificationsEnabled(envFalse)).toBe(false);
		expect(bookmarkNotificationsEnabled(envTrue)).toBe(true);
	});

	it("separates schedule change flag", () => {
		const env = {
			SCHEDULE_CHANGE_NOTIFICATIONS_ENABLED: false,
		} as Env;

		expect(scheduleChangeNotificationsEnabled(env)).toBe(false);
	});
});
