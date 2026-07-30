import { describe, expect, it } from "vitest";

import { authenticationFailureRedirect } from "~/server/lib/auth-response";

describe("authenticationFailureRedirect", () => {
	it("returns callback failures to the sign-in UI without exposing details", () => {
		const response = authenticationFailureRedirect(
			new Request(
				"http://localhost/api/auth/callback/github?code=secret&state=secret",
			),
		);

		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe(
			"http://localhost/signin?authError=oauth_callback_failed",
		);
	});

	it("allows TanStack Start to merge event headers into redirects", () => {
		const response = authenticationFailureRedirect(
			new Request("http://localhost/api/auth/callback/github"),
		);

		expect(() => response.headers.set("Set-Cookie", "session=token")).not.toThrow();
		expect(response.headers.get("Set-Cookie")).toBe("session=token");
	});
});
