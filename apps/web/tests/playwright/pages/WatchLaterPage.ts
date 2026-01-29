import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class WatchLaterPage extends BasePage {
  async goto(path?: string) {
    const year = path ? parseInt(path, 10) || 2026 : 2026;
    await super.goto(`/bookmarks?year=${year}&tab=watch-later`);
  }

  async gotoYear(year = 2026) {
    await super.goto(`/bookmarks?year=${year}&tab=watch-later`);
  }

  async expectPageHeader() {
    await expect(this.page.getByRole("heading", { level: 1 })).toContainText(
      "Bookmarks",
    );
  }

  async expectEmptyState() {
    await expect(
      this.page.getByRole("heading", { level: 2, name: "No bookmarks yet" }),
    ).toBeVisible();
  }

  async expectWatchLaterTabActive() {
    await expect(this.page.getByRole("link", { name: /Watch Later/i })).toHaveClass(/bg-background/);
  }
}
