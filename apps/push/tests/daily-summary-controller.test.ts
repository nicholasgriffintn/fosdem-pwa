import { afterEach, describe, expect, it, vi } from "vitest";

import type { Env, Subscription, EnrichedBookmark } from "../src/types";

vi.mock("../src/lib/fosdem-data", () => ({
	getFosdemData: vi.fn(),
	getCurrentDay: vi.fn(),
}));

vi.mock("../src/lib/bookmarks", () => ({
	getBookmarksByUserIds: vi.fn(),
	enrichBookmarks: vi.fn(),
	getBookmarksForDay: vi.fn(),
}));

vi.mock("../src/lib/notifications", () => ({
	getApplicationKeys: vi.fn(),
	sendNotification: vi.fn(),
	createDailySummaryPayload: vi.fn(),
}));

vi.mock("../src/lib/notification-preferences", () => ({
	resolveNotificationPreference: vi.fn(),
}));

vi.mock("../src/lib/year-in-review", () => ({
	refreshYearInReviewStats: vi.fn(),
}));

const { getFosdemData, getCurrentDay } = await import("../src/lib/fosdem-data");
const { getBookmarksByUserIds, enrichBookmarks, getBookmarksForDay } = await import(
	"../src/lib/bookmarks",
);
const { getApplicationKeys, sendNotification, createDailySummaryPayload } =
	await import("../src/lib/notifications");
const { resolveNotificationPreference } = await import(
	"../src/lib/notification-preferences",
);
const { triggerDailySummary } = await import(
	"../src/controllers/daily-summary",
);

type Prepared = {
	query: string;
	run: () => Promise<{ success: boolean; results?: unknown[] }>;
};

function createMockEnv(subscriptions: Subscription[]): Env {
	return {
		DB: {
			prepare: (query: string): Prepared => {
				return {
					query,
					async run() {
						if (query.includes("FROM subscription")) {
							return { success: true, results: subscriptions };
						}
						return { success: true, results: [] };
					},
				};
			},
		} as Env["DB"],
		DB_PREVIEW: {} as Env["DB_PREVIEW"],
		ANALYTICS: {} as Env["ANALYTICS"],
		NOTIFICATION_QUEUE: {
			send: vi.fn(),
		} as unknown as Env["NOTIFICATION_QUEUE"],
		VAPID_EMAIL: "",
		VAPID_PUBLIC_KEY: "",
		VAPID_PRIVATE_KEY: "",
	};
}

const baseSubscription: Subscription = {
	user_id: "1",
	endpoint: "endpoint",
	auth: "auth",
	p256dh: "p256dh",
};

const baseBookmark: EnrichedBookmark = {
	id: "b1",
	user_id: "1",
	type: "bookmark_event",
	status: "favourited",
	year: 2025,
	slug: "talk-a",
	priority: 2,
	day: "1",
	title: "Talk A",
	track: "Track",
	persons: [],
	room: "H.1302",
	startTime: "10:00",
	duration: "00:30",
};

afterEach(() => {
	vi.clearAllMocks();
});

describe("triggerDailySummary", () => {
	it("skips when daily summary preference is disabled", async () => {
		(getCurrentDay as vi.Mock).mockReturnValue("1");
		(getFosdemData as vi.Mock).mockResolvedValue({ events: {} });
		(getApplicationKeys as vi.Mock).mockResolvedValue({});
		(resolveNotificationPreference as vi.Mock).mockReturnValue({
			reminder_minutes_before: 15,
			event_reminders: true,
			schedule_changes: true,
			room_status_alerts: true,
			recording_available: false,
			daily_summary: false,
			notify_low_priority: false,
		});

		const env = createMockEnv([baseSubscription]);

		await triggerDailySummary({ cron: "" }, env, {} as any, false, false);

		expect(getBookmarksByUserIds).not.toHaveBeenCalled();
		expect(sendNotification).not.toHaveBeenCalled();
	});

	it("filters low priority bookmarks when disabled", async () => {
		(getCurrentDay as vi.Mock).mockReturnValue("1");
		(getFosdemData as vi.Mock).mockResolvedValue({ events: {} });
		(getApplicationKeys as vi.Mock).mockResolvedValue({});
		(resolveNotificationPreference as vi.Mock).mockReturnValue({
			reminder_minutes_before: 15,
			event_reminders: true,
			schedule_changes: true,
			room_status_alerts: true,
			recording_available: false,
			daily_summary: true,
			notify_low_priority: false,
		});
		(getBookmarksByUserIds as vi.Mock).mockResolvedValue(
			new Map([["1", [{ ...baseBookmark, priority: 2 }]]]),
		);
		(enrichBookmarks as vi.Mock).mockReturnValue([]);
		(getBookmarksForDay as vi.Mock).mockReturnValue([]);
		(createDailySummaryPayload as vi.Mock).mockReturnValue({
			title: "FOSDEM Day 1 Summary",
			body: "No events in your schedule today.",
			url: "https://example.com",
		});

		const env = createMockEnv([baseSubscription]);

		await triggerDailySummary({ cron: "" }, env, {} as any, false, false);

		// Should filter out low priority bookmarks (priority > 1)
		expect(enrichBookmarks).toHaveBeenCalledWith([], {});
		// Should still send a notification with "No events" message
		expect(sendNotification).toHaveBeenCalled();
		expect(createDailySummaryPayload).toHaveBeenCalledWith([], "1", false);
	});
});
