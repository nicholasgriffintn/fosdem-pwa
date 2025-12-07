import { test } from "@playwright/test";
import { SignInPage } from "../pages/SignInPage";

test.describe("Authentication entry points", () => {
	test("shows GitHub and guest options", async ({ page }) => {
		const signInPage = new SignInPage(page);
		await signInPage.goto();
		await signInPage.expectAuthOptions();
	});
});
