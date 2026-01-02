import { afterEach, describe, expect, it, vi } from "vitest";

import type { Env, Subscription, FosdemEvent } from "../src/types";

vi.mock("../src/lib/fosdem-data", () => ({
	getFosdemData: vi.fn(),
}));

vi.mock("../src/lib/bookmarks", () => ({
	getBookmarksByUserIds: vi.fn(),
}));

vi.mock("../src/lib/notifications", () => ({
	getApplicationKeys: vi.fn(),
	sendNotification: vi.fn(),
}));

vi.mock("../src/lib/notification-preferences", () => ({
	resolveNotificationPreference: vi.fn(),
}));

vi.mock("../src/utils/config", () => ({
	bookmarkNotificationsEnabled: vi.fn(() => true),
}));

const { getFosdemData } = await import("../src/lib/fosdem-data");
const { getBookmarksByUserIds } = await import("../src/lib/bookmarks");
const { getApplicationKeys, sendNotification } = await import(
	"../src/lib/notifications",
);
const { resolveNotificationPreference } = await import(
	"../src/lib/notification-preferences",
);
const { triggerRecordingNotifications } = await import(
	"../src/controllers/recording-notifications",
);

type Prepared = {
	query: string;
	params: unknown[];
	bind: (...args: unknown[]) => Prepared;
	run: () => Promise<{ success: boolean; results?: unknown[] }>;
	first: () => Promise<unknown>;
};

function createMockEnv({
	snapshots,
	subscriptions,
	bookmarkStatus,
}: {
	snapshots: unknown[];
	subscriptions: Subscription[];
	bookmarkStatus: { attended: number; watch_status: string } | null;
}): Env {
	const updateCalls: string[] = [];

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
						if (query.startsWith("SELECT slug")) {
							return { success: true, results: snapshots };
						}
						if (query.includes("FROM subscription")) {
							return { success: true, results: subscriptions };
						}
						if (query.startsWith("UPDATE recording_snapshot")) {
							updateCalls.push(query);
						}
						return { success: true, results: [] };
					},
					async first() {
						if (query.startsWith("SELECT attended")) {
							return bookmarkStatus;
						}
						return null;
					},
				};
				return stmt;
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

	(env as any)._updateCalls = updateCalls;
	return env;
}

const baseSubscription: Subscription = {
	user_id: "1",
	endpoint: "endpoint",
	auth: "auth",
	p256dh: "p256dh",
};

const baseEvent: FosdemEvent = {
	day: "1",
	title: "Talk A",
	type: "devroom",
	track: "Track",
	persons: [],
	room: "H.1302",
	startTime: "10:00",
	duration: "00:30",
	links: [{ type: "video/mp4", href: "https://video.example/talk.mp4" }],
};

afterEach(() => {
	vi.clearAllMocks();
});

describe("triggerRecordingNotifications", () => {
	it("skips when recording notifications are disabled", async () => {
		(getFosdemData as vi.Mock).mockResolvedValue({
			events: { "talk-a": baseEvent },
		});
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

		const env = createMockEnv({
			snapshots: [],
			subscriptions: [baseSubscription],
			bookmarkStatus: { attended: 0, watch_status: "unwatched" },
		});

		await triggerRecordingNotifications({ cron: "" }, env, {} as any, false);

		expect(getBookmarksByUserIds).not.toHaveBeenCalled();
		expect(sendNotification).not.toHaveBeenCalled();
		expect((env as any)._updateCalls).toHaveLength(1);
	});

	it("filters low priority bookmarks when disabled", async () => {
		(getFosdemData as vi.Mock).mockResolvedValue({
			events: { "talk-a": baseEvent },
		});
		(getApplicationKeys as vi.Mock).mockResolvedValue({});
		(resolveNotificationPreference as vi.Mock).mockReturnValue({
			reminder_minutes_before: 15,
			event_reminders: true,
			schedule_changes: true,
			room_status_alerts: true,
			recording_available: true,
			daily_summary: true,
			notify_low_priority: false,
		});
		(getBookmarksByUserIds as vi.Mock).mockResolvedValue(
			new Map([
				[
					"1",
					[
						{
							id: "b1",
							user_id: "1",
							slug: "talk-a",
							type: "bookmark_event",
							status: "favourited",
							year: 2025,
							priority: 2,
						},
					],
				],
			]),
		);

		const env = createMockEnv({
			snapshots: [],
			subscriptions: [baseSubscription],
			bookmarkStatus: { attended: 0, watch_status: "unwatched" },
		});

		await triggerRecordingNotifications({ cron: "" }, env, {} as any, false);

		expect(sendNotification).not.toHaveBeenCalled();
		expect((env as any)._updateCalls).toHaveLength(1);
	});

	it("skips notifications when the event was already attended", async () => {
		(getFosdemData as vi.Mock).mockResolvedValue({
			events: { "talk-a": baseEvent },
		});
		(getApplicationKeys as vi.Mock).mockResolvedValue({});
		(resolveNotificationPreference as vi.Mock).mockReturnValue({
			reminder_minutes_before: 15,
			event_reminders: true,
			schedule_changes: true,
			room_status_alerts: true,
			recording_available: true,
			daily_summary: true,
			notify_low_priority: false,
		});
		(getBookmarksByUserIds as vi.Mock).mockResolvedValue(
			new Map([
				[
					"1",
					[
						{
							id: "b1",
							user_id: "1",
							slug: "talk-a",
							type: "bookmark_event",
							status: "favourited",
							year: 2025,
							priority: 1,
							attended: 1,
							watch_status: "unwatched",
						},
					],
				],
			]),
		);

		const env = createMockEnv({
			snapshots: [],
			subscriptions: [baseSubscription],
			bookmarkStatus: { attended: 1, watch_status: "unwatched" },
		});

		await triggerRecordingNotifications({ cron: "" }, env, {} as any, false);

		expect(sendNotification).not.toHaveBeenCalled();
		expect((env as any)._updateCalls).toHaveLength(1);
	});
});
