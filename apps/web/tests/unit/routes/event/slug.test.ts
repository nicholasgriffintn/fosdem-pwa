import { describe, expect, it } from "vitest";

import { resolveFavouriteStatus } from "~/routes/event/$slug";

describe("resolveFavouriteStatus", () => {
	it("returns loading when bookmark data is still loading and status unknown", () => {
		expect(
			resolveFavouriteStatus({
				bookmark: null,
				bookmarkLoading: true,
			}),
		).toBe("loading");
	});

	it("returns bookmark status even if loading flag is true", () => {
		expect(
			resolveFavouriteStatus({
				bookmark: { status: "favourited" },
				bookmarkLoading: true,
			}),
		).toBe("favourited");
	});

	it("returns unfavourited when no bookmark exists and not loading", () => {
		expect(
			resolveFavouriteStatus({
				bookmark: null,
				bookmarkLoading: false,
			}),
		).toBe("unfavourited");
	});

	it("falls back to unfavourited when bookmark has no status", () => {
		expect(
			resolveFavouriteStatus({
				bookmark: {},
				bookmarkLoading: false,
			}),
		).toBe("unfavourited");
	});
});
