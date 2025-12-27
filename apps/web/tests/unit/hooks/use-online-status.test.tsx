import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useOnlineStatus } from "~/hooks/use-online-status";

describe("useOnlineStatus", () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    Object.defineProperty(global, "navigator", {
      value: { onLine: true },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, "navigator", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it("returns true when online", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it("returns false when offline", () => {
    Object.defineProperty(global.navigator, "onLine", {
      value: false,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it("updates when online status changes", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => {
      Object.defineProperty(global.navigator, "onLine", {
        value: false,
        writable: true,
        configurable: true,
      });
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(global.navigator, "onLine", {
        value: true,
        writable: true,
        configurable: true,
      });
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current).toBe(true);
  });
});
