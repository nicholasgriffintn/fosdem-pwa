import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class SignInPage extends BasePage {
	async goto() {
		await super.goto("/signin");
	}

	async expectAuthOptions() {
		await expect(
			this.page.getByRole("button", { name: /Sign in with GitHub/i }),
		).toBeVisible();
		await expect(
			this.page.getByRole("button", { name: /Continue as Guest/i }),
		).toBeVisible();
		await expect(this.page.getByText("What you'll be able to do")).toBeVisible();
	}
}
