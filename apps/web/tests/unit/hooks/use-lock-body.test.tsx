import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useLockBody } from "~/hooks/use-lock-body";

describe("useLockBody", () => {
  const originalOverflow = document.body.style.overflow;

  beforeEach(() => {
    document.body.style.overflow = "visible";
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      overflow: "visible",
    } as CSSStyleDeclaration);
  });

  afterEach(() => {
    document.body.style.overflow = originalOverflow;
    vi.restoreAllMocks();
  });

  it("does not lock body when shouldLock is false", () => {
    renderHook(() => useLockBody(false));

    expect(document.body.style.overflow).toBe("visible");
  });

  it("locks body when shouldLock is true", () => {
    renderHook(() => useLockBody(true));

    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores original overflow on unmount", () => {
    const { unmount } = renderHook(() => useLockBody(true));

    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe("visible");
  });

  it("toggles lock when shouldLock changes", () => {
    const { rerender } = renderHook(
      ({ shouldLock }) => useLockBody(shouldLock),
      { initialProps: { shouldLock: false } }
    );

    expect(document.body.style.overflow).toBe("visible");

    rerender({ shouldLock: true });
    expect(document.body.style.overflow).toBe("hidden");

    rerender({ shouldLock: false });
    expect(document.body.style.overflow).toBe("visible");
  });
});
