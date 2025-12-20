import { describe, expect, it } from "vitest";

import { doesEventMatchTrack } from "~/lib/tracks";

describe("doesEventMatchTrack", () => {
	it("matches events against track ids", () => {
		expect(
			doesEventMatchTrack(
				{ trackKey: "devroom" } as any,
				{ id: "devroom", name: "Developer Room" } as any,
			),
		).toBe(true);
	});

	it("falls back to track names for legacy keys", () => {
		expect(
			doesEventMatchTrack(
				{ trackKey: "Developer Room" } as any,
				{ id: "devroom", name: "Developer Room" } as any,
			),
		).toBe(true);
	});

	it("returns false when identifiers do not match", () => {
		expect(
			doesEventMatchTrack(
				{ trackKey: "other" } as any,
				{ id: "devroom", name: "Developer Room" } as any,
			),
		).toBe(false);
	});
});
