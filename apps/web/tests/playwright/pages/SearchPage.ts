import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

const DEFAULT_QUERY = "keynote";
const DEFAULT_YEAR = 2026;

export class SearchPage extends BasePage {
	async goto(query = DEFAULT_QUERY, year = DEFAULT_YEAR) {
		await super.goto(`/search?year=${year}&q=${encodeURIComponent(query)}`);
	}

	private trackFilter() {
		return this.page.getByRole("combobox", { name: "Track" }).first();
	}

	private timeFilter() {
		return this.page.getByRole("combobox", { name: "Time slot" }).first();
	}

	async searchFromHeader(query = DEFAULT_QUERY, year = DEFAULT_YEAR) {
		await super.goto(`/?year=${year}`);

		await this.page.waitForLoadState("networkidle");

		const searchInput = this.page.getByPlaceholder("Search events...");
		await expect(searchInput).toBeVisible();

		await searchInput.click();
		await searchInput.fill(query);
		await expect(searchInput).toHaveValue(query);

		const suggestion = this.page
			.getByRole("button")
			.filter({ hasText: new RegExp(query, "i") });

		const suggestionVisible = await suggestion
			.first()
			.isVisible()
			.catch(() => false);

		if (suggestionVisible) {
			await suggestion.first().click();
		} else {
			await searchInput.press("Enter");
		}

		await this.page.waitForURL(/\/search/);
	}

	async expectOnSearchPage(query = DEFAULT_QUERY) {
		await expect(
			this.page.getByRole("heading", { level: 1, name: "Search" }),
		).toBeVisible();

		await expect(
			this.page.getByText(new RegExp(`Results for "${query}"`, "i")),
		).toBeVisible();
	}

	async expectFiltersReady() {
		const trackFilter = this.trackFilter();
		const timeFilter = this.timeFilter();

		await expect(trackFilter).toBeVisible();
		await expect(timeFilter).toBeVisible();

		await expect(trackFilter).toBeEnabled();
		await expect(timeFilter).toBeEnabled();
	}

	async waitForAnyResult() {
		const results = this.page.locator(
			".track-list li, .event-list li, .room-list li",
		);
		await expect(results.first()).toBeVisible();

		await expect(
			this.page.getByText(
				"No results match this search with the selected filters.",
			),
		).toBeHidden();
	}

	async waitForResultsOrEmpty() {
		const results = this.page.locator(
			".track-list li, .event-list li, .room-list li",
		);
		const emptyState = this.page.getByText(
			"No results match this search with the selected filters.",
		);

		await Promise.race([
			results.first().waitFor({ state: "visible" }),
			emptyState.waitFor({ state: "visible" }),
		]);
	}

	async expectResultSections() {
		const eventHeading = this.page.getByRole("heading", {
			name: "Event Results",
		});
		await expect(eventHeading).toBeVisible();
		await expect(this.page.locator(".event-list li").first()).toBeVisible({
		});

		const trackHeading = this.page.getByRole("heading", {
			name: "Track Results",
		});
		if (await trackHeading.count()) {
			await expect(trackHeading).toBeVisible();
			await expect(
				this.page.locator(".track-list li").first(),
			).toBeVisible();
		}

		const roomHeading = this.page.getByRole("heading", {
			name: "Room Results",
		});
		if (await roomHeading.count()) {
			await expect(roomHeading).toBeVisible();
			await expect(
				this.page.locator(".room-list li").first(),
			).toBeVisible();
		}
	}

	async expectEmptyState() {
		await expect(
			this.page.getByText("No results match this search with the selected filters."),
		).toBeVisible();
	}

	async selectFirstTrackOption() {
		const trigger = this.trackFilter();
		await expect(trigger).toBeEnabled();

		const options = trigger.locator("option");
		expect(await options.count()).toBeGreaterThan(1);

		const option = options.nth(1);
		const value = await option.getAttribute("value");
		const textContent = (await option.textContent()) || "";
		const selectedValue = (value || textContent).trim();

		await trigger.selectOption({ index: 1 });

		return selectedValue;
	}

	async selectFirstTimeOption() {
		const trigger = this.timeFilter();
		await expect(trigger).toBeEnabled();

		const options = trigger.locator("option");
		expect(await options.count()).toBeGreaterThan(1);

		const option = options.nth(1);
		const value = await option.getAttribute("value");
		const textContent = (await option.textContent()) || "";
		const selectedValue = (value || textContent).trim();

		await trigger.selectOption({ index: 1 });

		return selectedValue;
	}

	async expectSearchParam(key: string, value: string) {
		const url = new URL(this.page.url());
		const actual = url.searchParams.get(key);
		expect(actual).not.toBeNull();

		const normalize = (input: string) =>
			input.replace(/[^a-z0-9]/gi, "").toLowerCase();

		expect(normalize(actual!)).toBe(normalize(value));
	}
}
