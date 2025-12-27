import { describe, expect, it } from "vitest";

import { generateCommonSEOTags } from "~/utils/seo-generator";

describe("seo-generator", () => {
  describe("generateCommonSEOTags", () => {
    it("generates SEO tags with sanitised title and description", () => {
      const result = generateCommonSEOTags({
        title: "My Talk Title",
        description: "A description of the talk",
      });

      expect(result).toEqual([
        { title: "My Talk Title" },
        { name: "description", content: "A description of the talk" },
        { property: "og:title", content: "My Talk Title" },
        { property: "og:description", content: "A description of the talk" },
        { name: "twitter:title", content: "My Talk Title" },
        { name: "twitter:description", content: "A description of the talk" },
      ]);
    });

    it("sanitises HTML from title and description", () => {
      const result = generateCommonSEOTags({
        title: "<h1>My Talk</h1>",
        description: "<p>Description with <strong>HTML</strong></p>",
      });

      expect(result).toEqual([
        { title: "My Talk" },
        { name: "description", content: "Description with HTML" },
        { property: "og:title", content: "My Talk" },
        { property: "og:description", content: "Description with HTML" },
        { name: "twitter:title", content: "My Talk" },
        { name: "twitter:description", content: "Description with HTML" },
      ]);
    });

    it("handles empty strings", () => {
      const result = generateCommonSEOTags({
        title: "",
        description: "",
      });

      expect(result).toEqual([
        { title: "" },
        { name: "description", content: "" },
        { property: "og:title", content: "" },
        { property: "og:description", content: "" },
        { name: "twitter:title", content: "" },
        { name: "twitter:description", content: "" },
      ]);
    });

    it("returns all required meta tag types", () => {
      const result = generateCommonSEOTags({
        title: "Test",
        description: "Test description",
      });

      expect(result).toHaveLength(6);
      expect(result[0]).toHaveProperty("title");
      expect(result[1]).toHaveProperty("name", "description");
      expect(result[2]).toHaveProperty("property", "og:title");
      expect(result[3]).toHaveProperty("property", "og:description");
      expect(result[4]).toHaveProperty("name", "twitter:title");
      expect(result[5]).toHaveProperty("name", "twitter:description");
    });
  });
});
