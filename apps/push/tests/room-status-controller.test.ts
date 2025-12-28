import { afterEach, describe, expect, it, vi } from "vitest";

import type { Env, Subscription } from "../src/types";

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
}));

vi.mock("../src/lib/notification-preferences", () => ({
	getUserNotificationPreference: vi.fn(),
}));

vi.mock("../src/utils/config", () => ({
	bookmarkNotificationsEnabled: vi.fn(() => true),
}));

const { getFosdemData, getCurrentDay } = await import("../src/lib/fosdem-data");
const { getUserBookmarks, enrichBookmarks, getBookmarksForDay } = await import(
	"../src/lib/bookmarks",
);
const { getApplicationKeys, sendNotification } = await import(
	"../src/lib/notifications",
);
const { getUserNotificationPreference } = await import(
	"../src/lib/notification-preferences",
);
const { triggerRoomStatusNotifications } = await import(
	"../src/controllers/room-status",
);

type Prepared = {
	query: string;
	params: unknown[];
	bind: (...args: unknown[]) => Prepared;
	run: () => Promise<{ success: boolean; results?: unknown[] }>;
	all: () => Promise<{ success: boolean; results?: unknown[] }>;
};

function createMockEnv(subscriptions: Subscription[]): Env {
	const env: Env = {
		DB: {
			prepare: (query: string): Prepared => {
				const stmt: Prepared = {
					query,
					params: [],
					bind(...args: unknown[]) {
						stmt.params = args;
						return stmt;
					},
					async run() {
						if (query.startsWith("SELECT user_id")) {
							return { success: true, results: subscriptions };
						}
						return { success: true, results: [] };
					},
					async all() {
						if (query.startsWith("SELECT state")) {
							return {
								success: true,
								results: [
									{ state: "1", recorded_at: "2025-02-01T10:00:00Z" },
									{ state: "1", recorded_at: "2025-02-01T09:55:00Z" },
									{ state: "1", recorded_at: "2025-02-01T09:50:00Z" },
									{ state: "1", recorded_at: "2025-02-01T09:45:00Z" },
									{ state: "1", recorded_at: "2025-02-01T09:40:00Z" },
									{ state: "1", recorded_at: "2025-02-01T09:35:00Z" },
									{ state: "1", recorded_at: "2025-02-01T09:30:00Z" },
									{ state: "0", recorded_at: "2025-02-01T09:25:00Z" },
									{ state: "0", recorded_at: "2025-02-01T09:20:00Z" },
									{ state: "0", recorded_at: "2025-02-01T09:15:00Z" },
								],
							};
						}
						return { success: true, results: [] };
					},
				};
				return stmt;
			},
			batch: async () => ({ success: true }),
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

	return env;
}

const baseSubscription: Subscription = {
	user_id: "1",
	endpoint: "endpoint",
	auth: "auth",
	p256dh: "p256dh",
};

afterEach(() => {
	vi.clearAllMocks();
	vi.unstubAllGlobals();
});

describe("triggerRoomStatusNotifications", () => {
	it("skips when room status alerts are disabled", async () => {
		vi.stubGlobal("fetch", vi.fn(async () => ({
			ok: true,
			json: async () => [{ roomname: "H.1302", state: "1" }],
		})) as unknown as typeof fetch);

		(getCurrentDay as vi.Mock).mockReturnValue("1");
		(getFosdemData as vi.Mock).mockResolvedValue({ events: {} });
		(getApplicationKeys as vi.Mock).mockResolvedValue({});
		(getUserNotificationPreference as vi.Mock).mockResolvedValue({
			reminder_minutes_before: 15,
			event_reminders: true,
			schedule_changes: true,
			room_status_alerts: false,
			recording_available: false,
			daily_summary: true,
			notify_low_priority: false,
		});

		const env = createMockEnv([baseSubscription]);

		await triggerRoomStatusNotifications({ cron: "" }, env, {} as any, false);

		expect(getUserBookmarks).not.toHaveBeenCalled();
		expect(sendNotification).not.toHaveBeenCalled();
	});

	it("filters low priority bookmarks when disabled", async () => {
		vi.stubGlobal("fetch", vi.fn(async () => ({
			ok: true,
			json: async () => [{ roomname: "H.1302", state: "1" }],
		})) as unknown as typeof fetch);

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
			{
				id: "b1",
				user_id: "1",
				slug: "talk-a",
				type: "bookmark_event",
				status: "favourited",
				year: 2025,
				priority: 2,
			},
		]);
		(enrichBookmarks as vi.Mock).mockReturnValue([]);
		(getBookmarksForDay as vi.Mock).mockReturnValue([]);

		const env = createMockEnv([baseSubscription]);

		await triggerRoomStatusNotifications({ cron: "" }, env, {} as any, false);

		expect(enrichBookmarks).not.toHaveBeenCalled();
		expect(sendNotification).not.toHaveBeenCalled();
	});
});
