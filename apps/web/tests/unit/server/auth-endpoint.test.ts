import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
	createGuestSession: vi.fn(),
	setSessionTokenCookie: vi.fn(),
	signOut: vi.fn(),
}));
const oauth = vi.hoisted(() => ({
	oauthRequestOptions: vi.fn(() => ({})),
	startOAuthResult: vi.fn(),
}));
const turnstile = vi.hoisted(() => ({
	resolveTurnstileSecret: vi.fn(
		(_environment: string, configuredSecret: string) => configuredSecret,
	),
	verifyTurnstileToken: vi.fn(),
}));

vi.mock("~/server/auth", () => auth);
vi.mock("~/server/oauth", () => oauth);
vi.mock("~/server/lib/turnstile", () => turnstile);

import { handleAuthRequest } from "~/server/auth-endpoint";

describe("handleAuthRequest", () => {
	beforeEach(() => {
		auth.createGuestSession.mockReset();
		auth.setSessionTokenCookie.mockReset();
		auth.signOut.mockReset();
		oauth.oauthRequestOptions.mockClear();
		oauth.startOAuthResult.mockReset();
		turnstile.verifyTurnstileToken.mockReset();
		turnstile.verifyTurnstileToken.mockResolvedValue(true);
	});

	it("returns shared provider redirects from the central endpoint", async () => {
		oauth.startOAuthResult.mockResolvedValue({
			status: "redirect_required",
			provider: "github",
			url: "https://github.com/login/oauth/authorize",
		});

		const response = await handleAuthRequest(
			request({
				action: "start_oauth",
				provider: "github",
				values: { turnstileToken: "verified-token" },
			}),
		);

		expect(await response.json()).toEqual({
			status: "redirect_required",
			provider: "github",
			url: "https://github.com/login/oauth/authorize",
		});
		expect(oauth.startOAuthResult).toHaveBeenCalledWith("github", {});
	});

	it("starts guest upgrades through the central endpoint", async () => {
		oauth.oauthRequestOptions.mockReturnValueOnce({ upgrade: true });
		oauth.startOAuthResult.mockResolvedValue({
			status: "redirect_required",
			provider: "github",
			url: "https://github.com/login/oauth/authorize",
		});

		await handleAuthRequest(
			request({
				action: "start_oauth",
				provider: "github",
				values: { upgrade: "true", turnstileToken: "verified-token" },
			}),
		);

		expect(oauth.startOAuthResult).toHaveBeenCalledWith("github", {
			upgrade: true,
		});
	});

	it("creates guest sessions through the same endpoint", async () => {
		auth.createGuestSession.mockResolvedValue({
			token: "token",
			session: { expires_at: "2026-08-30T00:00:00.000Z" },
		});

		const response = await handleAuthRequest(
			request({
				action: "start_oauth",
				provider: "guest",
				values: { turnstileToken: "verified-token" },
			}),
		);

		expect(await response.json()).toEqual({ status: "authenticated" });
		expect(auth.setSessionTokenCookie).toHaveBeenCalledWith(
			"token",
			new Date("2026-08-30T00:00:00.000Z"),
		);
	});

	it("rejects unverified requests before creating users or OAuth state", async () => {
		turnstile.verifyTurnstileToken.mockResolvedValue(false);

		const response = await handleAuthRequest(
			request({ action: "start_oauth", provider: "guest", values: {} }),
		);

		expect(response.status).toBe(403);
		expect(auth.createGuestSession).not.toHaveBeenCalled();
		expect(oauth.startOAuthResult).not.toHaveBeenCalled();
	});

	it("signs out through the same endpoint", async () => {
		const response = await handleAuthRequest(request({ action: "sign_out" }));

		expect(await response.json()).toEqual({ status: "completed" });
		expect(auth.signOut).toHaveBeenCalledOnce();
	});
});

function request(body: unknown): Request {
	return new Request("http://localhost/api/auth", {
		body: JSON.stringify(body),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	});
}
