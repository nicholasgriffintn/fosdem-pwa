import { isRecord } from "@ngriffin_uk/auth-core";

const TURNSTILE_ACTION = "authentication";
const TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";
const TURNSTILE_VERIFY_ENDPOINT =
	"https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function resolveTurnstileSecret(
	environment: string,
	configuredSecret: string,
): string {
	return environment === "development"
		? TURNSTILE_TEST_SECRET_KEY
		: configuredSecret;
}

export interface TurnstileVerificationOptions {
	readonly token: string | undefined;
	readonly secret: string;
	readonly remoteIp?: string;
	readonly request?: typeof globalThis.fetch;
}

export async function verifyTurnstileToken({
	token,
	secret,
	remoteIp,
	request = globalThis.fetch,
}: TurnstileVerificationOptions): Promise<boolean> {
	if (!token || token.length > 2_048 || !secret) return false;
	const body = new URLSearchParams({
		secret,
		response: token,
	});
	if (remoteIp) body.set("remoteip", remoteIp);

	const response = await request(TURNSTILE_VERIFY_ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});
	if (!response.ok) return false;
	const result: unknown = await response.json();
	return (
		isRecord(result) &&
		result.success === true &&
		(result.action === TURNSTILE_ACTION ||
			(secret === TURNSTILE_TEST_SECRET_KEY && result.action === undefined))
	);
}
