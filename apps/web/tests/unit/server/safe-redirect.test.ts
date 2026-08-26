import { describe, expect, it } from "vitest";

import { safeReturnTo } from "~/server/lib/safe-redirect";

describe("safeReturnTo", () => {
	it("keeps a same-origin path", () => {
		expect(safeReturnTo("/bookmarks?year=2026")).toBe("/bookmarks?year=2026");
	});

	it("rejects a protocol-relative url", () => {
		expect(safeReturnTo("//evil.example.com")).toBe("/");
	});

	it("rejects a backslash-escaped url", () => {
		expect(safeReturnTo("/\\evil.example.com")).toBe("/");
	});

	it("rejects an absolute url", () => {
		expect(safeReturnTo("https://evil.example.com")).toBe("/");
	});

	it("rejects a scheme-relative javascript url", () => {
		expect(safeReturnTo("javascript:alert(1)")).toBe("/");
	});

	it.each([undefined, null, "", 42, {}])("falls back for %s", (value) => {
		expect(safeReturnTo(value)).toBe("/");
	});

	it("honours a custom fallback", () => {
		expect(safeReturnTo("//evil.example.com", "")).toBe("");
	});
});
