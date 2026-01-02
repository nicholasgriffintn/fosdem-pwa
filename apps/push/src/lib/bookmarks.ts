import { constants } from "../constants";
import { createBrusselsDate } from "../utils/date";
import type { FosdemEvent, Bookmark, EnrichedBookmark, Env } from "../types";

interface GetUserBookmarksOptions {
	includeSent?: boolean;
}

interface GetBookmarksByUserIdsOptions extends GetUserBookmarksOptions {
	slugs?: string[];
}

const BOOKMARK_QUERY_COLUMNS =
	"id, user_id, type, status, year, slug, priority, attended, watch_status";

export async function getUserBookmarks(
	userId: string,
	env: Env,
	{ includeSent = false }: GetUserBookmarksOptions = {},
): Promise<Bookmark[]> {
	const baseQuery =
		`SELECT ${BOOKMARK_QUERY_COLUMNS} FROM bookmark WHERE user_id = ? AND type = 'bookmark_event' AND status = 'favourited' AND year = ?`;

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

export async function getBookmarksByUserIds(
	userIds: string[],
	env: Env,
	{ includeSent = false, slugs }: GetBookmarksByUserIdsOptions = {},
): Promise<Map<string, Bookmark[]>> {
	const bookmarksByUserId = new Map<string, Bookmark[]>();
	const uniqueUserIds = Array.from(
		new Set(userIds.filter((userId) => typeof userId === "string" && userId.length > 0)),
	);
	const uniqueSlugs = slugs?.length
		? Array.from(new Set(slugs.filter((slug) => typeof slug === "string" && slug.length > 0)))
		: [];

	if (!uniqueUserIds.length) {
		return bookmarksByUserId;
	}

	const chunkSize = 500;
	for (let i = 0; i < uniqueUserIds.length; i += chunkSize) {
		const chunk = uniqueUserIds.slice(i, i + chunkSize);
		const placeholders = chunk.map(() => "?").join(", ");
		const slugPlaceholders = uniqueSlugs.map(() => "?").join(", ");
		const slugFilter = uniqueSlugs.length
			? ` AND slug IN (${slugPlaceholders})`
			: "";
		const query = includeSent
			? `SELECT ${BOOKMARK_QUERY_COLUMNS} FROM bookmark WHERE year = ? AND user_id IN (${placeholders}) AND type = 'bookmark_event' AND status = 'favourited'${slugFilter}`
			: `SELECT ${BOOKMARK_QUERY_COLUMNS} FROM bookmark WHERE year = ? AND user_id IN (${placeholders}) AND type = 'bookmark_event' AND status = 'favourited' AND last_notification_sent_at IS NULL${slugFilter}`;

		const result = await env.DB.prepare(query)
			.bind(constants.YEAR, ...chunk, ...uniqueSlugs)
			.run();

		if (!result.success || !result.results?.length) {
			continue;
		}

		for (const row of result.results as Array<Record<string, unknown>>) {
			const userId = row.user_id as string;
			if (!userId) continue;
			const existing = bookmarksByUserId.get(userId) ?? [];
			existing.push(row as unknown as Bookmark);
			bookmarksByUserId.set(userId, existing);
		}
	}

	return bookmarksByUserId;
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
