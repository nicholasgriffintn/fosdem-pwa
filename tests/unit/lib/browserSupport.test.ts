import { describe, expect, it, afterEach } from "vitest";

import { shareSupported, clipboardSupported } from "~/lib/browserSupport";

describe("browser support helpers", () => {
	const originalNavigator = globalThis.navigator;

	afterEach(() => {
		if (originalNavigator) {
			Object.defineProperty(globalThis, "navigator", {
				value: originalNavigator,
				configurable: true,
			});
		}
	});

	it("detects support for navigator.share and navigator.canShare", () => {
		Object.defineProperty(globalThis, "navigator", {
			value: {
				share: () => undefined,
				canShare: () => true,
			},
			configurable: true,
		});

		expect(shareSupported()).toBe(true);
	});

	it("returns false if accessing navigator throws", () => {
		Object.defineProperty(globalThis, "navigator", {
			get() {
				throw new Error("no navigator");
			},
			configurable: true,
		});

		expect(shareSupported()).toBe(false);
		expect(clipboardSupported()).toBe(false);
	});

	it("detects clipboard api availability", () => {
		Object.defineProperty(globalThis, "navigator", {
			value: {
				clipboard: {},
			},
			configurable: true,
		});

		expect(clipboardSupported()).toBe(true);
	});
});
