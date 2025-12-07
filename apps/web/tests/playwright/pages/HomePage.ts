import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class HomePage extends BasePage {
	async goto(path?: string) {
		if (path) {
			await super.goto(path);
			return;
		}
		await super.goto("/?year=2026");
	}

	async gotoYear(year = 2026) {
		await super.goto(`/?year=${year}`);
	}

	async expectHeroDetails() {
		await expect(this.page.getByRole("heading", { level: 1 })).toContainText(
			"FOSDEM",
		);
		await expect(
			this.page.getByText(/Brussels/i, { exact: false }).first(),
		).toBeVisible();
	}

	async expectTypeCards() {
		const trackLinks = this.page.getByRole("link", { name: /View Tracks/i });
		const count = await trackLinks.count();
		expect(count).toBeGreaterThan(0);
	}
}
