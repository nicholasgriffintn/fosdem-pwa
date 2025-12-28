import type { ExecutionContext } from "@cloudflare/workers-types";

import { constants } from "../constants";
import { getFosdemData } from "../lib/fosdem-data";
import { getUserBookmarks, enrichBookmarks } from "../lib/bookmarks";
import {
	getApplicationKeys,
	sendNotification,
	createScheduleChangePayload,
} from "../lib/notifications";
import {
	bookmarkNotificationsEnabled,
	scheduleChangeNotificationsEnabled,
} from "../utils/config";
import { getUserNotificationPreference } from "../lib/notification-preferences";
import type { Env, Subscription, ScheduleSnapshot } from "../types";

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
) {
	if (!scheduleChangeNotificationsEnabled(env)) {
		console.log("Schedule change notifications disabled; skipping");
		return;
	}

	if (!bookmarkNotificationsEnabled(env)) {
		console.log("Bookmark notifications disabled; skipping schedule change flow");
		return;
	}

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
	const subscriptions = await env.DB.prepare(
		"SELECT user_id, endpoint, auth, p256dh FROM subscription",
	).run();

	if (!subscriptions.success || !subscriptions.results?.length) {
		console.log("No subscriptions found for schedule change notifications");
		return;
	}

	const results = await Promise.allSettled(
		subscriptions.results.map(async (subscription) => {
			const typedSubscription: Subscription = {
				user_id: subscription.user_id as string,
				endpoint: subscription.endpoint as string,
				auth: subscription.auth as string,
				p256dh: subscription.p256dh as string,
			};

			const prefs = await getUserNotificationPreference(
				typedSubscription.user_id,
				env,
			);

			if (!prefs.schedule_changes) {
				return;
			}

			const bookmarks = await getUserBookmarks(typedSubscription.user_id, env, {
				includeSent: true,
			});

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
						subscription: typedSubscription,
						notification,
						bookmarkId: `${bookmark.id}-schedule-change`,
						shouldMarkSent: false,
					});
				} else {
					await sendNotification(typedSubscription, notification, keys, env);
				}
			}
		}),
	);

	const successful = results.filter((r) => r.status === "fulfilled").length;
	const failed = results.filter((r) => r.status === "rejected").length;

	console.log(
		`Processed schedule change notifications for ${successful} subscriptions, failed ${failed}`,
	);

	await upsertSnapshots(fosdemData.events, env);
}
