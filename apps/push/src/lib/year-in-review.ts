import { constants } from "../constants";
import type { Env } from "../types";

type UserIdRow = {
	user_id: number;
};

type BookmarkStatsRow = {
	events_bookmarked: number | null;
	events_attended: number | null;
	events_attended_in_person: number | null;
	events_watched: number | null;
	tracks_covered: number | null;
	total_watch_time_seconds: number | null;
};

type NotesCountRow = {
	notes_taken: number | null;
};

const toNumber = (value: unknown) =>
	typeof value === "number" ? value : Number(value ?? 0);

async function getUsersWithActivity(env: Env, year: number): Promise<number[]> {
	const result = await env.DB.prepare(
		"SELECT DISTINCT user_id FROM bookmark WHERE year = ? UNION SELECT DISTINCT user_id FROM note WHERE year = ?",
	)
		.bind(year, year)
		.run();

	if (!result.success || !result.results?.length) {
		return [];
	}

	return (result.results as unknown as UserIdRow[])
		.map((row) => toNumber(row.user_id))
		.filter((userId) => Number.isFinite(userId));
}

async function getBookmarkStats(
	env: Env,
	userId: number,
	year: number,
): Promise<BookmarkStatsRow> {
	const result = await env.DB.prepare(
		`SELECT
      SUM(CASE WHEN type = 'bookmark_event' AND status = 'favourited' THEN 1 ELSE 0 END) AS events_bookmarked,
      SUM(CASE WHEN type = 'bookmark_event' AND status = 'favourited' AND attended = 1 THEN 1 ELSE 0 END) AS events_attended,
      SUM(CASE WHEN type = 'bookmark_event' AND status = 'favourited' AND attended_in_person = 1 THEN 1 ELSE 0 END) AS events_attended_in_person,
      SUM(CASE WHEN type = 'bookmark_event' AND status = 'favourited' AND watch_status = 'watched' THEN 1 ELSE 0 END) AS events_watched,
      SUM(CASE WHEN type = 'bookmark_event' AND status = 'favourited' THEN COALESCE(watch_progress_seconds, 0) ELSE 0 END) AS total_watch_time_seconds,
      SUM(CASE WHEN type = 'bookmark_track' AND status = 'favourited' THEN 1 ELSE 0 END) AS tracks_covered
    FROM bookmark WHERE user_id = ? AND year = ?`,
	)
		.bind(userId, year)
		.first();

	return (result ?? {
		events_bookmarked: 0,
		events_attended: 0,
		events_attended_in_person: 0,
		events_watched: 0,
		tracks_covered: 0,
		total_watch_time_seconds: 0,
	}) as BookmarkStatsRow;
}

async function getNotesCount(
	env: Env,
	userId: number,
	year: number,
): Promise<number> {
	const result = await env.DB.prepare(
		"SELECT COUNT(*) as notes_taken FROM note WHERE user_id = ? AND year = ?",
	)
		.bind(userId, year)
		.first();

	return toNumber((result as NotesCountRow | null)?.notes_taken);
}

async function upsertUserConferenceStats(
	env: Env,
	userId: number,
	year: number,
	stats: BookmarkStatsRow,
	notesTaken: number,
): Promise<void> {
	await env.DB.prepare(
		`INSERT INTO user_conference_stats (
      user_id,
      year,
      events_bookmarked,
      events_attended,
      events_attended_in_person,
      events_watched,
      tracks_covered,
      notes_taken,
      total_watch_time_seconds,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, year) DO UPDATE SET
      events_bookmarked = excluded.events_bookmarked,
      events_attended = excluded.events_attended,
      events_attended_in_person = excluded.events_attended_in_person,
      events_watched = excluded.events_watched,
      tracks_covered = excluded.tracks_covered,
      notes_taken = excluded.notes_taken,
      total_watch_time_seconds = excluded.total_watch_time_seconds,
      updated_at = CURRENT_TIMESTAMP`,
	)
		.bind(
			userId,
			year,
			toNumber(stats.events_bookmarked),
			toNumber(stats.events_attended),
			toNumber(stats.events_attended_in_person),
			toNumber(stats.events_watched),
			toNumber(stats.tracks_covered),
			notesTaken,
			toNumber(stats.total_watch_time_seconds),
		)
		.run();
}

export async function refreshYearInReviewStats(env: Env): Promise<void> {
	const users = await getUsersWithActivity(env, constants.YEAR);

	if (!users.length) {
		console.log("No users found to refresh year in review stats");
		return;
	}

	console.log(
		`Refreshing year in review stats for ${users.length} users (${constants.YEAR})`,
	);

	for (const userId of users) {
		const [bookmarkStats, notesTaken] = await Promise.all([
			getBookmarkStats(env, userId, constants.YEAR),
			getNotesCount(env, userId, constants.YEAR),
		]);

		await upsertUserConferenceStats(
			env,
			userId,
			constants.YEAR,
			bookmarkStats,
			notesTaken,
		);
	}
}
