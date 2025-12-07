import { getFosdemData, getCurrentDay } from "../services/fosdem-data";
import { 
	getUserBookmarks, 
	enrichBookmarks, 
	getBookmarksForDay,
} from "../services/bookmarks";
import { getApplicationKeys, sendNotification, createDailySummaryPayload } from "../services/notifications";
import type { Subscription, Env } from "../types";

export async function triggerDailySummary(
	event: { cron: string },
	env: Env,
	ctx: ExecutionContext,
	queueMode = false,
	isEvening = false
) {
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
				`Processing ${isEvening ? 'evening' : 'morning'} summary for ${subscription.user_id}`,
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
				const bookmarksToday = getBookmarksForDay(enrichedBookmarks, whichDay);

				if (!bookmarksToday.length) {
					console.log(`No bookmarks today for ${typedSubscription.user_id}`);
					return;
				}

				const notification = createDailySummaryPayload(bookmarksToday, whichDay, isEvening);

				if (queueMode) {
					await env.NOTIFICATION_QUEUE.send({
						subscription: typedSubscription,
						notification,
						bookmarkId: isEvening ? 'evening-summary' : 'morning-summary'
					});
				} else {
					await sendNotification(typedSubscription, notification, keys, env);
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				console.error(
					`Error processing ${isEvening ? 'evening' : 'morning'} summary for ${subscription.user_id}: ${errorMessage}`,
				);
				throw error;
			}
		}),
	);

	const successful = results.filter((r) => r.status === "fulfilled").length;
	const failed = results.filter((r) => r.status === "rejected").length;

	console.log(
		`Successfully ${queueMode ? 'queued' : 'sent'} ${successful} ${isEvening ? 'evening' : 'morning'} summaries, failed to process ${failed}`,
	);
} 