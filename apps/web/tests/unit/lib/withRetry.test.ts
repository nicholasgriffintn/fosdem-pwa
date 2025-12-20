import { describe, expect, it, vi } from "vitest";

import { withRetry } from "~/lib/withRetry";

describe("withRetry", () => {
	it("retries transient failures and resolves once the function succeeds", async () => {
		vi.useFakeTimers();
		const task = vi
			.fn()
			.mockRejectedValueOnce(new Error("boom"))
			.mockResolvedValueOnce("ok");

		const resultPromise = withRetry(task, 3);
		const expectation = expect(resultPromise).resolves.toBe("ok");

		await vi.runAllTimersAsync();
		await expectation;
		expect(task).toHaveBeenCalledTimes(2);
		vi.useRealTimers();
	});

	it("throws the last error when the maximum amount of retries is reached", async () => {
		vi.useFakeTimers();
		const task = vi.fn().mockRejectedValue(new Error("persistent"));

		const resultPromise = withRetry(task, 2);
		const expectation = expect(resultPromise).rejects.toThrow("persistent");

		await vi.runAllTimersAsync();
		await expectation;
		expect(task).toHaveBeenCalledTimes(2);
		vi.useRealTimers();
	});

	it("translates AbortError failures into a timeout error", async () => {
		vi.useFakeTimers();
		const timeoutError = new Error("aborted");
		timeoutError.name = "AbortError";
		const task = vi.fn().mockRejectedValue(timeoutError);

		const resultPromise = withRetry(task, 1);
		const expectation = expect(resultPromise).rejects.toThrow("Request timed out");

		await vi.runAllTimersAsync();
		await expectation;
		expect(task).toHaveBeenCalledTimes(1);
		vi.useRealTimers();
	});
});
