import { describe, expect, it } from "vitest";

import { validatePushSubscription } from "~/server/lib/push-subscription";

const validKeys = { auth: "c2VjcmV0LWF1dGg", p256dh: "cDI1NmRoLWtleQ" };

describe("validatePushSubscription", () => {
	it.each([
		"https://updates.push.services.mozilla.com/wpush/v2/abc",
		"https://fcm.googleapis.com/fcm/send/abc",
		"https://web.push.apple.com/abc",
		"https://db5p.notify.windows.com/w/?token=abc",
	])("accepts the real push service endpoint %s", (endpoint) => {
		expect(validatePushSubscription({ endpoint, ...validKeys })).toEqual({ valid: true });
	});

	it("rejects a private-network endpoint", () => {
		const result = validatePushSubscription({
			endpoint: "http://10.0.0.5/admin",
			...validKeys,
		});

		expect(result).toEqual({ valid: false, reason: "Push endpoint must use https" });
	});

	it("rejects an arbitrary https host", () => {
		const result = validatePushSubscription({
			endpoint: "https://attacker.example.com/collect",
			...validKeys,
		});

		expect(result).toEqual({ valid: false, reason: "Unrecognised push service host" });
	});

	it("rejects a host that merely embeds an allowed host", () => {
		const result = validatePushSubscription({
			endpoint: "https://fcm.googleapis.com.attacker.example/x",
			...validKeys,
		});

		expect(result.valid).toBe(false);
	});

	it("rejects a malformed url", () => {
		const result = validatePushSubscription({ endpoint: "not-a-url", ...validKeys });

		expect(result).toEqual({ valid: false, reason: "Push endpoint is not a valid URL" });
	});

	it("rejects an oversized endpoint", () => {
		const result = validatePushSubscription({
			endpoint: `https://fcm.googleapis.com/fcm/send/${"a".repeat(2000)}`,
			...validKeys,
		});

		expect(result).toEqual({ valid: false, reason: "Push endpoint is too long" });
	});

	it.each(["auth", "p256dh"] as const)("rejects a missing %s key", (key) => {
		const result = validatePushSubscription({
			endpoint: "https://fcm.googleapis.com/fcm/send/abc",
			...validKeys,
			[key]: "",
		});

		expect(result).toEqual({ valid: false, reason: `Missing ${key} key` });
	});

	it("rejects keys that are not base64url", () => {
		const result = validatePushSubscription({
			endpoint: "https://fcm.googleapis.com/fcm/send/abc",
			...validKeys,
			auth: "not valid!",
		});

		expect(result).toEqual({ valid: false, reason: "auth key is not valid base64url" });
	});
});
