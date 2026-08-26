import * as Sentry from "@sentry/cloudflare";

import { triggerNotifications } from "./controllers/notifications";
import { triggerScheduleChangeNotifications } from "./controllers/schedule-changes";
import { triggerRoomStatusNotifications, pollAndStoreRoomStatus, cleanupOldRoomStatus } from "./controllers/room-status";
import { triggerRecordingNotifications } from "./controllers/recording-notifications";
import { triggerDailySummary } from "./controllers/daily-summary";
import { getApplicationKeys, sendNotification, ExpiredSubscriptionError } from "./lib/notifications";
import { markNotificationSent } from "./lib/bookmarks";
import { deleteSubscriptionByEndpoint } from "./lib/subscribers";
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
	// Fail closed. Previously a missing CRON_SECRET made every manual trigger
	// world-callable, including the ones that fan out to all subscribers.
	// `scheduled()` does not pass through here, so cron keeps working either way.
	if (!env.CRON_SECRET) {
		console.error("CRON_SECRET is not configured; rejecting manual trigger");
		return false;
	}

	const authHeader = request.headers.get("Authorization");
	const bearerToken = authHeader?.startsWith("Bearer ")
		? authHeader.slice("Bearer ".length).trim()
		: null;
	const headerToken = request.headers.get("x-cron-secret");

	return bearerToken === env.CRON_SECRET || headerToken === env.CRON_SECRET;
};

export default Sentry.withSentry<Env, QueueMessage>(
	env => ({
		dsn: "https://2cbf756f8faa4cab906b2dc99df77f82@ingest.bitwobbly.com/8",
		sampleRate: 1,
		enableLogs: false,
		tracesSampleRate: 0,
		beforeSend(event) {
			return event.exception?.values?.length ? event : null;
		},
		beforeSendTransaction() {
			return null;
		},
	}),
	{
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
					const userId = url.searchParams.get("userId") || undefined;

					if (!type) {
						return new Response("Missing type parameter", { status: 400 });
					}

					// A test must never fan out to the whole subscriber table.
					if (!userId) {
						return new Response("Missing userId parameter", { status: 400 });
					}

					switch (type) {
						case "event-reminder":
							await triggerNotifications({ cron: "test" }, env, ctx, true, dayOverride, userId);
							return new Response("Event reminder notifications triggered");
						case "daily-summary-morning":
							await triggerDailySummary({ cron: "test" }, env, ctx, true, false, dayOverride, userId);
							return new Response("Morning summary notifications triggered");
						case "daily-summary-evening":
							await triggerDailySummary({ cron: "test" }, env, ctx, true, true, dayOverride, userId);
							return new Response("Evening summary notifications triggered");
						case "schedule-change":
							await triggerScheduleChangeNotifications({ cron: "test" }, env, ctx, true, userId);
							return new Response("Schedule change notifications triggered");
						case "room-status":
							await triggerRoomStatusNotifications({ cron: "test" }, env, ctx, true, dayOverride, userId);
							return new Response("Room status notifications triggered");
						case "recording-available":
							await triggerRecordingNotifications({ cron: "test" }, env, ctx, true, userId);
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
			const isFiveMinute = utcMinutes % 5 === 0;
			const isHourly = utcMinutes === 0;
			const isMidnight = utcHours === 0 && utcMinutes === 0;

			// Each trigger is isolated: a failure in one must not stop the rest.
			// Previously an exception in triggerNotifications skipped schedule
			// changes and room status for the whole tick.
			const run = async (name: string, task: () => Promise<unknown>) => {
				try {
					await task();
				} catch (error) {
					console.error(
						`Scheduled task ${name} failed:`,
						error instanceof Error ? error.message : String(error),
					);
				}
			};

			if (isMorningSummary) {
				await run("daily-summary-morning", () => triggerDailySummary(event, env, ctx, true, false));
			}

			if (isEveningSummary) {
				await run("daily-summary-evening", () => triggerDailySummary(event, env, ctx, true, true));
			}

			if (isMidnight) {
				await run("cleanup-room-status", () => cleanupOldRoomStatus(env));
			}

			if (isHourly) {
				await run("recording-notifications", () => triggerRecordingNotifications(event, env, ctx, true));
			}

			if (isFiveMinute) {
				await run("event-reminders", () => triggerNotifications(event, env, ctx, true));
				await run("schedule-changes", () => triggerScheduleChangeNotifications(event, env, ctx, true));
			}

			await run("room-status", () => triggerRoomStatusNotifications(event, env, ctx, true));
		},
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
				if (!message.body) {
					console.error("Skipping queue message with empty body", { messageId: message.id });
					continue;
				}

				const subscriptionKey = message.body?.subscription?.user_id ?? message.body?.subscription?.endpoint ?? "unknown";
				const dedupeKey = `${subscriptionKey}:${message.body?.bookmarkId ?? "unknown"}:${message.body?.notification?.title ?? "untitled"}`;
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
							// A 404/410 means the endpoint is permanently gone. Retrying
							// it burns ~9 doomed requests per notification, forever.
							if (error instanceof ExpiredSubscriptionError) {
								console.log("Removing expired push subscription", {
									endpoint: new URL(error.endpoint).host,
								});
								await deleteSubscriptionByEndpoint(error.endpoint, env);
								throw error;
							}

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
				} catch (error) {
					console.error('Failed to process notification:', {
						bookmarkId: message.body?.bookmarkId,
						title: message.body?.notification?.title,
						error: error instanceof Error ? error.message : String(error),
						attempts: message.attempts,
					});

					// An expired subscription will never succeed, so do not retry it.
					if (!(error instanceof ExpiredSubscriptionError) && message.attempts < 5) {
						message.retry({ delaySeconds: Math.min(60 * Math.pow(2, message.attempts), 3600) });
					} else if (message.attempts >= 5) {
						console.error('Max retry attempts exceeded, dropping notification', {
							bookmarkId: message.body?.bookmarkId,
						});
					}

					continue;
				}

				// Recorded outside the send try/catch on purpose. The push has already
				// been delivered at this point; if the D1 write fails, retrying the
				// message would buzz the user a second time for the same event.
				const shouldMarkSent = message.body.shouldMarkSent ?? true;

				if (shouldMarkSent) {
					try {
						await markNotificationSent(message.body.bookmarkId, env);
					} catch (error) {
						console.error('Notification delivered but marking it sent failed:', {
							bookmarkId: message.body?.bookmarkId,
							error: error instanceof Error ? error.message : String(error),
						});
					}
				}
			}
		}
	} satisfies ExportedHandler<Env, QueueMessage>,
);
