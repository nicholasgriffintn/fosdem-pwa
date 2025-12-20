import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

import { SignInForm } from "~/components/SignInForm";

const originalFetch = global.fetch;

describe("SignInForm", () => {
	beforeEach(() => {
		global.fetch = vi
			.fn()
			.mockResolvedValue({ ok: true }) as unknown as typeof fetch;
	});

	it("submits guest sign-in requests", async () => {
		render(<SignInForm />);

		const guestButton = screen.getByRole("button", {
			name: /continue as guest/i,
		});
		fireEvent.click(guestButton);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith("/api/auth/guest", {
				method: "POST",
				credentials: "include",
			});
		});
	});

	it("disables GitHub sign-in button while submitting", () => {
		render(<SignInForm />);

		const githubButton = screen.getByRole("button", {
			name: /sign in with github/i,
		});
		fireEvent.click(githubButton);

		expect(githubButton).toBeDisabled();
	});

	afterEach(() => {
		global.fetch = originalFetch;
	});
});
