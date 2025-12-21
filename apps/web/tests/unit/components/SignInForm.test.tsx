import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SignInForm } from "~/components/SignInForm";

describe("SignInForm", () => {
	it("submits guest sign-in requests", async () => {
		render(<SignInForm />);

		const guestButton = screen.getByRole("button", {
			name: /continue as guest/i,
		});
		const guestForm = guestButton.closest("form");
		expect(guestForm).toBeTruthy();
		fireEvent.submit(guestForm as HTMLFormElement);

		await waitFor(() => {
			expect(guestButton).toBeDisabled();
		});
	});

	it("disables GitHub sign-in button while submitting", async () => {
		render(<SignInForm />);

		const githubButton = screen.getByRole("button", {
			name: /sign in with github/i,
		});
		const githubForm = githubButton.closest("form");
		expect(githubForm).toBeTruthy();
		fireEvent.submit(githubForm as HTMLFormElement);

		await waitFor(() => {
			expect(githubButton).toBeDisabled();
		});
	});
});
