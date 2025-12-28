import { test } from "@playwright/test";
import { WatchLaterPage } from "../pages/WatchLaterPage";

test.describe("Watch Later tab in Bookmarks", () => {
	test("displays the bookmarks page header and empty state for unauthenticated users", async ({ page }) => {
		const watchLaterPage = new WatchLaterPage(page);
		await watchLaterPage.goto();
		await watchLaterPage.expectPageHeader();
		await watchLaterPage.expectWatchLaterTabActive();
		await watchLaterPage.expectEmptyState();
	});
});
