import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class WatchLaterPage extends BasePage {
  async goto(path?: string) {
    const year = path ? parseInt(path, 10) || 2026 : 2026;
    await super.goto(`/watch-later?year=${year}&tab=all`);
  }

  async gotoYear(year = 2026) {
    await super.goto(`/watch-later?year=${year}&tab=all`);
  }

  async expectPageHeader() {
    await expect(this.page.getByRole("heading", { level: 1 })).toContainText(
      "Watch Later",
    );
  }

  async expectEmptyState() {
    await expect(
      this.page.getByText(/No recordings in your queue/i),
    ).toBeVisible();
  }

  async expectTabsVisible() {
    await expect(this.page.getByRole("tab", { name: /All/i })).toBeVisible();
    await expect(this.page.getByRole("tab", { name: /Unwatched/i })).toBeVisible();
    await expect(this.page.getByRole("tab", { name: /In Progress/i })).toBeVisible();
    await expect(this.page.getByRole("tab", { name: /Watched/i })).toBeVisible();
  }
}
