import { describe, expect, it } from "vitest";

import type { FosdemEvent, FosdemEventLink } from "../src/types";

describe("recording notifications", () => {
  describe("hasVideoRecording", () => {
    it("returns true when event has video link", () => {
      const event: FosdemEvent = {
        day: "1",
        title: "Test Talk",
        type: "devroom",
        track: "Main",
        persons: ["Speaker"],
        room: "H.1302",
        startTime: "10:00",
        duration: "00:30",
        links: [
          { type: "video/webm", href: "https://video.fosdem.org/test.webm" },
        ],
      };

      const result = hasVideoRecording(event);
      expect(result.hasRecording).toBe(true);
      expect(result.url).toBe("https://video.fosdem.org/test.webm");
    });

    it("returns true for mp4 video type", () => {
      const event: FosdemEvent = {
        day: "1",
        title: "Test Talk",
        type: "devroom",
        track: "Main",
        persons: ["Speaker"],
        room: "H.1302",
        startTime: "10:00",
        duration: "00:30",
        links: [
          { type: "video/mp4", href: "https://video.fosdem.org/test.mp4" },
        ],
      };

      const result = hasVideoRecording(event);
      expect(result.hasRecording).toBe(true);
    });

    it("returns false when no video links", () => {
      const event: FosdemEvent = {
        day: "1",
        title: "Test Talk",
        type: "devroom",
        track: "Main",
        persons: ["Speaker"],
        room: "H.1302",
        startTime: "10:00",
        duration: "00:30",
        links: [{ type: "text/html", href: "https://fosdem.org/talk" }],
      };

      const result = hasVideoRecording(event);
      expect(result.hasRecording).toBe(false);
      expect(result.url).toBeUndefined();
    });

    it("returns false when links is undefined", () => {
      const event: FosdemEvent = {
        day: "1",
        title: "Test Talk",
        type: "devroom",
        track: "Main",
        persons: ["Speaker"],
        room: "H.1302",
        startTime: "10:00",
        duration: "00:30",
      };

      const result = hasVideoRecording(event);
      expect(result.hasRecording).toBe(false);
    });

    it("returns false when links is empty", () => {
      const event: FosdemEvent = {
        day: "1",
        title: "Test Talk",
        type: "devroom",
        track: "Main",
        persons: ["Speaker"],
        room: "H.1302",
        startTime: "10:00",
        duration: "00:30",
        links: [],
      };

      const result = hasVideoRecording(event);
      expect(result.hasRecording).toBe(false);
    });
  });

  describe("createRecordingAvailableNotification", () => {
    it("creates notification with correct content", () => {
      const notification = createRecordingAvailableNotification(
        "Introduction to Rust",
        "intro-rust"
      );

      expect(notification.title).toBe("Recording now available");
      expect(notification.body).toContain("Introduction to Rust");
      expect(notification.body).toContain("now available to watch");
      expect(notification.url).toContain("intro-rust");
      expect(notification.url).toContain("year=2025");
    });
  });

  describe("isEventMissed logic", () => {
    it("returns true when not attended and not watched", () => {
      const bookmark = {
        attended: false,
        watch_status: "unwatched",
        priority: 1,
      };

      const missed = isEventMissed(bookmark);
      expect(missed).toBe(true);
    });

    it("returns true when low priority", () => {
      const bookmark = {
        attended: true,
        watch_status: "watched",
        priority: 2,
      };

      const missed = isEventMissed(bookmark);
      expect(missed).toBe(true);
    });

    it("returns false when attended and high priority", () => {
      const bookmark = {
        attended: true,
        watch_status: "unwatched",
        priority: 1,
      };

      const missed = isEventMissed(bookmark);
      expect(missed).toBe(false);
    });

    it("returns false when watched and high priority", () => {
      const bookmark = {
        attended: false,
        watch_status: "watched",
        priority: 1,
      };

      const missed = isEventMissed(bookmark);
      expect(missed).toBe(false);
    });
  });
});

function hasVideoRecording(event: FosdemEvent): {
  hasRecording: boolean;
  url?: string;
} {
  const videoLink = event.links?.find((link) => link.type?.startsWith("video/"));

  return {
    hasRecording: !!videoLink,
    url: videoLink?.href,
  };
}

function createRecordingAvailableNotification(
  eventTitle: string,
  eventSlug: string
) {
  return {
    title: "Recording now available",
    body: `The recording for "${eventTitle}" is now available to watch.`,
    url: `https://fosdempwa.com/event/${eventSlug}?year=2025`,
  };
}

function isEventMissed(bookmark: {
  attended: boolean;
  watch_status: string;
  priority: number;
}): boolean {
  const notAttended = !bookmark.attended;
  const notWatched = bookmark.watch_status !== "watched";
  const isLowPriority = bookmark.priority > 1;

  return (notAttended && notWatched) || isLowPriority;
}
