import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useWindowSize } from "~/hooks/use-window-size";

describe("useWindowSize", () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  let rafCallback: FrameRequestCallback | null = null;

  beforeEach(() => {
    rafCallback = null;

    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });

    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {
      rafCallback = null;
    });

    Object.defineProperty(window, "innerWidth", {
      value: 1024,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 768,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      value: originalInnerWidth,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: originalInnerHeight,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it("returns initial values then updates after raf", () => {
    const { result } = renderHook(() => useWindowSize(100, 200));

    expect(result.current.width).toBe(100);
    expect(result.current.height).toBe(200);

    act(() => {
      if (rafCallback) rafCallback(0);
    });

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  it("updates on window resize after raf", () => {
    const { result } = renderHook(() => useWindowSize(0, 0));

    act(() => {
      if (rafCallback) rafCallback(0);
    });

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);

    act(() => {
      Object.defineProperty(window, "innerWidth", {
        value: 800,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, "innerHeight", {
        value: 600,
        writable: true,
        configurable: true,
      });
      window.dispatchEvent(new Event("resize"));
    });

    act(() => {
      if (rafCallback) rafCallback(0);
    });

    expect(result.current.width).toBe(800);
    expect(result.current.height).toBe(600);
  });
});
