import { constants } from "../constants";
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

export function enrichBookmarks(bookmarks: Bookmark[], events: { [key: string]: FosdemEvent }): EnrichedBookmark[] {
	return bookmarks.map((bookmark) => {
		if (typeof bookmark.slug !== "string") {
			throw new Error(`Invalid slug for bookmark ${bookmark.slug}`);
		}

		if (!bookmark.slug) {
			throw new Error(`Invalid slug for bookmark: ${JSON.stringify(bookmark)}`);
		}

		const event = events[bookmark.slug];

		if (!event) {
			throw new Error(`Event not found for bookmark ${bookmark.slug}`);
		}

		return {
			...bookmark,
			...event,
		};
	});
}

export function getBookmarksForDay(bookmarks: EnrichedBookmark[], day: string): EnrichedBookmark[] {
	if (!day) {
		throw new Error(`Invalid day: ${day}`);
	}

	return bookmarks.filter((bookmark) => bookmark.day === day);
}

export function getBookmarksStartingSoon(bookmarks: EnrichedBookmark[]): EnrichedBookmark[] {
	return bookmarks.filter((bookmark) => {
		const [hours, minutes] = bookmark.startTime.split(":").map(Number);
		const now = new Date();
		
		const eventTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Brussels' }));
		eventTime.setHours(hours, minutes, 0, 0);
		
		const brusselsNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Brussels' }));
		
		const timeDiff = (eventTime.getTime() - brusselsNow.getTime()) / (1000 * 60);
		
		return timeDiff > 0 && timeDiff <= 15;
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