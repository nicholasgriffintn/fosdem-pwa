import { describe, expect, it } from "vitest";

import { getUserNotificationPreference } from "../src/lib/notification-preferences";
import type { Env } from "../src/types";

type Prepared = {
	bind: (...args: unknown[]) => Prepared;
	first: () => Promise<unknown>;
};

function createEnv(result: unknown): Env {
	return {
		DB: {
			prepare: (): Prepared => {
				const stmt: Prepared = {
					bind: () => stmt,
					first: async () => result,
				};
				return stmt;
			},
		} as Env["DB"],
		DB_PREVIEW: {} as Env["DB_PREVIEW"],
		ANALYTICS: {} as Env["ANALYTICS"],
		NOTIFICATION_QUEUE: {} as Env["NOTIFICATION_QUEUE"],
		VAPID_EMAIL: "",
		VAPID_PUBLIC_KEY: "",
		VAPID_PRIVATE_KEY: "",
	};
}

describe("notification preferences", () => {
	it("returns defaults when no preference row exists", async () => {
		const env = createEnv(null);
		const prefs = await getUserNotificationPreference("1", env);

		expect(prefs).toEqual({
			reminder_minutes_before: 15,
			event_reminders: true,
			schedule_changes: true,
			room_status_alerts: true,
			recording_available: false,
			daily_summary: true,
			notify_low_priority: false,
		});
	});

	it("coerces stored values into booleans and numbers", async () => {
		const env = createEnv({
			reminder_minutes_before: "30",
			event_reminders: 1,
			schedule_changes: 0,
			room_status_alerts: "1",
			recording_available: "0",
			daily_summary: 1,
			notify_low_priority: "1",
		});

		const prefs = await getUserNotificationPreference("1", env);

		expect(prefs.reminder_minutes_before).toBe(30);
		expect(prefs.event_reminders).toBe(true);
		expect(prefs.schedule_changes).toBe(false);
		expect(prefs.room_status_alerts).toBe(true);
		expect(prefs.recording_available).toBe(false);
		expect(prefs.daily_summary).toBe(true);
		expect(prefs.notify_low_priority).toBe(true);
	});
});
