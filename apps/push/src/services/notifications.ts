import {
	ApplicationServerKeys,
	generatePushHTTPRequest,
	type PushSubscription,
} from "webpush-webcrypto";

import { constants } from "../constants";
import type {
	NotificationPayload,
	Subscription,
	EnrichedBookmark,
	Env,
	ScheduleSnapshot,
} from "../types";
import { trackPushNotificationSuccess, trackPushNotificationFailure } from "./analytics";

const PUSH_TTL_SECONDS = 60;
const FETCH_TIMEOUT_MS = 8000;

function minutesUntilStart(start: string, now = new Date()): number {
	const [hours, minutes] = start.split(":").map(Number);
	if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;

	const brusselsNow = new Date(
		now.toLocaleString("en-US", { timeZone: "Europe/Brussels" }),
	);
	const startTime = new Date(brusselsNow);
	startTime.setHours(hours, minutes, 0, 0);

	const diffMinutes =
		(startTime.getTime() - brusselsNow.getTime()) / (1000 * 60);
	if (!Number.isFinite(diffMinutes)) return 0;

	return Math.max(0, Math.ceil(diffMinutes));
}

export function createNotificationPayload(bookmark: EnrichedBookmark): NotificationPayload {
	const minutesUntil = minutesUntilStart(bookmark.startTime);

	return {
		title: "Event Starting Soon",
		body: `${bookmark.title} starts in ${minutesUntil} minutes in ${bookmark.room}`,
		url: `https://fosdempwa.com/event/${bookmark.slug}?year=${constants.YEAR}`,
	};
}

export function createDailySummaryPayload(bookmarks: EnrichedBookmark[], day: string, isEvening = false): NotificationPayload {
	if (!bookmarks.length) {
		return {
			title: `FOSDEM Day ${day} Summary`,
			body: "No events in your schedule today.",
			url: `https://fosdempwa.com/bookmarks?day=${day}&year=${constants.YEAR}`,
		};
	}

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

export function createScheduleChangePayload(
	bookmark: EnrichedBookmark,
	previous: ScheduleSnapshot | undefined,
): NotificationPayload {
	const previousTime = previous?.start_time ?? "an earlier time";
	const previousRoom = previous?.room ?? "a different room";

	return {
		title: "Schedule updated",
		body: `${bookmark.title} now starts at ${bookmark.startTime} in ${bookmark.room} (was ${previousTime} in ${previousRoom})`,
		url: `https://fosdempwa.com/event/${bookmark.slug}?year=${constants.YEAR}`,
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
		ttl: PUSH_TTL_SECONDS,
		urgency: "normal",
	});

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
	let result: Response;

	try {
		result = await fetch(endpoint, {
			method: "POST",
			headers,
			body,
			signal: controller.signal,
		});
	} finally {
		clearTimeout(timeout);
	}

	if (!result.ok) {
		const clonedResponse = result.clone();
		let errorDetails = "";
		try {
			const content = await result.json();
			errorDetails = JSON.stringify(content).slice(0, 500);
		} catch {
			errorDetails = (await clonedResponse.text()).slice(0, 500);
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