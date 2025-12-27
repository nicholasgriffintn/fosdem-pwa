import { describe, expect, it } from "vitest";

import {
  isEvent,
  isTrack,
  hasBookmark,
  isValidYear,
  isString,
  isNumber,
  isNonEmptyString,
  isValidNote,
  isValidServerNote,
  isFavourited,
} from "~/lib/type-guards";
import type { Event, Track } from "~/types/fosdem";

describe("type-guards", () => {
  describe("isEvent", () => {
    it("returns true for event objects", () => {
      const event = {
        title: "My Talk",
        startTime: "10:00",
        id: "my-talk",
      } as Event;
      expect(isEvent(event)).toBe(true);
    });

    it("returns false for track objects", () => {
      const track = {
        name: "Go Devroom",
        eventCount: 10,
        id: "go-devroom",
      } as Track;
      expect(isEvent(track)).toBe(false);
    });
  });

  describe("isTrack", () => {
    it("returns true for track objects", () => {
      const track = {
        name: "Go Devroom",
        eventCount: 10,
        id: "go-devroom",
      } as Track;
      expect(isTrack(track)).toBe(true);
    });

    it("returns false for event objects", () => {
      const event = {
        title: "My Talk",
        startTime: "10:00",
        id: "my-talk",
      } as Event;
      expect(isTrack(event)).toBe(false);
    });
  });

  describe("hasBookmark", () => {
    const bookmarks = [
      { slug: "talk-1", status: "favourited" },
      { slug: "talk-2", status: "unfavourited" },
      { slug: "talk-3", status: "favourited" },
    ];

    it("returns true when item is favourited", () => {
      expect(hasBookmark({ id: "talk-1" }, bookmarks)).toBe(true);
      expect(hasBookmark({ id: "talk-3" }, bookmarks)).toBe(true);
    });

    it("returns false when item is not favourited", () => {
      expect(hasBookmark({ id: "talk-2" }, bookmarks)).toBe(false);
    });

    it("returns false when item is not in bookmarks", () => {
      expect(hasBookmark({ id: "talk-4" }, bookmarks)).toBe(false);
    });

    it("returns false for empty bookmarks array", () => {
      expect(hasBookmark({ id: "talk-1" }, [])).toBe(false);
    });
  });

  describe("isValidYear", () => {
    it("returns true for valid years", () => {
      expect(isValidYear(2000)).toBe(true);
      expect(isValidYear(2025)).toBe(true);
      expect(isValidYear(2100)).toBe(true);
    });

    it("returns false for years outside range", () => {
      expect(isValidYear(1999)).toBe(false);
      expect(isValidYear(2101)).toBe(false);
    });

    it("returns false for non-numbers", () => {
      expect(isValidYear("2025")).toBe(false);
      expect(isValidYear(null)).toBe(false);
      expect(isValidYear(undefined)).toBe(false);
      expect(isValidYear({})).toBe(false);
    });
  });

  describe("isString", () => {
    it("returns true for strings", () => {
      expect(isString("hello")).toBe(true);
      expect(isString("")).toBe(true);
    });

    it("returns false for non-strings", () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString({})).toBe(false);
      expect(isString([])).toBe(false);
    });
  });

  describe("isNumber", () => {
    it("returns true for numbers", () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-5)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
    });

    it("returns false for non-numbers", () => {
      expect(isNumber("123")).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
      expect(isNumber({})).toBe(false);
    });
  });

  describe("isNonEmptyString", () => {
    it("returns true for non-empty strings", () => {
      expect(isNonEmptyString("hello")).toBe(true);
      expect(isNonEmptyString(" ")).toBe(true);
    });

    it("returns false for empty strings", () => {
      expect(isNonEmptyString("")).toBe(false);
    });

    it("returns false for non-strings", () => {
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
    });
  });

  describe("isValidNote", () => {
    it("returns true for valid notes", () => {
      expect(
        isValidNote({ year: 2025, slug: "my-talk", note: "Great talk!" })
      ).toBe(true);
      expect(isValidNote({ year: 2025, slug: "my-talk", note: "" })).toBe(true);
    });

    it("returns false for invalid notes", () => {
      expect(isValidNote(null)).toBe(false);
      expect(isValidNote(undefined)).toBe(false);
      expect(isValidNote({})).toBe(false);
      expect(isValidNote({ year: 2025 })).toBe(false);
      expect(isValidNote({ year: 2025, slug: "my-talk" })).toBe(false);
      expect(isValidNote({ year: "2025", slug: "my-talk", note: "test" })).toBe(
        false
      );
      expect(isValidNote({ year: 2025, slug: "", note: "test" })).toBe(false);
      expect(isValidNote({ year: NaN, slug: "my-talk", note: "test" })).toBe(
        false
      );
    });
  });

  describe("isValidServerNote", () => {
    it("returns true for valid server notes", () => {
      expect(isValidServerNote({ id: 1, year: 2025, slug: "my-talk" })).toBe(
        true
      );
    });

    it("returns false for invalid server notes", () => {
      expect(isValidServerNote(null)).toBe(false);
      expect(isValidServerNote(undefined)).toBe(false);
      expect(isValidServerNote({})).toBe(false);
      expect(isValidServerNote({ id: 1, year: 2025 })).toBe(false);
      expect(isValidServerNote({ id: "1", year: 2025, slug: "my-talk" })).toBe(
        false
      );
      expect(isValidServerNote({ id: 1, year: 2025, slug: "" })).toBe(false);
    });
  });

  describe("isFavourited", () => {
    it("returns true when status is favourited", () => {
      expect(isFavourited({ slug: "talk", status: "favourited" })).toBe(true);
      expect(isFavourited({ status: "favourited" })).toBe(true);
    });

    it("returns false when status is not favourited", () => {
      expect(isFavourited({ slug: "talk", status: "unfavourited" })).toBe(false);
      expect(isFavourited({ status: "pending" })).toBe(false);
      expect(isFavourited({ status: "" })).toBe(false);
    });
  });
});
