import { describe, expect, it } from "vitest";

import { enrichBookmarks } from "../src/lib/bookmarks";
import type { Bookmark, FosdemEvent } from "../src/types";

const bookmark = {
	id: "42_2026_4567",
	user_id: "42",
	slug: "4567",
	type: "bookmark_event",
	status: "favourited",
	year: 2026,
	priority: 1,
} as unknown as Bookmark;

// The generated FOSDEM payload gives every event its own `id`.
const events = {
	"4567": {
		id: "4567",
		day: "1",
		title: "Welcome to FOSDEM",
		type: "devroom",
		status: "running",
		track: "Keynotes",
		persons: ["Someone"],
		room: "Janson",
		startTime: "09:00",
		duration: "00:30",
	},
} as unknown as { [key: string]: FosdemEvent };

describe("enrichBookmarks", () => {
	it("keeps the bookmark's primary key rather than the FOSDEM event id", () => {
		const [enriched] = enrichBookmarks([bookmark], events);

		// Regression: `{...bookmark, ...event}` replaced the D1 primary key with
		// the event id, so markNotificationSent() matched zero rows, the
		// last_notification_sent_at stamp never landed, and the reminder was
		// re-sent on every scheduled run.
		expect(enriched?.id).toBe("42_2026_4567");
	});

	it("keeps the bookmark's own type and status", () => {
		const [enriched] = enrichBookmarks([bookmark], events);

		expect(enriched?.type).toBe("bookmark_event");
		expect(enriched?.status).toBe("favourited");
	});

	it("still copies the event details onto the bookmark", () => {
		const [enriched] = enrichBookmarks([bookmark], events);

		expect(enriched?.title).toBe("Welcome to FOSDEM");
		expect(enriched?.room).toBe("Janson");
		expect(enriched?.startTime).toBe("09:00");
		expect(enriched?.day).toBe("1");
	});

	it("skips bookmarks whose event is missing from the schedule", () => {
		const orphan = { ...bookmark, slug: "does-not-exist" } as unknown as Bookmark;

		expect(enrichBookmarks([orphan], events)).toEqual([]);
	});
});
