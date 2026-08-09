import { describe, expect, it, vi } from "vitest";

import {
	resolveTurnstileSecret,
	verifyTurnstileToken,
} from "~/server/lib/turnstile";

describe("Turnstile verification", () => {
	it("uses Cloudflare's test secret only for local development", () => {
		expect(resolveTurnstileSecret("development", "production-secret")).toBe(
			"1x0000000000000000000000000000000AA",
		);
		expect(resolveTurnstileSecret("production", "production-secret")).toBe(
			"production-secret",
		);
	});

	it("accepts a successful token for the authentication action", async () => {
		const request = vi
			.fn<typeof fetch>()
			.mockResolvedValue(
				Response.json({ success: true, action: "authentication" }),
			);

		await expect(
			verifyTurnstileToken({
				token: "verified-token",
				secret: "secret",
				remoteIp: "203.0.113.1",
				request,
			}),
		).resolves.toBe(true);
		const body = request.mock.calls[0]?.[1]?.body;
		expect(body).toBeInstanceOf(URLSearchParams);
		expect(String(body)).toContain("response=verified-token");
		expect(String(body)).toContain("remoteip=203.0.113.1");
	});

	it("accepts actionless responses only with Cloudflare's local test secret", async () => {
		const request = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(Response.json({ success: true }))
			.mockResolvedValueOnce(Response.json({ success: true }));
		const testSecret = resolveTurnstileSecret(
			"development",
			"production-secret",
		);

		await expect(
			verifyTurnstileToken({
				token: "XXXX.DUMMY.TOKEN.XXXX",
				secret: testSecret,
				request,
			}),
		).resolves.toBe(true);
		await expect(
			verifyTurnstileToken({
				token: "token-without-action",
				secret: "production-secret",
				request,
			}),
		).resolves.toBe(false);
	});

	it("rejects missing tokens and responses for another action", async () => {
		const request = vi
			.fn<typeof fetch>()
			.mockResolvedValue(
				Response.json({ success: true, action: "another-action" }),
			);

		await expect(
			verifyTurnstileToken({ token: undefined, secret: "secret", request }),
		).resolves.toBe(false);
		expect(request).not.toHaveBeenCalled();
		await expect(
			verifyTurnstileToken({
				token: "verified-token",
				secret: "secret",
				request,
			}),
		).resolves.toBe(false);
	});
});
