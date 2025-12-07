import { test } from "@playwright/test";
import { SearchPage } from "../pages/SearchPage";

test.describe("Search experience", () => {
	test("navigates from header search and shows results sections", async ({
		page,
	}) => {
		const searchPage = new SearchPage(page);

		await searchPage.searchFromHeader();
		await searchPage.expectOnSearchPage();
		await searchPage.waitForAnyResult();
		await searchPage.expectFiltersReady();
		await searchPage.expectResultSections();
	});

	test("filters results by track and time", async ({ page }) => {
		const searchPage = new SearchPage(page);

		await searchPage.goto();
		await searchPage.expectOnSearchPage();
		await searchPage.waitForAnyResult();
		await searchPage.expectFiltersReady();

		const selectedTrack = await searchPage.selectFirstTrackOption();
		await searchPage.expectSearchParam("track", selectedTrack);
		await searchPage.waitForResultsOrEmpty();

		const selectedTime = await searchPage.selectFirstTimeOption();
		await searchPage.expectSearchParam("time", selectedTime);
		await searchPage.waitForResultsOrEmpty();
	});
});
