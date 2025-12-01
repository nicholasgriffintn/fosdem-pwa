import { test } from "@playwright/test";
import { HomePage } from "../pages/HomePage";

test.describe("Home experience", () => {
	test("displays the hero information and type cards", async ({ page }) => {
		const homePage = new HomePage(page);
		await homePage.goto();
		await homePage.expectHeroDetails();
		await homePage.expectTypeCards();
	});
});
