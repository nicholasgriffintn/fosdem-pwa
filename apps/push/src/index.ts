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
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const MAX_SEND_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const getScheduledDate = (event: { scheduledTime?: number }) => {
	const scheduledTime = typeof event.scheduledTime === "number" ? event.scheduledTime : Date.now();
	const normalizedTime = Math.floor(scheduledTime / FIVE_MINUTES_MS) * FIVE_MINUTES_MS;
	return new Date(normalizedTime);
};

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

const isAuthorizedRequest = (request: Request, env: Env): boolean => {
	if (!env.CRON_SECRET) {
		return true;
	}

	const authHeader = request.headers.get("Authorization");
	const bearerToken = authHeader?.startsWith("Bearer ")
		? authHeader.slice("Bearer ".length).trim()
		: null;
	const headerToken = request.headers.get("x-cron-secret");

	return bearerToken === env.CRON_SECRET || headerToken === env.CRON_SECRET;
};

export default Sentry.withSentry(
	env => ({
		dsn: "https://2cbf756f8faa4cab906b2dc99df77f82@ingest.bitwobbly.com/8",
		tracesSampleRate: 1.0,
	}),
	{
		// @ts-expect-error - CBA
		async fetch(request: Request, env: Env, ctx: ExecutionContext) {
			const validation = validateEnv(env);
			if (!validation.ok) {
				return new Response(`Missing required bindings: ${validation.missing.join(", ")}`, { status: 500 });
			}

			if (!isAuthorizedRequest(request, env)) {
				return new Response("Unauthorized", { status: 401 });
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
			event: { cron: string; scheduledTime?: number },
			env: Env,
			ctx: ExecutionContext,
		): Promise<void> {
			const validation = validateEnv(env);
			if (!validation.ok) {
				console.error(`Missing required bindings: ${validation.missing.join(", ")}`);
				return;
			}

			const scheduledDate = getScheduledDate(event);
			const utcHours = scheduledDate.getUTCHours();
			const utcMinutes = scheduledDate.getUTCMinutes();

			const isMorningSummary = utcHours === 8 && utcMinutes === 0;
			const isEveningSummary = utcHours === 17 && utcMinutes === 15;
			const isQuarterHour = utcMinutes % 15 === 0;
			const isHourly = utcMinutes === 0;
			const isMidnight = utcHours === 0 && utcMinutes === 0;

			if (isMorningSummary) {
				await triggerDailySummary(event, env, ctx, true, false);
			}

			if (isEveningSummary) {
				await triggerDailySummary(event, env, ctx, true, true);
			}

			if (isMidnight) {
				await cleanupOldRoomStatus(env);
			}

			if (isHourly) {
				await triggerRecordingNotifications(event, env, ctx, true);
			}

			if (isQuarterHour) {
				await triggerNotifications(event, env, ctx, true);
				await triggerScheduleChangeNotifications(event, env, ctx, true);
			}

			await triggerRoomStatusNotifications(event, env, ctx, true);
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

							const backoffDelay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
							const jitter = Math.random() * 200;
							await delay(backoffDelay + jitter);
						}
					}
					const shouldMarkSent = message.body.shouldMarkSent ?? true;

					if (shouldMarkSent) {
						await markNotificationSent(message.body.bookmarkId, env);
					}
				} catch (error) {
					console.error('Failed to process notification:', {
						bookmarkId: message.body?.bookmarkId,
						title: message.body?.notification?.title,
						error: error instanceof Error ? error.message : String(error),
						attempts: message.attempts,
					});

					if (message.attempts < 5) {
						message.retry({ delaySeconds: Math.min(60 * Math.pow(2, message.attempts), 3600) });
					} else {
						console.error('Max retry attempts exceeded, dropping notification', {
							bookmarkId: message.body?.bookmarkId,
						});
					}
				}
			}
		}
	} satisfies ExportedHandler<Env>,
);
