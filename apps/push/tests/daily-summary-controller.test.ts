import { afterEach, describe, expect, it, vi } from "vitest";

import type { Env, Subscription, EnrichedBookmark } from "../src/types";

vi.mock("../src/lib/fosdem-data", () => ({
	getFosdemData: vi.fn(),
	getCurrentDay: vi.fn(),
}));

vi.mock("../src/lib/bookmarks", () => ({
	getUserBookmarks: vi.fn(),
	enrichBookmarks: vi.fn(),
	getBookmarksForDay: vi.fn(),
}));

vi.mock("../src/lib/notifications", () => ({
	getApplicationKeys: vi.fn(),
	sendNotification: vi.fn(),
	createDailySummaryPayload: vi.fn(),
}));

vi.mock("../src/lib/notification-preferences", () => ({
	getUserNotificationPreference: vi.fn(),
}));

vi.mock("../src/lib/year-in-review", () => ({
	refreshYearInReviewStats: vi.fn(),
}));

const { getFosdemData, getCurrentDay } = await import("../src/lib/fosdem-data");
const { getUserBookmarks, enrichBookmarks, getBookmarksForDay } = await import(
	"../src/lib/bookmarks",
);
const { getApplicationKeys, sendNotification, createDailySummaryPayload } =
	await import("../src/lib/notifications");
const { getUserNotificationPreference } = await import(
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
						if (query.startsWith("SELECT user_id")) {
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
		(getUserNotificationPreference as vi.Mock).mockResolvedValue({
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

		expect(getUserBookmarks).not.toHaveBeenCalled();
		expect(sendNotification).not.toHaveBeenCalled();
	});

	it("filters low priority bookmarks when disabled", async () => {
		(getCurrentDay as vi.Mock).mockReturnValue("1");
		(getFosdemData as vi.Mock).mockResolvedValue({ events: {} });
		(getApplicationKeys as vi.Mock).mockResolvedValue({});
		(getUserNotificationPreference as vi.Mock).mockResolvedValue({
			reminder_minutes_before: 15,
			event_reminders: true,
			schedule_changes: true,
			room_status_alerts: true,
			recording_available: false,
			daily_summary: true,
			notify_low_priority: false,
		});
		(getUserBookmarks as vi.Mock).mockResolvedValue([
			{ ...baseBookmark, priority: 2 },
		]);
		(enrichBookmarks as vi.Mock).mockReturnValue([]);
		(getBookmarksForDay as vi.Mock).mockReturnValue([]);
		(createDailySummaryPayload as vi.Mock).mockReturnValue({
			title: "Summary",
			body: "Body",
			url: "https://example.com",
		});

		const env = createMockEnv([baseSubscription]);

		await triggerDailySummary({ cron: "" }, env, {} as any, false, false);

		expect(enrichBookmarks).toHaveBeenCalledWith([], {});
		expect(sendNotification).not.toHaveBeenCalled();
	});
});
