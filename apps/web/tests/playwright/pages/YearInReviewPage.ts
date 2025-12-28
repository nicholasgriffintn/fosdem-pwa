import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class YearInReviewPage extends BasePage {
  async goto(path?: string) {
    const year = path ? parseInt(path, 10) || 2026 : 2026;
    await super.goto(`/profile/year-in-review?year=${year}`);
  }

  async gotoYear(year = 2026) {
    await super.goto(`/profile/year-in-review?year=${year}`);
  }

  async expectPageHeader() {
    await expect(this.page.getByRole("heading", { level: 1 })).toContainText(
      "Year in Review",
    );
  }

  async expectYearSelector() {
    await expect(this.page.getByRole("button", { name: "2025" })).toBeVisible();
    await expect(this.page.getByRole("button", { name: "2026" })).toBeVisible();
  }

  async expectRefreshButton() {
    await expect(
      this.page.getByRole("button", { name: /Refresh Stats/i }),
    ).toBeVisible();
  }
}
