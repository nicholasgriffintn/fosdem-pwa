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

vi.mock("~/server/auth", () => auth);
vi.mock("~/server/oauth", () => oauth);

import { handleAuthRequest } from "~/server/auth-endpoint";

describe("handleAuthRequest", () => {
	beforeEach(() => {
		auth.createGuestSession.mockReset();
		auth.setSessionTokenCookie.mockReset();
		auth.signOut.mockReset();
		oauth.oauthRequestOptions.mockClear();
		oauth.startOAuthResult.mockReset();
	});

	it("returns shared provider redirects from the central endpoint", async () => {
		oauth.startOAuthResult.mockResolvedValue({
			status: "redirect_required",
			provider: "github",
			url: "https://github.com/login/oauth/authorize",
		});

		const response = await handleAuthRequest(
			request({ action: "start_oauth", provider: "github" }),
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
				values: { upgrade: "true" },
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
			request({ action: "start_oauth", provider: "guest" }),
		);

		expect(await response.json()).toEqual({ status: "authenticated" });
		expect(auth.setSessionTokenCookie).toHaveBeenCalledWith(
			"token",
			new Date("2026-08-30T00:00:00.000Z"),
		);
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
