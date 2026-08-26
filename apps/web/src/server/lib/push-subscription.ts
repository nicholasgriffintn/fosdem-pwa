/**
 * Validation for Web Push subscription material supplied by the browser.
 *
 * The `endpoint` a client registers is later used verbatim as the target of a
 * `fetch(endpoint, { method: "POST" })` from the push worker. Without a check
 * here, any authenticated user could point that request at an arbitrary host
 * and turn the worker into a request forwarder.
 */

/** Hosts (or parent domains) operated by the browser vendors' push services. */
const ALLOWED_PUSH_HOSTS = [
	"push.services.mozilla.com",
	"fcm.googleapis.com",
	"android.googleapis.com",
	"notify.windows.com",
	"push.apple.com",
	"push.microsoft.com",
] as const;

/** Generous ceilings; real values are far shorter. */
const MAX_ENDPOINT_LENGTH = 1024;
const MAX_KEY_LENGTH = 256;

function isAllowedPushHost(hostname: string): boolean {
	const host = hostname.toLowerCase();

	return ALLOWED_PUSH_HOSTS.some(
		(allowed) => host === allowed || host.endsWith(`.${allowed}`),
	);
}

export type PushSubscriptionInput = {
	endpoint: string;
	auth: string;
	p256dh: string;
};

export type PushSubscriptionValidation =
	| { valid: true }
	| { valid: false; reason: string };

export function validatePushSubscription(
	input: PushSubscriptionInput,
): PushSubscriptionValidation {
	const { endpoint, auth, p256dh } = input;

	if (typeof endpoint !== "string" || endpoint.length === 0) {
		return { valid: false, reason: "Missing push endpoint" };
	}

	if (endpoint.length > MAX_ENDPOINT_LENGTH) {
		return { valid: false, reason: "Push endpoint is too long" };
	}

	let parsed: URL;
	try {
		parsed = new URL(endpoint);
	} catch {
		return { valid: false, reason: "Push endpoint is not a valid URL" };
	}

	if (parsed.protocol !== "https:") {
		return { valid: false, reason: "Push endpoint must use https" };
	}

	if (!isAllowedPushHost(parsed.hostname)) {
		return { valid: false, reason: "Unrecognised push service host" };
	}

	for (const [name, value] of [
		["auth", auth],
		["p256dh", p256dh],
	] as const) {
		if (typeof value !== "string" || value.length === 0) {
			return { valid: false, reason: `Missing ${name} key` };
		}

		if (value.length > MAX_KEY_LENGTH) {
			return { valid: false, reason: `${name} key is too long` };
		}

		// Web Push keys are transported as base64url.
		if (!/^[A-Za-z0-9_-]+=*$/.test(value)) {
			return { valid: false, reason: `${name} key is not valid base64url` };
		}
	}

	return { valid: true };
}
