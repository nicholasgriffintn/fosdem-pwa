import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import useRefState from "~/hooks/use-ref-state";

describe("useRefState", () => {
  let rafCallback: FrameRequestCallback | null = null;
  let rafId = 0;

  beforeEach(() => {
    rafCallback = null;
    rafId = 0;

    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallback = cb;
      rafId += 1;
      return rafId;
    });

    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {
      rafCallback = null;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => useRefState("initial"));

    expect(result.current[0]).toBe("initial");
  });

  it("returns initial state from function", () => {
    const { result } = renderHook(() => useRefState(() => "computed"));

    expect(result.current[0]).toBe("computed");
  });

  it("updates state via requestAnimationFrame", () => {
    const { result } = renderHook(() => useRefState(0));

    expect(result.current[0]).toBe(0);

    act(() => {
      result.current[1](42);
    });

    expect(result.current[0]).toBe(0);

    act(() => {
      if (rafCallback) rafCallback(0);
    });

    expect(result.current[0]).toBe(42);
  });

  it("supports functional updates", () => {
    const { result } = renderHook(() => useRefState(10));

    act(() => {
      result.current[1]((prev) => prev + 5);
    });

    act(() => {
      if (rafCallback) rafCallback(0);
    });

    expect(result.current[0]).toBe(15);
  });

  it("cancels pending animation frame on new update", () => {
    const { result } = renderHook(() => useRefState(0));

    act(() => {
      result.current[1](1);
    });

    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);

    act(() => {
      result.current[1](2);
    });

    expect(window.cancelAnimationFrame).toHaveBeenCalled();
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(2);
  });

  it("cancels animation frame on unmount", () => {
    const { result, unmount } = renderHook(() => useRefState(0));

    act(() => {
      result.current[1](1);
    });

    unmount();

    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });
});
