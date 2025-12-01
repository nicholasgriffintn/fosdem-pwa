import { test } from "@playwright/test";
import { SearchPage } from "../pages/SearchPage";

test.describe("Search experience", () => {
	test("lists relevant results for a known query", async ({ page }) => {
		const searchPage = new SearchPage(page);
		await searchPage.goto();
		await searchPage.expectResults();
	});
});
