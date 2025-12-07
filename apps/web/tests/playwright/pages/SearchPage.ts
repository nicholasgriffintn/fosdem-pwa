import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class SearchPage extends BasePage {
	async goto(query = "keynote", year = 2026) {
		await super.goto(`/search?year=${year}&q=${encodeURIComponent(query)}`);
	}

	async expectResults() {
		await expect(
			this.page.getByRole("heading", { name: /Search Results/ }),
		).toContainText("Search Results");

		await expect(
			this.page.getByRole("heading", { name: "Track Results" }),
		).toBeVisible();

		const trackItems = this.page.locator(".track-list li");
		expect(await trackItems.count()).toBeGreaterThan(0);
	}
}
