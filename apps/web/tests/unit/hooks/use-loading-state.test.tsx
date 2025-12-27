import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useLoadingState } from "~/hooks/use-loading-state";

describe("useLoadingState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false initially when not loading", () => {
    const { result } = renderHook(() => useLoadingState(false));
    expect(result.current).toBe(false);
  });

  it("returns false initially when loading (before delay)", () => {
    const { result } = renderHook(() => useLoadingState(true));
    expect(result.current).toBe(false);
  });

  it("returns true after default delay when loading", () => {
    const { result } = renderHook(() => useLoadingState(true));

    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe(true);
  });

  it("respects custom delay", () => {
    const { result } = renderHook(() => useLoadingState(true, 500));

    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe(true);
  });

  it("resets to false when loading becomes false", () => {
    const { result, rerender } = renderHook(
      ({ isLoading }) => useLoadingState(isLoading),
      { initialProps: { isLoading: true } }
    );

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe(true);

    rerender({ isLoading: false });
    expect(result.current).toBe(false);
  });

  it("clears timeout when loading becomes false before delay", () => {
    const { result, rerender } = renderHook(
      ({ isLoading }) => useLoadingState(isLoading),
      { initialProps: { isLoading: true } }
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(false);

    rerender({ isLoading: false });

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe(false);
  });
});
