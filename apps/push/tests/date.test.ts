import { afterEach, describe, expect, it, vi } from "vitest";

import { createBrusselsDate, getCurrentDate } from "../src/utils/date";

describe("date utilities", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("normalizes date to Brussels timezone", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2025-02-01T23:30:00Z"));

		const brusselsDate = createBrusselsDate();

		expect(brusselsDate.toISOString()).toBe("2025-02-02T00:30:00.000Z");
	});

	it("returns midnight ISO string for current Brussels day", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2025-02-01T12:00:00Z"));

		const today = getCurrentDate();

		expect(today.startsWith("2025-02-01T00:00:00.000Z")).toBe(true);
	});
});
