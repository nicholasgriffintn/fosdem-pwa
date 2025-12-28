import * as Sentry from "@sentry/cloudflare";
import type { ExecutionContext, ExportedHandler } from "@cloudflare/workers-types";

import { triggerNotifications } from "./controllers/notifications";
import { triggerScheduleChangeNotifications } from "./controllers/schedule-changes";
import { triggerRoomStatusNotifications, pollAndStoreRoomStatus, cleanupOldRoomStatus } from "./controllers/room-status";
import { triggerRecordingNotifications } from "./controllers/recording-notifications";
import { triggerDailySummary } from "./controllers/daily-summary";
import { getApplicationKeys, sendNotification } from "./lib/notifications";
import { markNotificationSent } from "./lib/bookmarks";
import type { Env, QueueMessage } from "./types";

const REQUIRED_ENV: Array<keyof Env> = [
	"DB",
	"NOTIFICATION_QUEUE",
	"VAPID_EMAIL",
	"VAPID_PUBLIC_KEY",
	"VAPID_PRIVATE_KEY",
];

const DEDUPE_WINDOW_MS = 5 * 60 * 1000;
const MAX_SEND_RETRIES = 2;
const RETRY_DELAY_MS = 250;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const validateEnv = (env: Env) => {
	const missing = REQUIRED_ENV.filter((key) => {
		const value = env[key];
		return value === undefined || value === null || value === "";
	});

	return {
		ok: missing.length === 0,
		missing,
	};
};

