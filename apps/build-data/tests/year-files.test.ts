import { describe, expect, it, vi } from "vitest";

import { createYearTemplate, ensureYearFiles } from "../src/lib/year-files";

describe("createYearTemplate", () => {
  it.each([
    ["2024", "2024-02-03", "2024-02-04"],
    ["2027", "2027-01-30", "2027-01-31"],
  ])("uses the FOSDEM weekend dates for %s", (year, firstDay, secondDay) => {
    const template = createYearTemplate(year);

    expect(template.conference).toMatchObject({
      start: firstDay,
      end: secondDay,
      days: [firstDay, secondDay],
    });
    expect(template.days["1"].date).toBe(firstDay);
    expect(template.days["2"].date).toBe(secondDay);
  });
});

describe("ensureYearFiles", () => {
  it("creates only missing files and preserves existing data", async () => {
    const head = vi.fn(async (key: string) =>
      key === "fosdem-2027-events.json" ? null : {}
    );
    const put = vi.fn();
    const logger = { info: vi.fn() };

    const template = await ensureYearFiles(
      { head, put },
      "2027",
      logger
    );

    expect(template).toBeNull();
    expect(put).toHaveBeenCalledTimes(1);
    expect(put).toHaveBeenCalledWith(
      "fosdem-2027-events.json",
      JSON.stringify({ events: {} }),
      expect.any(Object)
    );
  });
});
