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
  const bookmarks = await db
    .select()
    .from(bookmarkTable)
    .where(
      and(
        eq(bookmarkTable.user_id, userId),
        eq(bookmarkTable.year, year),
        eq(bookmarkTable.status, "favourited"),
      ),
    );

  const eventsBookmarked = bookmarks.filter(
    (b) => b.type === "bookmark_event",
  ).length;
  const eventsAttended = bookmarks.filter((b) => b.attended === true).length;
  const eventsAttendedInPerson = bookmarks.filter(
    (b) => b.attended_in_person === true,
  ).length;
  const eventsWatched = bookmarks.filter(
    (b) => b.watch_status === "watched",
  ).length;
  const totalWatchTimeSeconds = bookmarks.reduce(
    (sum, b) => sum + (b.watch_progress_seconds || 0),
    0,
  );

  const trackBookmarks = bookmarks.filter((b) => b.type === "bookmark_track");
  const tracksCovered = trackBookmarks.length;

  const notesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(noteTable)
    .where(and(eq(noteTable.user_id, userId), eq(noteTable.year, year)));

  const notesTaken = notesResult[0]?.count || 0;

  return upsertUserConferenceStats(userId, year, {
    events_bookmarked: eventsBookmarked,
    events_attended: eventsAttended,
    events_attended_in_person: eventsAttendedInPerson,
    events_watched: eventsWatched,
    tracks_covered: tracksCovered,
    notes_taken: notesTaken,
    total_watch_time_seconds: totalWatchTimeSeconds,
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
