import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SignInForm } from "~/components/Profile/SignInForm";

describe("SignInForm", () => {
	it("uses the shared auth flow and displays redirect failures", () => {
		render(
			<SignInForm initialError="Authentication could not be completed." />,
		);

		expect(
			document.querySelector('[data-auth-view="sign_in"]'),
		).toBeInTheDocument();
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Authentication could not be completed.",
		);
	});

	it("shows only the sign-in methods supported by FOSDEM", () => {
		render(<SignInForm />);

		expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /create an account/i }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /reset your password/i }),
		).not.toBeInTheDocument();
	});

	it("preserves the established provider styling and grouping", () => {
		render(<SignInForm />);

		expect(
			screen.getByRole("button", { name: /^sign in with mastodon$/i }),
		).toHaveClass("bg-indigo-600");
		expect(
			screen.getByRole("button", { name: /sign in with gitlab/i }),
		).toHaveClass("bg-[#C2410C]");
		expect(
			screen.getByRole("button", { name: /sign in with github/i }),
		).toHaveClass("bg-gray-900");
		expect(
			screen.getByRole("button", { name: /sign in with discord/i }),
		).toHaveClass("bg-[#5865F2]");
		expect(screen.getByText(/^or$/i)).toBeInTheDocument();
	});

	it("submits Mastodon instance selection through the shared endpoint", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(
				Response.json({
					status: "completed",
				}),
			);
		render(<SignInForm />);

		fireEvent.click(
			screen.getByRole("button", { name: /^sign in with mastodon$/i }),
		);
		fireEvent.change(screen.getByLabelText(/mastodon server/i), {
			target: { value: "mastodon.social" },
		});
		fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalledWith("/api/auth", {
				body: JSON.stringify({
					action: "start_oauth",
					provider: "mastodon",
					values: { server: "mastodon.social" },
				}),
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				method: "POST",
			});
		});
	});

	it("starts guest sign-in requests", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(Response.json({ status: "authenticated" }));
		render(<SignInForm />);

		const guestButton = screen.getByRole("button", {
			name: /continue as guest/i,
		});
		fireEvent.click(guestButton);

		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalledWith("/api/auth", {
				body: JSON.stringify({
					action: "start_oauth",
					provider: "guest",
				}),
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				method: "POST",
			});
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		});
	});

	it("disables GitHub sign-in button while submitting", async () => {
		render(<SignInForm />);

		const githubButton = screen.getByRole("button", {
			name: /sign in with github/i,
		});
		fireEvent.click(githubButton);
		expect(githubButton).toBeDisabled();
	});
});
