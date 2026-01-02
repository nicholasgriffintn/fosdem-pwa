import { getFosdemData, getCurrentDay } from "../lib/fosdem-data";
import { 
	getBookmarksByUserIds,
	enrichBookmarks, 
	getBookmarksForDay,
} from "../lib/bookmarks";
import { refreshYearInReviewStats } from "../lib/year-in-review";
import { getApplicationKeys, sendNotification, createDailySummaryPayload } from "../lib/notifications";
import { resolveNotificationPreference } from "../lib/notification-preferences";
import type { Subscription, Env } from "../types";

export async function triggerDailySummary(
	event: { cron: string },
	env: Env,
	ctx: ExecutionContext,
	queueMode = false,
	isEvening = false,
	dayOverride?: string,
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
	const subscriptionEntries = subscriptionRows.map((subscription) => {
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

				const prefs = resolveNotificationPreference(subscription as any);

				return {
					subscription: typedSubscription,
					prefs,
				};
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				console.error(
					`Error processing ${isEvening ? 'evening' : 'morning'} summary for ${subscription.user_id}: ${errorMessage}`,
				);
				throw error;
			}
		});

	const usersNeedingBookmarks = subscriptionEntries
		.filter(({ prefs }) => prefs.daily_summary)
		.map(({ subscription }) => subscription.user_id);
	const bookmarksByUser = usersNeedingBookmarks.length
		? await getBookmarksByUserIds(usersNeedingBookmarks, env, {
				includeSent: true,
			})
		: new Map();

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
