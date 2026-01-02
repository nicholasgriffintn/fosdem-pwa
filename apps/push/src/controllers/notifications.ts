import type { ApplicationServerKeys } from "webpush-webcrypto";

import { getFosdemData, getCurrentDay } from "../lib/fosdem-data";
import { 
	getBookmarksByUserIds,
	enrichBookmarks, 
	getBookmarksForDay,
	getBookmarksStartingSoon,
	markNotificationSent,
} from "../lib/bookmarks";
import { resolveNotificationPreference } from "../lib/notification-preferences";
import { getApplicationKeys, sendNotification, createNotificationPayload } from "../lib/notifications";
import type { Subscription, EnrichedBookmark, Env } from "../types";

async function processUserNotifications(
	subscription: Subscription,
	bookmarks: EnrichedBookmark[],
	keys: ApplicationServerKeys,
	env: Env,
	queueMode = false
) {
	const results = await Promise.allSettled(bookmarks.map(async (bookmark) => {
		try {
			const notification = createNotificationPayload(bookmark);
			if (queueMode) {
				await env.NOTIFICATION_QUEUE.send({
					subscription,
					notification,
					bookmarkId: bookmark.id,
					shouldMarkSent: true,
				});
			} else {
				await sendNotification(subscription, notification, keys, env);
				await markNotificationSent(bookmark.id, env);
			}
			return { success: true, bookmarkId: bookmark.id };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			console.error(
				`Error sending notification to ${subscription.user_id} for bookmark ${bookmark.id}: ${errorMessage}`,
			);
			return { success: false, bookmarkId: bookmark.id, error: errorMessage };
		}
	}));

	const failures = results.filter(r => r.status === "rejected" || (r.status === "fulfilled" && !r.value.success));
	if (failures.length > 0) {
		console.warn(`${failures.length}/${bookmarks.length} notifications failed for user ${subscription.user_id}`);
	}
}

export async function triggerNotifications(
	event: { cron: string },
	env: Env,
	ctx: ExecutionContext,
	queueMode = false,
	dayOverride?: string,
) {
	const currentDay = getCurrentDay();
	const whichDay = dayOverride ?? currentDay;

	if (!whichDay) {
		console.error("FOSDEM is not running today");
		return;
	}

	const keys = await getApplicationKeys(env);
	const fosdemData = await getFosdemData();

	const subscriptions = await env.DB.prepare(
		`SELECT s.user_id, s.endpoint, s.auth, s.p256dh,
      p.reminder_minutes_before, p.event_reminders, p.schedule_changes, p.room_status_alerts,
      p.recording_available, p.daily_summary, p.notify_low_priority
     FROM subscription s
     LEFT JOIN notification_preference p ON p.user_id = s.user_id`,
	).run();

	if (!subscriptions.success || !subscriptions.results?.length) {
		throw new Error("No subscriptions found");
	}

	const subscriptionRows = subscriptions.results as Array<Record<string, unknown>>;
	const subscriptionEntries = subscriptionRows
		.map((subscription) => {
			console.log(
				`Processing notifications for ${subscription.user_id} via ${subscription.endpoint}`,
			);

			try {
				if (
					!subscription.user_id ||
					!subscription.endpoint ||
					!subscription.auth ||
					!subscription.p256dh
				) {
					throw new Error("Invalid subscription data");
				}

				const typedSubscription: Subscription = {
					user_id: subscription.user_id as string,
					endpoint: subscription.endpoint as string,
					auth: subscription.auth as string,
					p256dh: subscription.p256dh as string,
				};

				const prefs = resolveNotificationPreference(subscription as any);

				return {
					subscription: typedSubscription,
					prefs,
				};
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				console.error(
					`Error processing bookmarks for ${subscription.user_id}: ${errorMessage}`,
				);
				throw error;
			}
		})
		.filter((entry): entry is { subscription: Subscription; prefs: ReturnType<typeof resolveNotificationPreference> } =>
			Boolean(entry),
		);

	const usersNeedingBookmarks = subscriptionEntries
		.filter(({ prefs }) => prefs.event_reminders)
		.map(({ subscription }) => subscription.user_id);

	const bookmarksByUser = usersNeedingBookmarks.length
		? await getBookmarksByUserIds(usersNeedingBookmarks, env)
		: new Map();

	const results = await Promise.allSettled(
		subscriptionEntries.map(async ({ subscription, prefs }) => {
			if (!prefs.event_reminders) {
				return;
			}

			const bookmarks = bookmarksByUser.get(subscription.user_id) ?? [];
			const filteredBookmarks = prefs.notify_low_priority
				? bookmarks
				: bookmarks.filter((bookmark) => (bookmark.priority ?? 0) <= 1);

			const enrichedBookmarks = enrichBookmarks(filteredBookmarks, fosdemData.events);
			const bookmarksRunningToday = getBookmarksForDay(enrichedBookmarks, whichDay);

			if (!bookmarksRunningToday.length) {
				console.log(`No bookmarks running today for ${subscription.user_id}`);
				return;
			}

			const bookmarksStartingSoon = getBookmarksStartingSoon(
				bookmarksRunningToday,
				prefs.reminder_minutes_before,
			);

			if (!bookmarksStartingSoon.length) {
				console.log(`No bookmarks starting soon for ${subscription.user_id}`);
				return;
			}

			await processUserNotifications(subscription, bookmarksStartingSoon, keys, env, queueMode);
		}),
	);

	const successful = results.filter((r) => r.status === "fulfilled").length;
	const failed = results.filter((r) => r.status === "rejected").length;

	console.log(
		`Successfully ${queueMode ? 'queued' : 'sent'} ${successful} notifications, failed to process ${failed} notifications`,
	);
} 
