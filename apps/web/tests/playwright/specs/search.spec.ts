import { test } from "@playwright/test";
import { SearchPage } from "../pages/SearchPage";

test.describe("Search experience", () => {
	test("navigates from header search and shows results sections", async ({
		page,
	}) => {
		const searchPage = new SearchPage(page);

		await searchPage.searchFromHeader();
		await searchPage.expectOnSearchPage();
		await searchPage.expectSearchParam("q", "keynote");
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

	test("shows empty state when no results match", async ({ page }) => {
		const searchPage = new SearchPage(page);

		await searchPage.goto("zzzznotfound");
		await searchPage.expectOnSearchPage("zzzznotfound");
		await searchPage.waitForResultsOrEmpty();
		await searchPage.expectEmptyState();
	});

	test("applies default year when none provided", async ({ page }) => {
		await page.goto("/search?q=keynote");

		const searchPage = new SearchPage(page);
		await searchPage.expectSearchParam("year", "2026");
	});
});
