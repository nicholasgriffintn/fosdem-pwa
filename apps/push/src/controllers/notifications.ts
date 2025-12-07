import type { ApplicationServerKeys } from "webpush-webcrypto";

import { getFosdemData, getCurrentDay } from "../services/fosdem-data";
import { 
	getUserBookmarks, 
	enrichBookmarks, 
	getBookmarksForDay,
	getBookmarksStartingSoon,
	markNotificationSent,
} from "../services/bookmarks";
import { getApplicationKeys, sendNotification, createNotificationPayload } from "../services/notifications";
import { bookmarkNotificationsEnabled } from "../services/config";
import type { Subscription, EnrichedBookmark, Env } from "../types";

async function processUserNotifications(
	subscription: Subscription,
	bookmarks: EnrichedBookmark[],
	keys: ApplicationServerKeys,
	env: Env,
	queueMode = false
) {
	await Promise.all(bookmarks.map(async (bookmark) => {
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
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			console.error(
				`Error sending notification to ${subscription.user_id}: ${errorMessage}`,
			);
			throw error;
		}
	}));
}

export async function triggerTestNotification(env: Env, ctx: ExecutionContext) {
	if (!bookmarkNotificationsEnabled(env)) {
		console.log("Bookmark notifications disabled; skipping test send");
		return;
	}

	const keys = await getApplicationKeys(env);

	const testSubscriptions = await env.DB.prepare(
		"SELECT user_id, endpoint, auth, p256dh FROM subscription WHERE user_id = ?",
	)
		.bind("1")
		.run();

	if (!testSubscriptions.success || !testSubscriptions.results?.length) {
		throw new Error("No test subscriptions found");
	}

	const subscriptions: Subscription[] = testSubscriptions.results.map(sub => ({
		user_id: sub.user_id as string,
		endpoint: sub.endpoint as string,
		auth: sub.auth as string,
		p256dh: sub.p256dh as string,
	}));

	const fosdemData = await getFosdemData();
	const bookmarks = await getUserBookmarks(subscriptions[0].user_id, env, {
		includeSent: true,
	});
	const enrichedBookmarks = enrichBookmarks(bookmarks, fosdemData.events);
	const dayOneBookmarks = getBookmarksForDay(enrichedBookmarks, "1");

	if (!dayOneBookmarks.length) {
		throw new Error("No bookmarks found for day 1");
	}

	await Promise.all(subscriptions.map(async (subscription) => {
		await processUserNotifications(subscription, [dayOneBookmarks[0]], keys, env);
	}));
	
	console.log(`Test notifications sent successfully to ${subscriptions.length} devices`);
}

export async function triggerNotifications(
	event: { cron: string },
	env: Env,
	ctx: ExecutionContext,
	queueMode = false
) {
	if (!bookmarkNotificationsEnabled(env)) {
		console.log("Bookmark notifications disabled; skipping processing");
		return;
	}

	const whichDay = getCurrentDay();

	if (!whichDay) {
		console.error("FOSDEM is not running today");
		return;
	}

	const keys = await getApplicationKeys(env);
	const fosdemData = await getFosdemData();

	const subscriptions = await env.DB.prepare(
		"SELECT user_id, endpoint, auth, p256dh FROM subscription",
	).run();

	if (!subscriptions.success || !subscriptions.results?.length) {
		throw new Error("No subscriptions found");
	}

	const results = await Promise.allSettled(
		subscriptions.results.map(async (subscription) => {
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

				const bookmarks = await getUserBookmarks(typedSubscription.user_id, env);
				const enrichedBookmarks = enrichBookmarks(bookmarks, fosdemData.events);
				const bookmarksRunningToday = getBookmarksForDay(enrichedBookmarks, whichDay);

				if (!bookmarksRunningToday.length) {
					console.log(`No bookmarks running today for ${typedSubscription.user_id}`);
					return;
				}

				const bookmarksStartingSoon = getBookmarksStartingSoon(bookmarksRunningToday);

				if (!bookmarksStartingSoon.length) {
					console.log(`No bookmarks starting soon for ${typedSubscription.user_id}`);
					return;
				}

				await processUserNotifications(typedSubscription, bookmarksStartingSoon, keys, env, queueMode);
				return;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				console.error(
					`Error processing bookmarks for ${subscription.user_id}: ${errorMessage}`,
				);
				throw error;
			}
		}),
	);

	const successful = results.filter((r) => r.status === "fulfilled").length;
	const failed = results.filter((r) => r.status === "rejected").length;

	console.log(
		`Successfully ${queueMode ? 'queued' : 'sent'} ${successful} notifications, failed to process ${failed} notifications`,
	);
} 