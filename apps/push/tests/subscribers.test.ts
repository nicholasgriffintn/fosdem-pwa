import { describe, expect, it, vi } from "vitest";

import { loadSubscribers, deleteSubscriptionByEndpoint } from "../src/lib/subscribers";

const row = (overrides: Record<string, unknown> = {}) => ({
	user_id: "1",
	endpoint: "https://fcm.googleapis.com/fcm/send/a",
	auth: "auth",
	p256dh: "key",
	event_reminders: 1,
	...overrides,
});

function makeEnv(result: unknown, capture?: { sql?: string; binds?: unknown[] }) {
	const run = vi.fn().mockResolvedValue(result);
	const bind = vi.fn((...args: unknown[]) => {
		if (capture) capture.binds = args;
		return { run };
	});

	return {
		DB: {
			prepare: vi.fn((sql: string) => {
				if (capture) capture.sql = sql;
				return { run, bind };
			}),
		},
	} as never;
}

describe("loadSubscribers", () => {
	it("returns every subscriber when no user is given", async () => {
		const env = makeEnv({ success: true, results: [row(), row({ user_id: "2" })] });

		const entries = await loadSubscribers(env);

		expect(entries).toHaveLength(2);
		expect(entries[0]?.subscription.user_id).toBe("1");
		expect(entries[0]?.prefs.event_reminders).toBe(true);
	});

	it("scopes the query to a single user when one is given", async () => {
		const capture: { sql?: string; binds?: unknown[] } = {};
		const env = makeEnv({ success: true, results: [row()] }, capture);

		await loadSubscribers(env, { userId: "42" });

		expect(capture.sql).toContain("WHERE s.user_id = ?");
		expect(capture.binds).toEqual(["42"]);
	});

	it("skips a malformed row instead of aborting the whole run", async () => {
		const env = makeEnv({
			success: true,
			results: [row({ user_id: "1" }), row({ user_id: "2", p256dh: null }), row({ user_id: "3" })],
		});

		const entries = await loadSubscribers(env);

		expect(entries.map((e) => e.subscription.user_id)).toEqual(["1", "3"]);
	});

	it("returns an empty list rather than throwing when the query fails", async () => {
		const env = makeEnv({ success: false, results: [] });

		await expect(loadSubscribers(env)).resolves.toEqual([]);
	});

	it("returns an empty list when there are no subscribers", async () => {
		const env = makeEnv({ success: true, results: [] });

		await expect(loadSubscribers(env)).resolves.toEqual([]);
	});
});

describe("deleteSubscriptionByEndpoint", () => {
	it("deletes by endpoint so a user's other devices survive", async () => {
		const capture: { sql?: string; binds?: unknown[] } = {};
		const env = makeEnv({ success: true }, capture);

		await deleteSubscriptionByEndpoint("https://fcm.googleapis.com/fcm/send/a", env);

		expect(capture.sql).toBe("DELETE FROM subscription WHERE endpoint = ?");
		expect(capture.binds).toEqual(["https://fcm.googleapis.com/fcm/send/a"]);
	});
});
