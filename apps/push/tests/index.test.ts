import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/cloudflare", () => ({
	withSentry: (_options: any, handlers: any) => handlers,
}));

vi.mock("../src/controllers/notifications", () => ({
	triggerNotifications: vi.fn(),
	triggerTestNotification: vi.fn(),
}));

vi.mock("../src/controllers/schedule-changes", () => ({
	triggerScheduleChangeNotifications: vi.fn(),
}));

vi.mock("../src/controllers/daily-summary", () => ({
	triggerDailySummary: vi.fn(),
}));

vi.mock("../src/lib/notifications", () => ({
	getApplicationKeys: vi.fn(),
	sendNotification: vi.fn(),
}));

vi.mock("../src/lib/bookmarks", () => ({
	markNotificationSent: vi.fn(),
}));

const handler = (await import("../src/index")).default;
const notifications = await import("../src/lib/notifications");
const bookmarks = await import("../src/lib/bookmarks");

const validEnv = {
	DB: {},
	DB_PREVIEW: {},
	NOTIFICATION_QUEUE: { send: vi.fn() },
	VAPID_EMAIL: "admin@example.com",
	VAPID_PUBLIC_KEY: "pub",
	VAPID_PRIVATE_KEY: "priv",
	BOOKMARK_NOTIFICATIONS_ENABLED: "true",
	CRON_SECRET: "test-secret",
} as any;

const authorized = (url: string) =>
	new Request(url, { headers: { "x-cron-secret": "test-secret" } });

describe("push worker env validation", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns 500 when required bindings are missing", async () => {
		const response = await handler.fetch(
			new Request("https://example.com"),
			{} as any,
			{} as any,
		);

		expect(response.status).toBe(500);
		expect(await response.text()).toContain("Missing required bindings");
	});

	it("allows authorized requests when bindings are present", async () => {
		const response = await handler.fetch(
			authorized("https://example.com"),
			validEnv,
			{} as any,
		);

		expect(response.status).toBe(200);
	});

	it("rejects a request that does not present the cron secret", async () => {
		const response = await handler.fetch(
			new Request("https://example.com"),
			validEnv,
			{} as any,
		);

		expect(response.status).toBe(401);
	});

	it("fails closed when CRON_SECRET is not configured", async () => {
		const { CRON_SECRET, ...envWithoutSecret } = validEnv;

		const response = await handler.fetch(
			authorized("https://example.com"),
			envWithoutSecret as any,
			{} as any,
		);

		expect(response.status).toBe(401);
	});

	it("refuses an unscoped test trigger so it cannot fan out to every subscriber", async () => {
		const response = await handler.fetch(
			authorized("https://example.com/?test=true&type=event-reminder"),
			validEnv,
			{} as any,
		);

		expect(response.status).toBe(400);
		expect(await response.text()).toContain("Missing userId");
	});

	it("scopes a test trigger to the requesting user", async () => {
		const { triggerNotifications } = await import("../src/controllers/notifications");

		const response = await handler.fetch(
			authorized("https://example.com/?test=true&type=event-reminder&userId=42"),
			validEnv,
			{} as any,
		);

		expect(response.status).toBe(200);
		expect(triggerNotifications).toHaveBeenCalledWith(
			{ cron: "test" },
			validEnv,
			expect.anything(),
			true,
			undefined,
			"42",
		);
	});

	it("dedupes repeated queue messages within a batch", async () => {
		const sendNotification = notifications.sendNotification as unknown as vi.Mock;
		sendNotification.mockResolvedValue(undefined);
		const getApplicationKeys = notifications.getApplicationKeys as unknown as vi.Mock;
		getApplicationKeys.mockResolvedValue({});

		const markNotificationSent = bookmarks.markNotificationSent as unknown as vi.Mock;
		markNotificationSent.mockResolvedValue(undefined);

		const batch = {
			messages: [
				{
					body: {
						subscription: {},
						notification: { title: "Start", body: "A", url: "u" },
						bookmarkId: "b1",
					},
				},
				{
					body: {
						subscription: {},
						notification: { title: "Start", body: "A", url: "u" },
						bookmarkId: "b1",
					},
				},
			],
		};

		await handler.queue(batch as any, validEnv, {} as any);

		expect(sendNotification).toHaveBeenCalledTimes(1);
		expect(markNotificationSent).toHaveBeenCalledTimes(1);
	});
});
