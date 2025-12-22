import { afterEach, describe, expect, it, vi } from "vitest";

import type { Env, Subscription } from "../src/types";

vi.mock("../src/services/fosdem-data", () => ({
	getFosdemData: vi.fn(),
}));

vi.mock("../src/services/bookmarks", () => ({
	getUserBookmarks: vi.fn(),
	enrichBookmarks: vi.fn(),
}));

vi.mock("../src/services/notifications", () => ({
	getApplicationKeys: vi.fn(),
	sendNotification: vi.fn(),
	createScheduleChangePayload: vi.fn(),
}));

vi.mock("../src/services/config", () => ({
	bookmarkNotificationsEnabled: vi.fn(() => true),
	scheduleChangeNotificationsEnabled: vi.fn(() => true),
}));

const { getFosdemData } = await import("../src/lib/fosdem-data");
const { getUserBookmarks, enrichBookmarks } = await import("../src/lib/bookmarks");
const {
	getApplicationKeys,
	sendNotification,
	createScheduleChangePayload,
} = await import("../src/lib/notifications");

const { triggerScheduleChangeNotifications } = await import(
	"../src/controllers/schedule-changes"
);

type Prepared = {
	query: string;
	params: unknown[];
	run: () => Promise<{ success: boolean; results?: unknown[] }>;
	bind: (...args: unknown[]) => Prepared;
};

function createMockEnv({
	snapshots,
	subscriptions,
}: {
	snapshots: any[];
	subscriptions: any[];
}): Env {
	const batchCalls: Prepared[][] = [];

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
						if (query.startsWith("SELECT user_id")) {
							return { success: true, results: subscriptions };
						}
						return { success: true, results: [] };
					},
				};
				return stmt;
			},
			batch: async (stmts: Prepared[]) => {
				batchCalls.push(stmts);
				return { success: true };
			},
		} as unknown as Env["DB"],
		DB_PREVIEW: {} as Env["DB_PREVIEW"],
		ANALYTICS: {} as Env["ANALYTICS"],
		NOTIFICATION_QUEUE: {
			send: vi.fn(),
		} as unknown as Env["NOTIFICATION_QUEUE"],
		VAPID_EMAIL: "",
		VAPID_PUBLIC_KEY: "",
		VAPID_PRIVATE_KEY: "",
	};

	// expose for assertions
	(env as any)._batchCalls = batchCalls;
	return env;
}

afterEach(() => {
	vi.clearAllMocks();
});

describe("triggerScheduleChangeNotifications", () => {
	it("seeds snapshot when empty and skips notifications", async () => {
		(getFosdemData as vi.Mock).mockResolvedValue({
			events: {
				"talk-a": { startTime: "09:00", duration: "00:30", room: "H.1301" },
			},
		});

		const env = createMockEnv({
			snapshots: [],
			subscriptions: [
				{ user_id: "1", endpoint: "e", auth: "a", p256dh: "k" },
			],
		});

		await triggerScheduleChangeNotifications({ cron: "" }, env, {} as any, false);

		// no notifications sent on seed
		expect(sendNotification).not.toHaveBeenCalled();
		// batch called once with seed statements
		expect((env as any)._batchCalls).toHaveLength(1);
		expect((env as any)._batchCalls[0]).toHaveLength(1);
	});

	it("sends notifications for changed events and updates snapshot", async () => {
		const subscriptions: Subscription[] = [
			{
				user_id: "1",
				endpoint: "e",
				auth: "a",
				p256dh: "k",
			},
		];

		(getFosdemData as vi.Mock).mockResolvedValue({
			events: {
				"talk-a": { startTime: "09:30", duration: "00:30", room: "H.1302" },
			},
		});
		(getUserBookmarks as vi.Mock).mockResolvedValue([
			{ id: "b1", user_id: "1", slug: "talk-a", type: "bookmark_event", status: "favourited", year: 2025, priority: 1 },
		]);
		(enrichBookmarks as vi.Mock).mockReturnValue([
			{
				id: "b1",
				user_id: "1",
				slug: "talk-a",
				type: "bookmark_event",
				status: "favourited",
				year: 2025,
				priority: 1,
				day: "1",
				title: "Test",
				track: "Track",
				persons: [],
				room: "H.1302",
				startTime: "09:30",
				duration: "00:30",
			},
		]);
		(createScheduleChangePayload as vi.Mock).mockReturnValue({
			title: "Schedule updated",
			body: "Body",
			url: "https://example.com",
		});
		(getApplicationKeys as vi.Mock).mockResolvedValue({} as any);

		const env = createMockEnv({
			snapshots: [
				{
					slug: "talk-a",
					start_time: "09:00",
					duration: "00:30",
					room: "H.1301",
				},
			],
			subscriptions,
		});

		await triggerScheduleChangeNotifications({ cron: "" }, env, {} as any, false);

		expect(sendNotification).toHaveBeenCalledTimes(1);
		expect(createScheduleChangePayload).toHaveBeenCalledWith(
			expect.objectContaining({ slug: "talk-a" }),
			expect.objectContaining({ start_time: "09:00", room: "H.1301" }),
		);
		// snapshot update invoked
		expect((env as any)._batchCalls.at(-1)?.length).toBe(1);
	});
});
