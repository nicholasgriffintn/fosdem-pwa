import { constants } from "../constants";
import { getFosdemData } from "../lib/fosdem-data";
import { getBookmarksByUserIds, enrichBookmarks } from "../lib/bookmarks";
import {
	getApplicationKeys,
	sendNotification,
	createScheduleChangePayload,
} from "../lib/notifications";
import { resolveNotificationPreference } from "../lib/notification-preferences";
import { loadSubscribers } from "../lib/subscribers";
import type { Bookmark, Env, Subscription, ScheduleSnapshot } from "../types";

type SnapshotRow = ScheduleSnapshot;

const hashEvent = (start: string, duration: string, room: string) =>
	`${start}|${duration}|${room}`;

async function loadSnapshots(env: Env): Promise<SnapshotRow[]> {
	const snapshots = await env.DB.prepare(
		"SELECT slug, start_time, duration, room FROM schedule_snapshot WHERE year = ?",
	)
		.bind(constants.YEAR)
		.run();

	return (snapshots.results ?? []) as unknown as SnapshotRow[];
}

async function upsertSnapshots(
	events: Record<string, { startTime: string; duration: string; room: string }>,
	env: Env,
) {
	const statements = Object.entries(events).map(([slug, event]) =>
		env.DB.prepare(
			"INSERT OR REPLACE INTO schedule_snapshot (slug, start_time, duration, room, year, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
		).bind(slug, event.startTime, event.duration, event.room, constants.YEAR),
	);

	if (statements.length) {
		await env.DB.batch(statements);
	}
}

export async function triggerScheduleChangeNotifications(
	event: { cron: string },
	env: Env,
	ctx: ExecutionContext,
	queueMode = false,
	userId?: string,
) {
	const fosdemData = await getFosdemData();
	const snapshots = await loadSnapshots(env);

	if (!snapshots.length) {
		await upsertSnapshots(fosdemData.events, env);
		console.log("schedule_snapshot was empty; stored initial snapshot and skipped notifications");
		return;
	}

	const snapshotMap = new Map<string, SnapshotRow>(
		snapshots.map((row) => [row.slug, row]),
	);

	const changedEvents = new Map<string, SnapshotRow | undefined>();

	for (const [slug, event] of Object.entries(fosdemData.events)) {
		const previous = snapshotMap.get(slug);
		const previousHash = previous
			? hashEvent(previous.start_time, previous.duration, previous.room)
			: undefined;
		const currentHash = hashEvent(event.startTime, event.duration, event.room);
		const hasChanged = !previous || previousHash !== currentHash;

		if (hasChanged) {
			changedEvents.set(slug, previous);
		}
	}

	if (!changedEvents.size) {
		console.log("No schedule changes detected");
		return;
	}

	const keys = await getApplicationKeys(env);
	const subscriptionEntries = await loadSubscribers(env, { userId });

	if (!subscriptionEntries.length) {
		console.log("No subscriptions found for schedule change notifications");
		return;
	}

	const usersNeedingBookmarks = subscriptionEntries
		.filter(({ prefs }) => prefs.schedule_changes)
		.map(({ subscription }) => subscription.user_id);
	const bookmarksByUser = usersNeedingBookmarks.length
		? await getBookmarksByUserIds(usersNeedingBookmarks, env, {
				includeSent: true,
				slugs: Array.from(changedEvents.keys()),
			})
		: new Map<string, Bookmark[]>();

	const results = await Promise.allSettled(
		subscriptionEntries.map(async ({ subscription, prefs }) => {
			if (!prefs.schedule_changes) {
				return;
			}

			const bookmarks = bookmarksByUser.get(subscription.user_id) ?? [];
			const filteredBookmarks = prefs.notify_low_priority
				? bookmarks
				: bookmarks.filter((bookmark) => Number(bookmark.priority) <= 1);

			if (!filteredBookmarks.length) {
				return;
			}

			const relevantBookmarks = filteredBookmarks.filter((bookmark) =>
				changedEvents.has(bookmark.slug),
			);

			if (!relevantBookmarks.length) {
				return;
			}

			const enriched = enrichBookmarks(relevantBookmarks, fosdemData.events);

			for (const bookmark of enriched) {
				const previous = changedEvents.get(bookmark.slug);
				const notification = createScheduleChangePayload(bookmark, previous);

				if (queueMode) {
					await env.NOTIFICATION_QUEUE.send({
						subscription,
						notification,
						bookmarkId: `${bookmark.id}-schedule-change`,
						shouldMarkSent: false,
					});
				} else {
					await sendNotification(subscription, notification, keys, env);
				}
			}
		}),
	);

	const successful = results.filter((r) => r.status === "fulfilled").length;
	const failed = results.filter((r) => r.status === "rejected").length;

	console.log(
		`Processed schedule change notifications for ${successful} subscriptions, failed ${failed}`,
	);

	const eventsToUpdate: Record<string, { startTime: string; duration: string; room: string }> = {};
	for (const [slug, event] of Object.entries(fosdemData.events)) {
		const previous = snapshotMap.get(slug);
		const previousHash = previous
			? hashEvent(previous.start_time, previous.duration, previous.room)
			: undefined;
		const currentHash = hashEvent(event.startTime, event.duration, event.room);
		const hasChanged = !previous || previousHash !== currentHash;

		if (hasChanged) {
			eventsToUpdate[slug] = {
				startTime: event.startTime,
				duration: event.duration,
				room: event.room,
			};
		}
	}

	if (Object.keys(eventsToUpdate).length > 0) {
		await upsertSnapshots(eventsToUpdate, env);
		console.log(`Updated ${Object.keys(eventsToUpdate).length} schedule snapshots`);
	}
}
