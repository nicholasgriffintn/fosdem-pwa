import { resolveNotificationPreference } from "./notification-preferences";
import type { Env, Subscription } from "../types";

export type SubscriberEntry = {
	subscription: Subscription;
	prefs: ReturnType<typeof resolveNotificationPreference>;
};

const SUBSCRIBER_QUERY = `SELECT s.user_id, s.endpoint, s.auth, s.p256dh,
      p.reminder_minutes_before, p.event_reminders, p.schedule_changes, p.room_status_alerts,
      p.recording_available, p.daily_summary, p.notify_low_priority
     FROM subscription s
     LEFT JOIN notification_preference p ON p.user_id = s.user_id`;

/**
 * Loads every push subscriber, optionally narrowed to a single user.
 *
 * Two properties matter here:
 *
 * 1. A malformed row (for example a NULL `p256dh` left behind by a
 *    re-subscribe race) is skipped, not thrown. Throwing out of the previous
 *    inline `.map()` aborted the whole run, which meant one bad row silenced
 *    notifications for every user until someone repaired it by hand.
 * 2. `userId` scopes the query. The manual trigger endpoints previously fanned
 *    out to the entire subscriber table, so a "send me a test notification"
 *    action notified everybody.
 *
 * Returns an empty array when there is nothing to do; callers should treat that
 * as a normal outcome rather than an error.
 */
export async function loadSubscribers(
	env: Env,
	options: { userId?: string } = {},
): Promise<SubscriberEntry[]> {
	const { userId } = options;

	const statement = userId
		? env.DB.prepare(`${SUBSCRIBER_QUERY}\n     WHERE s.user_id = ?`).bind(userId)
		: env.DB.prepare(SUBSCRIBER_QUERY);

	const result = await statement.run();

	if (!result.success) {
		console.error("Failed to load push subscriptions");
		return [];
	}

	const rows = (result.results ?? []) as Array<Record<string, unknown>>;
	const entries: SubscriberEntry[] = [];

	for (const row of rows) {
		if (!row.user_id || !row.endpoint || !row.auth || !row.p256dh) {
			console.warn(`Skipping malformed subscription row for user ${row.user_id ?? "unknown"}`);
			continue;
		}

		entries.push({
			subscription: {
				user_id: row.user_id as string,
				endpoint: row.endpoint as string,
				auth: row.auth as string,
				p256dh: row.p256dh as string,
			},
			// biome-ignore lint/suspicious/noExplicitAny: raw D1 row is widened by resolveNotificationPreference
			prefs: resolveNotificationPreference(row as any),
		});
	}

	return entries;
}

/**
 * Removes a subscription whose endpoint the push service reported as gone.
 *
 * Matched on `endpoint` rather than `user_id` so a user with several devices
 * keeps the ones that still work.
 */
export async function deleteSubscriptionByEndpoint(
	endpoint: string,
	env: Env,
): Promise<void> {
	const result = await env.DB.prepare("DELETE FROM subscription WHERE endpoint = ?")
		.bind(endpoint)
		.run();

	if (!result.success) {
		console.error("Failed to delete expired subscription");
	}
}
