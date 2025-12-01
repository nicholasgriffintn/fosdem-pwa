import { describe, expect, it, vi } from "vitest";

import { cn, noop, on, off, isBrowser, isNavigator } from "~/lib/utils";

describe("utility helpers", () => {
	it("merges class names using tailwind-aware merge", () => {
		expect(cn("px-2", "px-4", { hidden: false }, "text-lg")).toBe(
			"px-4 text-lg",
		);
	});

	it("provides a noop function", () => {
		expect(noop()).toBeUndefined();
	});

	it("attaches and detaches DOM listeners", () => {
		const target = {
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		} as unknown as HTMLElement;

		const listener = () => undefined;
		on(target, "click", listener);
		expect(target.addEventListener).toHaveBeenCalledWith("click", listener);

		off(target, "click", listener);
		expect(target.removeEventListener).toHaveBeenCalledWith("click", listener);
	});

	it("exposes runtime browser flags", () => {
		expect(isBrowser).toBe(true);
		expect(isNavigator).toBe(true);
	});
});