export default Sentry.withSentry(
	env => ({
		dsn: "https://b76a52be6f8677f808dca20da8fd8273@o4508599344365568.ingest.de.sentry.io/4508734021369936",
		tracesSampleRate: 1.0,
	}),
	{
		// @ts-expect-error - CBA
		async fetch(request: Request, env: Env, ctx: ExecutionContext) {
			const validation = validateEnv(env);
			if (!validation.ok) {
				return new Response(`Missing required bindings: ${validation.missing.join(", ")}`, { status: 500 });
			}

			try {
				const url = new URL(request.url);
				const isDailySummary = url.searchParams.has("daily-summary");
				const isEveningSummary = url.searchParams.has("evening-summary");
				const isScheduleChange = url.searchParams.has("schedule-changes");

				if (isDailySummary) {
					await triggerDailySummary({ cron: "fetch" }, env, ctx, true, false);
					return new Response("Morning summary notifications queued");
				}

				if (isEveningSummary) {
					await triggerDailySummary({ cron: "fetch" }, env, ctx, true, true);
					return new Response("Evening summary notifications queued");
				}

				if (isScheduleChange) {
					await triggerScheduleChangeNotifications({ cron: "fetch" }, env, ctx, true);
					return new Response("Schedule change notifications queued");
				}

				const isRoomStatus = url.searchParams.has("room-status");
				if (isRoomStatus) {
					await triggerRoomStatusNotifications({ cron: "fetch" }, env, ctx, true);
					return new Response("Room status notifications queued");
				}

				const isPollRooms = url.searchParams.has("poll-rooms");
				if (isPollRooms) {
					await pollAndStoreRoomStatus(env);
					return new Response("Room statuses polled and stored");
				}

				const isRecordings = url.searchParams.has("recordings");
				if (isRecordings) {
					await triggerRecordingNotifications({ cron: "fetch" }, env, ctx, true);
					return new Response("Recording notifications queued");
				}

				const isTest = url.searchParams.has("test");
				if (isTest) {
					const type = url.searchParams.get("type");
					const dayOverride = url.searchParams.get("day") || undefined;

					if (!type) {
						return new Response("Missing type parameter", { status: 400 });
					}

					switch (type) {
						case "event-reminder":
							await triggerNotifications({ cron: "test" }, env, ctx, true, dayOverride);
							return new Response("Event reminder notifications triggered");
						case "daily-summary-morning":
							await triggerDailySummary({ cron: "test" }, env, ctx, true, false, dayOverride);
							return new Response("Morning summary notifications triggered");
						case "daily-summary-evening":
							await triggerDailySummary({ cron: "test" }, env, ctx, true, true, dayOverride);
							return new Response("Evening summary notifications triggered");
						case "schedule-change":
							await triggerScheduleChangeNotifications({ cron: "test" }, env, ctx, true);
							return new Response("Schedule change notifications triggered");
						case "room-status":
							await triggerRoomStatusNotifications({ cron: "test" }, env, ctx, true, dayOverride);
							return new Response("Room status notifications triggered");
						case "recording-available":
							await triggerRecordingNotifications({ cron: "test" }, env, ctx, true);
							return new Response("Recording notifications triggered");
						default:
							return new Response(`Unknown notification type: ${type}`, { status: 400 });
					}
				}

				await triggerNotifications({ cron: "fetch" }, env, ctx, true);
				return new Response("Notifications queued");
			} catch (error) {
				console.error("Error in fetch:", error);
				return new Response("Error in fetch", { status: 500 });
			}
		},
		// @ts-expect-error - CBA
		async scheduled(
			event: { cron: string },
			env: Env,
			ctx: ExecutionContext,
		): Promise<void> {
			const validation = validateEnv(env);
			if (!validation.ok) {
				console.error(`Missing required bindings: ${validation.missing.join(", ")}`);
				return;
			}

			// Morning summary at 8 AM UTC (9 AM Brussels)
			if (event.cron === "0 8 1,2 2 *") {
				await triggerDailySummary(event, env, ctx, true, false);
				return;
			}

			// Evening summary at 17:15 UTC (18:15 Brussels)
			if (event.cron === "15 17 1,2 2 *") {
				await triggerDailySummary(event, env, ctx, true, true);
				return;
			}

			// Room status polling (every 5 minutes during conference)
			if (event.cron === "*/5 * 1,2 2 *") {
				await pollAndStoreRoomStatus(env);
				await triggerRoomStatusNotifications(event, env, ctx, true);
				return;
			}

			// Daily cleanup at midnight
			if (event.cron === "0 0 * * *") {
				await cleanupOldRoomStatus(env);
				return;
			}

			// Recording notifications (hourly after conference)
			if (event.cron === "0 * * * *") {
				await triggerRecordingNotifications(event, env, ctx, true);
				return;
			}

			// Regular notifications for starting events (every 15 minutes)
			await triggerNotifications(event, env, ctx, true);
			await triggerScheduleChangeNotifications(event, env, ctx, true);
		},
		// @ts-ignore - CBA
		async queue(batch: MessageBatch<QueueMessage>, env: Env, ctx: ExecutionContext): Promise<void> {
			const validation = validateEnv(env);
			if (!validation.ok) {
				console.error(`Missing required bindings: ${validation.missing.join(", ")}`);
				return;
			}

			console.log(`Processing ${batch.messages.length} notifications`);

			const keys = await getApplicationKeys(env);
			const dedupe = new Map<string, number>();

			for (const message of batch.messages) {
				const dedupeKey = `${message.body?.bookmarkId ?? "unknown"}:${message.body?.notification?.title ?? "untitled"}`;
				const lastSentAt = dedupe.get(dedupeKey);
				const now = Date.now();
				if (lastSentAt && now - lastSentAt < DEDUPE_WINDOW_MS) {
					console.log("Skipping duplicate notification within window", { dedupeKey });
					continue;
				}

				dedupe.set(dedupeKey, now);

				try {
					for (let attempt = 0; attempt <= MAX_SEND_RETRIES; attempt++) {
						try {
							await sendNotification(message.body.subscription, message.body.notification, keys, env);
							break;
						} catch (error) {
							if (attempt === MAX_SEND_RETRIES) {
								console.error("Dead-lettering notification after retries", {
									bookmarkId: message.body.bookmarkId,
									error,
								});
								throw error;
							}

							await delay(RETRY_DELAY_MS * (attempt + 1));
						}
					}
					const shouldMarkSent = message.body.shouldMarkSent ?? true;

					if (shouldMarkSent) {
						await markNotificationSent(message.body.bookmarkId, env);
					}
				} catch (error) {
					console.error('Failed to process notification:', error);
				}
			}
		}
	} satisfies ExportedHandler<Env>,
);
