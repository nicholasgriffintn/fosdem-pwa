import type { Subscription, Env } from "../types";

export function trackPushNotificationSuccess(subscription: Subscription, env: Env) {
	env.ANALYTICS.writeDataPoint({
		blobs: [
			"success",
			String(subscription.user_id),
			subscription.endpoint,
		],
		doubles: [1],
		indexes: ["push_notification"],
	});
}

export function trackPushNotificationFailure(
	subscription: Subscription,
	error: string,
	env: Env
) {
	env.ANALYTICS.writeDataPoint({
		blobs: [
			"failure",
			String(subscription.user_id),
			subscription.endpoint,
			error,
		],
		doubles: [1],
		indexes: ["push_notification"],
	});
} 