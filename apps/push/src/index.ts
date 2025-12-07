import * as Sentry from "@sentry/cloudflare";

import { triggerNotifications, triggerTestNotification } from "./controllers/notifications";
import { triggerDailySummary } from "./controllers/daily-summary";
import { getApplicationKeys, sendNotification } from "./services/notifications";
import { markNotificationSent } from "./services/bookmarks";
import type { Env, QueueMessage } from "./types";

export default Sentry.withSentry(
	env => ({
		dsn: "https://b76a52be6f8677f808dca20da8fd8273@o4508599344365568.ingest.de.sentry.io/4508734021369936",
		// Set tracesSampleRate to 1.0 to capture 100% of spans for tracing.
		// Learn more at
		// https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
		tracesSampleRate: 1.0,
	}),
	{
		async fetch(request: Request, env: Env, ctx: ExecutionContext) {
			try {
				const url = new URL(request.url);
				const isTestMode = url.searchParams.has("test");
				const isDailySummary = url.searchParams.has("daily-summary");
				const isEveningSummary = url.searchParams.has("evening-summary");

				if (isTestMode) {
					await triggerTestNotification(env, ctx);
					return new Response("Test notification sent");
				}

				if (isDailySummary) {
					await triggerDailySummary({ cron: "fetch" }, env, ctx, true, false);
					return new Response("Morning summary notifications queued");
				}

				if (isEveningSummary) {
					await triggerDailySummary({ cron: "fetch" }, env, ctx, true, true);
					return new Response("Evening summary notifications queued");
				}

				await triggerNotifications({ cron: "fetch" }, env, ctx, true);
				return new Response("Notifications queued");
			} catch (error) {
				console.error("Error in fetch:", error);
				return new Response("Error in fetch", { status: 500 });
			}
		},
		async scheduled(
			event: { cron: string },
			env: Env,
			ctx: ExecutionContext,
		): Promise<void> {
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

			// Regular notifications for starting events (every 15 minutes)
			await triggerNotifications(event, env, ctx, true);
		},
		// @ts-ignore - CBA
		async queue(batch: MessageBatch<QueueMessage>, env: Env, ctx: ExecutionContext): Promise<void> {
			console.log(`Processing ${batch.messages.length} notifications`);

			const keys = await getApplicationKeys(env);

			for (const message of batch.messages) {
				try {
					await sendNotification(message.body.subscription, message.body.notification, keys, env);
					await markNotificationSent(message.body.bookmarkId, env);
				} catch (error) {
					console.error('Failed to process notification:', error);
				}
			}
		}
	} satisfies ExportedHandler<Env>,
);
