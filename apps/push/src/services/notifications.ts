import {
	ApplicationServerKeys,
	generatePushHTTPRequest,
	type PushSubscription,
} from "webpush-webcrypto";

import { constants } from "../constants";
import type { NotificationPayload, Subscription, EnrichedBookmark, Env } from "../types";
import { trackPushNotificationSuccess, trackPushNotificationFailure } from "./analytics";

export function createNotificationPayload(bookmark: EnrichedBookmark): NotificationPayload {
	const [hours, minutes] = bookmark.startTime.split(":").map(Number);
	const now = new Date();
	
	const startTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Brussels' }));
	startTime.setHours(hours, minutes, 0, 0);
	
	const brusselsNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Brussels' }));
	
	const minutesUntilStart = Math.ceil(
		(startTime.getTime() - brusselsNow.getTime()) / (1000 * 60)
	);

	return {
		title: "Event Starting Soon",
		body: `${bookmark.title} starts in ${minutesUntilStart} minutes in ${bookmark.room}`,
		url: `https://fosdempwa.com/event/${bookmark.slug}?year=${constants.YEAR}`,
	};
}

export function createDailySummaryPayload(bookmarks: EnrichedBookmark[], day: string, isEvening = false): NotificationPayload {
	const totalEvents = bookmarks.length;
	const firstEvent = bookmarks[0];
	const lastEvent = bookmarks[bookmarks.length - 1];
	
	if (isEvening) {
		return {
			title: `FOSDEM Day ${day} Wrap-up`,
			body: `You attended ${totalEvents} events today! See you ${day === "1" ? "tomorrow" : "next year"}! 🎉`,
			url: `https://fosdempwa.com/bookmarks?day=${day}&year=${constants.YEAR}`,
		};
	}
	
	return {
		title: `Your FOSDEM Day ${day} Summary`,
		body: `You have ${totalEvents} events today, starting from ${firstEvent.startTime} (${firstEvent.title}) until ${lastEvent.startTime} (${lastEvent.title})`,
		url: `https://fosdempwa.com/bookmarks?day=${day}&year=${constants.YEAR}`,
	};
}

export async function sendNotification(
	subscription: Subscription,
	notification: NotificationPayload,
	keys: ApplicationServerKeys,
	env: Env
) {
	const target: PushSubscription = {
		endpoint: subscription.endpoint,
		keys: {
			auth: subscription.auth,
			p256dh: subscription.p256dh,
		},
	};

	const { headers, body, endpoint } = await generatePushHTTPRequest({
		applicationServerKeys: keys,
		payload: JSON.stringify(notification),
		target,
		adminContact: constants.VAPID_EMAIL,
		ttl: 60,
		urgency: "normal",
	});

	const result = await fetch(endpoint, {
		method: "POST",
		headers,
		body,
	});

	if (!result.ok) {
		const clonedResponse = result.clone();
		let errorDetails = "";
		try {
			const content = await result.json();
			errorDetails = JSON.stringify(content);
		} catch {
			errorDetails = await clonedResponse.text();
		}
		const error = `HTTP error! status: ${result.status}, content: ${errorDetails}`;
		trackPushNotificationFailure(subscription, error, env);
		throw new Error(error);
	}

	trackPushNotificationSuccess(subscription, env);
	return result;
}

export async function getApplicationKeys(env: Env) {
	if (!constants.VAPID_EMAIL || !constants.VAPID_PUBLIC_KEY) {
		throw new Error("VAPID details not set");
	}

	if (!env.VAPID_PRIVATE_KEY) {
		throw new Error("VAPID private key not set");
	}

	return ApplicationServerKeys.fromJSON({
		publicKey: constants.VAPID_PUBLIC_KEY,
		privateKey: env.VAPID_PRIVATE_KEY,
	});
} 