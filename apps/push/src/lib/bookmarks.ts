import { constants } from "../constants";
import { createBrusselsDate } from "../utils/date";
import type { FosdemEvent, Bookmark, EnrichedBookmark, Env } from "../types";

interface GetUserBookmarksOptions {
	includeSent?: boolean;
}

export async function getUserBookmarks(
	userId: string,
	env: Env,
	{ includeSent = false }: GetUserBookmarksOptions = {},
): Promise<Bookmark[]> {
	const baseQuery =
		"SELECT id, user_id, type, status, year, slug, priority FROM bookmark WHERE user_id = ? AND type = 'bookmark_event' AND status = 'favourited' AND year = ?";

	const query = includeSent
		? baseQuery
		: `${baseQuery} AND last_notification_sent_at IS NULL`;

	const bookmarks = await env.DB.prepare(query)
		.bind(userId, constants.YEAR)
		.run();

	if (!bookmarks.success || !bookmarks.results?.length) {
		return [];
	}

	return bookmarks.results as unknown as Bookmark[];
}

export function enrichBookmarks(
	bookmarks: Bookmark[],
	events: { [key: string]: FosdemEvent },
): EnrichedBookmark[] {
	const enriched: EnrichedBookmark[] = [];

	for (const bookmark of bookmarks) {
		if (typeof bookmark.slug !== "string" || !bookmark.slug) {
			console.warn("Skipping bookmark with invalid slug", bookmark);
			continue;
		}

		const event = events[bookmark.slug];
		if (!event) {
			console.warn(`Event not found for bookmark ${bookmark.slug}`);
			continue;
		}

		enriched.push({
			...bookmark,
			...event,
		});
	}

	return enriched;
}

export function getBookmarksForDay(bookmarks: EnrichedBookmark[], day: string): EnrichedBookmark[] {
	if (!day) {
		throw new Error(`Invalid day: ${day}`);
	}

	return bookmarks.filter((bookmark) => bookmark.day === day);
}

export function getBookmarksStartingSoon(
	bookmarks: EnrichedBookmark[],
	reminderMinutes = 15,
): EnrichedBookmark[] {
	const nowBrussels = createBrusselsDate();
	const year = nowBrussels.getUTCFullYear();
	const month = nowBrussels.getUTCMonth();
	const day = nowBrussels.getUTCDate();
	const nowMinutes =
		nowBrussels.getUTCHours() * 60 +
		nowBrussels.getUTCMinutes() +
		nowBrussels.getUTCSeconds() / 60;
	const windowMinutes = Number.isFinite(reminderMinutes)
		? Math.max(0, reminderMinutes)
		: 15;

	return bookmarks.filter((bookmark) => {
		const [hours, minutes] = bookmark.startTime.split(":").map(Number);
		if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
			return false;
		}

		const eventTime = new Date(Date.UTC(year, month, day, hours, minutes, 0));
		const eventMinutes =
			eventTime.getUTCHours() * 60 + eventTime.getUTCMinutes();
		const timeDiff = eventMinutes - nowMinutes;

		return timeDiff > 0 && timeDiff <= windowMinutes;
	});
}

export async function markNotificationSent(bookmarkId: string, env: Env): Promise<void> {
	const result = await env.DB.prepare(
		"UPDATE bookmark SET last_notification_sent_at = CURRENT_TIMESTAMP WHERE id = ?",
	)
		.bind(bookmarkId)
		.run();

	if (!result.success) {
		throw new Error(`Failed to update last_notification_sent_at for bookmark ${bookmarkId}`);
	}
} 
