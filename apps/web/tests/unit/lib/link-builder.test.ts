import { describe, expect, it } from "vitest";

import {
  buildRoomLink,
  buildSearchLink,
  buildEventLink,
  buildTrackLink,
  buildHomeLink,
  buildBookmarksLink,
  buildProfileLink,
} from "~/lib/link-builder";

describe("link-builder", () => {
  describe("buildRoomLink", () => {
    it("builds a room link with default year", () => {
      const result = buildRoomLink("H1302");
      expect(result).toEqual({
        to: "/rooms/$roomId",
        params: { roomId: "H1302" },
        search: {
          year: 2026,
          day: undefined,
          sortFavourites: undefined,
        },
      });
    });

    it("builds a room link with custom year and day", () => {
      const result = buildRoomLink("K1105", { year: 2025, day: "saturday" });
      expect(result).toEqual({
        to: "/rooms/$roomId",
        params: { roomId: "K1105" },
        search: {
          year: 2025,
          day: "saturday",
          sortFavourites: undefined,
        },
      });
    });

    it("builds a room link with sortFavourites option", () => {
      const result = buildRoomLink("J1", { sortFavourites: "true" });
      expect(result).toEqual({
        to: "/rooms/$roomId",
        params: { roomId: "J1" },
        search: {
          year: 2026,
          day: undefined,
          sortFavourites: "true",
        },
      });
    });
  });

  describe("buildSearchLink", () => {
    it("builds a search link with default values", () => {
      const result = buildSearchLink({});
      expect(result).toEqual({
        to: "/search",
        search: {
          year: 2026,
          q: "",
          track: undefined,
          time: undefined,
          type: "all",
        },
      });
    });

    it("builds a search link with query and filters", () => {
      const result = buildSearchLink({
        year: 2025,
        q: "rust",
        track: "rust-devroom",
        time: "morning",
        type: "devroom",
      });
      expect(result).toEqual({
        to: "/search",
        search: {
          year: 2025,
          q: "rust",
          track: "rust-devroom",
          time: "morning",
          type: "devroom",
        },
      });
    });
  });

  describe("buildEventLink", () => {
    it("builds an event link with default options", () => {
      const result = buildEventLink("my-talk-slug");
      expect(result).toEqual({
        to: "/event/$slug",
        params: { slug: "my-talk-slug" },
        search: {
          year: 2026,
          test: false,
        },
      });
    });

    it("builds an event link with custom year and test flag", () => {
      const result = buildEventLink("another-talk", { year: 2024, test: true });
      expect(result).toEqual({
        to: "/event/$slug",
        params: { slug: "another-talk" },
        search: {
          year: 2024,
          test: true,
        },
      });
    });
  });

  describe("buildTrackLink", () => {
    it("builds a track link with default options", () => {
      const result = buildTrackLink("go-devroom");
      expect(result).toEqual({
        to: "/track/$slug",
        params: { slug: "go-devroom" },
        search: {
          year: 2026,
          day: undefined,
          view: undefined,
          sortFavourites: undefined,
        },
      });
    });

    it("builds a track link with all options", () => {
      const result = buildTrackLink("rust-devroom", {
        year: 2025,
        day: "sunday",
        view: "list",
        sortFavourites: "true",
      });
      expect(result).toEqual({
        to: "/track/$slug",
        params: { slug: "rust-devroom" },
        search: {
          year: 2025,
          day: "sunday",
          view: "list",
          sortFavourites: "true",
        },
      });
    });
  });

  describe("buildHomeLink", () => {
    it("builds a home link with default year", () => {
      const result = buildHomeLink();
      expect(result).toEqual({
        to: "/",
        search: {
          year: 2026,
        },
      });
    });

    it("builds a home link with custom year", () => {
      const result = buildHomeLink({ year: 2023 });
      expect(result).toEqual({
        to: "/",
        search: {
          year: 2023,
        },
      });
    });
  });

  describe("buildBookmarksLink", () => {
    it("builds a bookmarks link with default year", () => {
      const result = buildBookmarksLink();
      expect(result).toEqual({
        to: "/bookmarks",
        search: {
          year: 2026,
          tab: "events",
        },
      });
    });

    it("builds a bookmarks link with custom year", () => {
      const result = buildBookmarksLink({ year: 2024 });
      expect(result).toEqual({
        to: "/bookmarks",
        search: {
          year: 2024,
          tab: "events",
        },
      });
    });
  });

  describe("buildProfileLink", () => {
    it("builds a profile link with default year", () => {
      const result = buildProfileLink();
      expect(result).toEqual({
        to: "/profile",
        search: {
          year: 2026,
          tab: "events",
        },
      });
    });

    it("builds a profile link with custom year", () => {
      const result = buildProfileLink({ year: 2022 });
      expect(result).toEqual({
        to: "/profile",
        search: {
          year: 2022,
          tab: "events",
        },
      });
    });
  });
});
