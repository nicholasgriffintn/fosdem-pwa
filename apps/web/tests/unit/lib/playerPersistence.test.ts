import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getPlayerState,
  savePlayerState,
  clearPlayerState,
} from "~/lib/playerPersistence";

describe("playerPersistence", () => {
  const mockLocalStorage = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };
  })();

  beforeEach(() => {
    vi.stubGlobal("localStorage", mockLocalStorage);
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getPlayerState", () => {
    it("returns default state when nothing is stored", () => {
      const state = getPlayerState();
      expect(state.eventSlug).toBeNull();
      expect(state.year).toBeNull();
      expect(state.currentTime).toBe(0);
      expect(state.volume).toBe(1);
      expect(state.isPlaying).toBe(false);
      expect(state.isMuted).toBe(false);
      expect(state.isMinimized).toBe(false);
      expect(state.streamUrl).toBeNull();
      expect(state.eventTitle).toBeNull();
      expect(state.isLive).toBe(false);
    });

    it("returns stored state merged with defaults", () => {
      const storedState = {
        eventSlug: "my-talk",
        year: 2025,
        currentTime: 120,
        isPlaying: true,
      };
      mockLocalStorage.setItem(
        "fosdem_player_state",
        JSON.stringify(storedState)
      );

      const state = getPlayerState();
      expect(state.eventSlug).toBe("my-talk");
      expect(state.year).toBe(2025);
      expect(state.currentTime).toBe(120);
      expect(state.isPlaying).toBe(true);
      expect(state.volume).toBe(1);
      expect(state.isMuted).toBe(false);
    });

    it("returns default state on JSON parse error", () => {
      mockLocalStorage.setItem("fosdem_player_state", "invalid json");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const state = getPlayerState();
      expect(state.eventSlug).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("savePlayerState", () => {
    it("saves partial state merged with current state", () => {
      savePlayerState({ eventSlug: "my-talk", isPlaying: true });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "fosdem_player_state",
        expect.any(String)
      );

      const savedState = JSON.parse(
        mockLocalStorage.setItem.mock.calls[0][1]
      );
      expect(savedState.eventSlug).toBe("my-talk");
      expect(savedState.isPlaying).toBe(true);
      expect(savedState.updatedAt).toBeDefined();
    });

    it("updates existing state", () => {
      const initialState = {
        eventSlug: "talk-1",
        year: 2025,
        currentTime: 60,
      };
      mockLocalStorage.setItem(
        "fosdem_player_state",
        JSON.stringify(initialState)
      );

      savePlayerState({ currentTime: 120 });

      const savedState = JSON.parse(
        mockLocalStorage.setItem.mock.calls[1][1]
      );
      expect(savedState.eventSlug).toBe("talk-1");
      expect(savedState.year).toBe(2025);
      expect(savedState.currentTime).toBe(120);
    });
  });

  describe("clearPlayerState", () => {
    it("resets state to defaults", () => {
      const initialState = {
        eventSlug: "my-talk",
        isPlaying: true,
        currentTime: 300,
      };
      mockLocalStorage.setItem(
        "fosdem_player_state",
        JSON.stringify(initialState)
      );

      clearPlayerState();

      expect(mockLocalStorage.setItem).toHaveBeenLastCalledWith(
        "fosdem_player_state",
        expect.any(String)
      );

      const clearedState = JSON.parse(
        mockLocalStorage.setItem.mock.calls[1][1]
      );
      expect(clearedState.eventSlug).toBeNull();
      expect(clearedState.isPlaying).toBe(false);
      expect(clearedState.currentTime).toBe(0);
    });
  });
});
