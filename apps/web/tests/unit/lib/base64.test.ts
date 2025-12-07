import { describe, expect, it, vi } from "vitest";

import { urlBase64ToUint8Array } from "~/lib/base64";

describe("urlBase64ToUint8Array", () => {
	it("decodes a base64 url-safe string using Buffer fallback", () => {
		const input = "SGVsbG8td29ybGQ";

		const result = urlBase64ToUint8Array(input);

		expect(Array.from(result)).toEqual(
			Array.from(Buffer.from("Hello-world", "utf-8")),
		);
	});

	it("prefers global atob implementation when available", () => {
		const originalAtob = globalThis.atob;
		const atobSpy = vi.fn(() => "OK");
		Object.defineProperty(globalThis, "atob", {
			value: atobSpy,
			configurable: true,
		});

		const result = urlBase64ToUint8Array("T0s");

		expect(atobSpy).toHaveBeenCalled();
		expect(Array.from(result)).toEqual([79, 75]);

		if (originalAtob) {
			Object.defineProperty(globalThis, "atob", {
				value: originalAtob,
				configurable: true,
			});
		} else {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete (globalThis as Record<string, unknown>).atob;
		}
	});
});
