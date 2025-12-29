import { and, eq, sql } from "drizzle-orm";

import { db } from "~/server/db";
import {
  userConferenceStats as userConferenceStatsTable,
  bookmark as bookmarkTable,
  note as noteTable,
  type UserConferenceStats,
} from "~/server/db/schema";

export async function findUserConferenceStats(
  userId: number,
  year: number,
): Promise<UserConferenceStats | undefined> {
  return db.query.userConferenceStats.findFirst({
    where: and(
      eq(userConferenceStatsTable.user_id, userId),
      eq(userConferenceStatsTable.year, year),
    ),
  });
}

export async function upsertUserConferenceStats(
  userId: number,
  year: number,
  stats: Partial<Omit<UserConferenceStats, "id" | "user_id" | "year" | "created_at" | "updated_at">>,
): Promise<UserConferenceStats> {
  const existing = await findUserConferenceStats(userId, year);

  if (existing) {
    const [updated] = await db
      .update(userConferenceStatsTable)
      .set(stats)
      .where(
        and(
          eq(userConferenceStatsTable.user_id, userId),
          eq(userConferenceStatsTable.year, year),
        ),
      )
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(userConferenceStatsTable)
    .values({
      user_id: userId,
      year,
      ...stats,
    })
    .returning();

  return created;
}

export async function calculateAndUpdateUserStats(
  userId: number,
  year: number,
): Promise<UserConferenceStats> {
  const [bookmarkStats, notesResult] = await Promise.all([
    db
      .select({
        eventsBookmarked: sql<number>`COUNT(CASE WHEN type = 'bookmark_event' THEN 1 END)`,
        eventsAttended: sql<number>`COUNT(CASE WHEN type = 'bookmark_event' AND attended = 1 THEN 1 END)`,
        eventsAttendedInPerson: sql<number>`COUNT(CASE WHEN type = 'bookmark_event' AND attended_in_person = 1 THEN 1 END)`,
        eventsWatched: sql<number>`COUNT(CASE WHEN type = 'bookmark_event' AND watch_status = 'watched' THEN 1 END)`,
        tracksCovered: sql<number>`COUNT(CASE WHEN type = 'bookmark_track' THEN 1 END)`,
        totalWatchTime: sql<number>`COALESCE(SUM(CASE WHEN type = 'bookmark_event' THEN watch_progress_seconds END), 0)`,
      })
      .from(bookmarkTable)
      .where(
        and(
          eq(bookmarkTable.user_id, userId),
          eq(bookmarkTable.year, year),
          eq(bookmarkTable.status, "favourited"),
        ),
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(noteTable)
      .where(and(eq(noteTable.user_id, userId), eq(noteTable.year, year))),
  ]);

  return upsertUserConferenceStats(userId, year, {
    events_bookmarked: bookmarkStats[0].eventsBookmarked,
    events_attended: bookmarkStats[0].eventsAttended,
    events_attended_in_person: bookmarkStats[0].eventsAttendedInPerson,
    events_watched: bookmarkStats[0].eventsWatched,
    tracks_covered: bookmarkStats[0].tracksCovered,
    notes_taken: notesResult[0]?.count || 0,
    total_watch_time_seconds: bookmarkStats[0].totalWatchTime,
  });
}

export async function findUserStatsAcrossYears(
  userId: number,
): Promise<UserConferenceStats[]> {
  return db
    .select()
    .from(userConferenceStatsTable)
    .where(eq(userConferenceStatsTable.user_id, userId))
    .orderBy(userConferenceStatsTable.year);
}
