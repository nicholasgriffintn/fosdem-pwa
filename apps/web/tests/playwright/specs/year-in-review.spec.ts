import { test } from "@playwright/test";
import { YearInReviewPage } from "../pages/YearInReviewPage";

test.describe("Year in Review page", () => {
	test("redirects unauthenticated users to home", async ({ page }) => {
		const yearInReviewPage = new YearInReviewPage(page);
		await yearInReviewPage.goto();

		await page.waitForURL((url) => url.pathname === "/");
	});
});
