import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useUnmount from "~/hooks/use-unmount";

describe("useUnmount", () => {
  it("does not call callback on mount", () => {
    const callback = vi.fn();
    renderHook(() => useUnmount(callback));

    expect(callback).not.toHaveBeenCalled();
  });

  it("calls callback on unmount", () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useUnmount(callback));

    expect(callback).not.toHaveBeenCalled();

    unmount();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("uses the latest callback reference on unmount", () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { rerender, unmount } = renderHook(
      ({ fn }) => useUnmount(fn),
      { initialProps: { fn: callback1 } }
    );

    rerender({ fn: callback2 });

    unmount();

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});
