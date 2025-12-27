import { describe, expect, it } from "vitest";

import { preserveYearSearch } from "~/lib/search-params";

describe("search-params", () => {
  describe("preserveYearSearch", () => {
    it("preserves year when it is a valid number", () => {
      const result = preserveYearSearch({ year: 2025 });
      expect(result).toEqual({ year: 2025 });
    });

    it("uses default year when year is not a number", () => {
      expect(preserveYearSearch({ year: "2025" })).toEqual({ year: 2026 });
      expect(preserveYearSearch({ year: null })).toEqual({ year: 2026 });
      expect(preserveYearSearch({ year: undefined })).toEqual({ year: 2026 });
    });

    it("uses default year when year is missing", () => {
      expect(preserveYearSearch({})).toEqual({ year: 2026 });
    });

    it("ignores other properties in the input", () => {
      const result = preserveYearSearch({
        year: 2024,
        q: "search",
        track: "go-devroom",
      });
      expect(result).toEqual({ year: 2024 });
    });
  });
});
