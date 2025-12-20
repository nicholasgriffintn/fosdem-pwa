import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import useEffectOnce from "~/hooks/use-effect-once";

describe("useEffectOnce", () => {
	it("runs effect only once on mount", () => {
		const effect = vi.fn();

		const { rerender } = renderHook(() => useEffectOnce(effect));

		expect(effect).toHaveBeenCalledTimes(1);

		rerender();
		rerender();

		expect(effect).toHaveBeenCalledTimes(1);
	});

	it("runs cleanup function when returned from effect", () => {
		const cleanup = vi.fn();
		const effect = vi.fn(() => cleanup);

		const { unmount } = renderHook(() => useEffectOnce(effect));

		expect(effect).toHaveBeenCalledTimes(1);
		expect(cleanup).not.toHaveBeenCalled();

		unmount();

		expect(cleanup).toHaveBeenCalledTimes(1);
	});

	it("only runs once even in React Strict Mode", async () => {
		const effect = vi.fn();

		const { rerender } = renderHook(() => useEffectOnce(effect), {
			wrapper: StrictMode,
		});

		await waitFor(() => {
			expect(effect).toHaveBeenCalledTimes(1);
		});

		rerender();

		await waitFor(() => {
			expect(effect).toHaveBeenCalledTimes(1);
		});
	});

	it("runs cleanup only once even in Strict Mode", async () => {
		const cleanup = vi.fn();
		const effect = vi.fn(() => cleanup);

		const { unmount } = renderHook(() => useEffectOnce(effect), {
			wrapper: StrictMode,
		});

		await waitFor(() => {
			expect(effect).toHaveBeenCalledTimes(1);
		});

		unmount();

		await waitFor(() => {
			expect(cleanup).toHaveBeenCalledTimes(1);
		});
	});

	it("handles effects that perform async operations", async () => {
		const asyncCallback = vi.fn();
		const effect = vi.fn(() => {
			void (async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				asyncCallback();
			})();
		});

		renderHook(() => useEffectOnce(effect));

		await waitFor(() => {
			expect(asyncCallback).toHaveBeenCalledTimes(1);
		});
		expect(effect).toHaveBeenCalledTimes(1);
	});

	it("handles effects with dependencies correctly", () => {
		const effect = vi.fn();
		let value = "initial";

		const { rerender } = renderHook(() => {
			useEffectOnce(effect);
			return value;
		});

		expect(effect).toHaveBeenCalledTimes(1);

		value = "changed";
		rerender();

		expect(effect).toHaveBeenCalledTimes(1);
	});
});
