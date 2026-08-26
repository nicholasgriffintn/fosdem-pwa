import { getFosdemData, getCurrentDay } from "../lib/fosdem-data";
import { 
	getBookmarksByUserIds,
	enrichBookmarks, 
	getBookmarksForDay,
} from "../lib/bookmarks";
import { refreshYearInReviewStats } from "../lib/year-in-review";
import { getApplicationKeys, sendNotification, createDailySummaryPayload } from "../lib/notifications";
import { resolveNotificationPreference } from "../lib/notification-preferences";
import { loadSubscribers } from "../lib/subscribers";
import type { Bookmark, Subscription, Env } from "../types";

export async function triggerDailySummary(
	event: { cron: string },
	env: Env,
	ctx: ExecutionContext,
	queueMode = false,
	isEvening = false,
	dayOverride?: string,
	userId?: string,
) {
	const currentDay = getCurrentDay();
	const whichDay = dayOverride ?? currentDay;

	if (!whichDay) {
		console.error("FOSDEM is not running today");
		return;
	}

	if (isEvening) {
		try {
			await refreshYearInReviewStats(env);
		} catch (error) {
			console.error("Failed to refresh year in review stats:", error);
		}
	}

	const keys = await getApplicationKeys(env);
	const fosdemData = await getFosdemData();

	const subscriptionEntries = await loadSubscribers(env, { userId });

	if (!subscriptionEntries.length) {
		console.log("No subscriptions found for daily summary");
		return;
	}

	const usersNeedingBookmarks = subscriptionEntries
		.filter(({ prefs }) => prefs.daily_summary)
		.map(({ subscription }) => subscription.user_id);
	const bookmarksByUser = usersNeedingBookmarks.length
		? await getBookmarksByUserIds(usersNeedingBookmarks, env, {
				includeSent: true,
			})
		: new Map<string, Bookmark[]>();

	const results = await Promise.allSettled(
		subscriptionEntries.map(async ({ subscription, prefs }) => {
			if (!prefs.daily_summary) {
				return;
			}

			const bookmarks = bookmarksByUser.get(subscription.user_id) ?? [];
			const filteredBookmarks = prefs.notify_low_priority
				? bookmarks
				: bookmarks.filter((bookmark) => Number(bookmark.priority) <= 1);
			const enrichedBookmarks = enrichBookmarks(filteredBookmarks, fosdemData.events);
			const bookmarksToday = getBookmarksForDay(enrichedBookmarks, whichDay);

			const notification = createDailySummaryPayload(bookmarksToday, whichDay, isEvening);

			if (queueMode) {
				await env.NOTIFICATION_QUEUE.send({
					subscription,
					notification,
					bookmarkId: isEvening ? 'evening-summary' : 'morning-summary',
					shouldMarkSent: false,
				});
			} else {
				await sendNotification(subscription, notification, keys, env);
			}
		}),
	);

	const successful = results.filter((r) => r.status === "fulfilled").length;
	const failed = results.filter((r) => r.status === "rejected").length;

	console.log(
		`Successfully ${queueMode ? 'queued' : 'sent'} ${successful} ${isEvening ? 'evening' : 'morning'} summaries, failed to process ${failed}`,
	);
} 
