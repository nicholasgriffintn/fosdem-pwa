import { describe, expect, it, vi, beforeEach } from "vitest";

describe("room status", () => {
  describe("getRoomTrend calculation", () => {
    it("returns 'filling' when recent history shows increasing fullness", () => {
      // >60% full overall (7/10), and recent half has more full than older half
      const history = [
        { state: "1", recorded_at: "2025-02-01T10:00:00Z" },
        { state: "1", recorded_at: "2025-02-01T09:55:00Z" },
        { state: "1", recorded_at: "2025-02-01T09:50:00Z" },
        { state: "1", recorded_at: "2025-02-01T09:45:00Z" },
        { state: "1", recorded_at: "2025-02-01T09:40:00Z" },
        { state: "1", recorded_at: "2025-02-01T09:35:00Z" },
        { state: "1", recorded_at: "2025-02-01T09:30:00Z" },
        { state: "0", recorded_at: "2025-02-01T09:25:00Z" },
        { state: "0", recorded_at: "2025-02-01T09:20:00Z" },
        { state: "0", recorded_at: "2025-02-01T09:15:00Z" },
      ];

      const trend = calculateTrend(history);
      expect(trend).toBe("filling");
    });

    it("returns 'emptying' when recent history shows decreasing fullness", () => {
      // >60% available overall (7/10), and recent half has more available than older half
      const history = [
        { state: "0", recorded_at: "2025-02-01T10:00:00Z" },
        { state: "0", recorded_at: "2025-02-01T09:55:00Z" },
        { state: "0", recorded_at: "2025-02-01T09:50:00Z" },
        { state: "0", recorded_at: "2025-02-01T09:45:00Z" },
        { state: "0", recorded_at: "2025-02-01T09:40:00Z" },
        { state: "0", recorded_at: "2025-02-01T09:35:00Z" },
        { state: "0", recorded_at: "2025-02-01T09:30:00Z" },
        { state: "1", recorded_at: "2025-02-01T09:25:00Z" },
        { state: "1", recorded_at: "2025-02-01T09:20:00Z" },
        { state: "1", recorded_at: "2025-02-01T09:15:00Z" },
      ];

      const trend = calculateTrend(history);
      expect(trend).toBe("emptying");
    });

    it("returns 'stable' when status is consistent", () => {
      const history = [
        { state: "1", recorded_at: "2025-02-01T10:00:00Z" },
        { state: "0", recorded_at: "2025-02-01T09:55:00Z" },
        { state: "1", recorded_at: "2025-02-01T09:50:00Z" },
        { state: "0", recorded_at: "2025-02-01T09:45:00Z" },
        { state: "1", recorded_at: "2025-02-01T09:40:00Z" },
        { state: "0", recorded_at: "2025-02-01T09:35:00Z" },
      ];

      const trend = calculateTrend(history);
      expect(trend).toBe("stable");
    });

    it("returns 'unknown' when insufficient data", () => {
      const history = [{ state: "1", recorded_at: "2025-02-01T10:00:00Z" }];

      const trend = calculateTrend(history);
      expect(trend).toBe("unknown");
    });

    it("returns 'unknown' for empty history", () => {
      const trend = calculateTrend([]);
      expect(trend).toBe("unknown");
    });
  });

  describe("room filling notification", () => {
    it("creates notification with correct content", () => {
      const notification = createRoomFillingNotification(
        "Introduction to Rust",
        "H.1302",
        "10:00",
        "intro-rust"
      );

      expect(notification.title).toBe("Room filling up");
      expect(notification.body).toContain("H.1302");
      expect(notification.body).toContain("Introduction to Rust");
      expect(notification.body).toContain("10:00");
      expect(notification.url).toContain("intro-rust");
    });
  });
});

type RoomTrend = "filling" | "emptying" | "stable" | "unknown";

function calculateTrend(
  history: Array<{ state: string; recorded_at: string }>
): RoomTrend {
  if (!history || history.length < 2) {
    return "unknown";
  }

  const total = history.length;
  const fullCount = history.filter((h) => h.state === "1").length;

  if (fullCount / total > 0.6) {
    const recentHalf = history.slice(0, Math.floor(total / 2));
    const olderHalf = history.slice(Math.floor(total / 2));
    const recentFullRate =
      recentHalf.filter((h) => h.state === "1").length / recentHalf.length;
    const olderFullRate =
      olderHalf.filter((h) => h.state === "1").length / olderHalf.length;

    if (recentFullRate > olderFullRate) {
      return "filling";
    }
  }

  const availableCount = history.filter((h) => h.state !== "1").length;
  if (availableCount / total > 0.6) {
    const recentHalf = history.slice(0, Math.floor(total / 2));
    const olderHalf = history.slice(Math.floor(total / 2));
    const recentAvailableRate =
      recentHalf.filter((h) => h.state !== "1").length / recentHalf.length;
    const olderAvailableRate =
      olderHalf.filter((h) => h.state !== "1").length / olderHalf.length;

    if (recentAvailableRate > olderAvailableRate) {
      return "emptying";
    }
  }

  return "stable";
}

function createRoomFillingNotification(
  eventTitle: string,
  room: string,
  startTime: string,
  eventSlug: string
) {
  return {
    title: "Room filling up",
    body: `${room} is filling up! Your event "${eventTitle}" starts at ${startTime}. Consider arriving early.`,
    url: `https://fosdempwa.com/event/${eventSlug}?year=2025`,
  };
}
