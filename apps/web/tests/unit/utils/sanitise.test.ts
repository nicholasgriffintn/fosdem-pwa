import { describe, expect, it } from "vitest";

import { removeHTMLTags, sanitiseString } from "~/utils/sanitise";

describe("sanitise", () => {
  describe("removeHTMLTags", () => {
    it("removes simple HTML tags", () => {
      expect(removeHTMLTags("<p>Hello</p>")).toBe("Hello");
      expect(removeHTMLTags("<div>World</div>")).toBe("World");
    });

    it("removes multiple HTML tags", () => {
      expect(removeHTMLTags("<p>Hello</p><span>World</span>")).toBe(
        "HelloWorld"
      );
    });

    it("removes nested HTML tags", () => {
      expect(removeHTMLTags("<div><p>Hello</p></div>")).toBe("Hello");
    });

    it("removes tags with attributes", () => {
      expect(
        removeHTMLTags('<a href="https://example.com">Link</a>')
      ).toBe("Link");
      expect(
        removeHTMLTags('<div class="container" id="main">Content</div>')
      ).toBe("Content");
    });

    it("removes self-closing tags", () => {
      expect(removeHTMLTags("Hello<br/>World")).toBe("HelloWorld");
      expect(removeHTMLTags("Hello<br />World")).toBe("HelloWorld");
    });

    it("handles strings without HTML tags", () => {
      expect(removeHTMLTags("Hello World")).toBe("Hello World");
      expect(removeHTMLTags("")).toBe("");
    });

    it("handles complex HTML content", () => {
      const input =
        '<div class="talk"><h1>My Talk</h1><p>Description with <strong>bold</strong> text</p></div>';
      expect(removeHTMLTags(input)).toBe("My TalkDescription with bold text");
    });
  });

  describe("sanitiseString", () => {
    it("removes HTML tags from input", () => {
      expect(sanitiseString("<p>Hello</p>")).toBe("Hello");
    });

    it("returns empty string for falsy input", () => {
      expect(sanitiseString("")).toBe("");
    });

    it("handles plain text", () => {
      expect(sanitiseString("Hello World")).toBe("Hello World");
    });
  });
});
