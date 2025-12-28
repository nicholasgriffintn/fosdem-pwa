import { createServerFn } from "@tanstack/react-start";

import { getAuthUser } from "~/server/lib/auth-middleware";
import { ok, err, type Result } from "~/server/lib/result";
import { findSubscriptionsByUser } from "~/server/repositories/subscription-repository";

type TestNotificationType =
	| "event-reminder"
	| "daily-summary-morning"
	| "daily-summary-evening"
	| "schedule-change"
	| "room-status"
	| "recording-available";

export const sendTestNotification = createServerFn({
	method: "POST",
})
	.inputValidator((data: {
		type: TestNotificationType;
		dayOverride?: "1" | "2";
	}) => data)
	.handler(async (ctx): Promise<Result<{ message: string }> | null> => {
		const { type, dayOverride } = ctx.data;

		const user = await getAuthUser();
		if (!user) {
			return null;
		}

		try {
			const subscriptions = await findSubscriptionsByUser(user.id);

			if (!subscriptions || subscriptions.length === 0) {
				return err("No active push subscriptions found. Please enable push notifications first.");
			}

			const pushServiceUrl = process.env.PUSH_SERVICE_URL || "https://push.fosdempwa.com";

			const url = new URL(pushServiceUrl);
			url.searchParams.set("test", "true");
			url.searchParams.set("type", type);
			if (dayOverride) {
				url.searchParams.set("day", dayOverride);
			}

			const response = await fetch(url.toString(), {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error("Push service error:", errorText);
				return err(`Failed to trigger test notification: ${response.statusText}`);
			}

			const responseText = await response.text();

			return ok({
				message: responseText,
			});
		} catch (error) {
			console.error("Error sending test notification:", error);
			return err(
				`Failed to send test notification: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	});
