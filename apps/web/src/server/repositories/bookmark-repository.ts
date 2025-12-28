import { and, eq } from "drizzle-orm";

import { db } from "~/server/db";
import { bookmark as bookmarkTable, type Bookmark } from "~/server/db/schema";

export function generateBookmarkId(
  userId: number,
  year: number,
  slug: string,
): string {
  return `${userId}_${year}_${slug}`;
}

export async function findBookmarksByUserAndStatus(
  userId: number,
  year: number,
  status: string,
): Promise<Bookmark[]> {
  return db.query.bookmark.findMany({
    where: and(
      eq(bookmarkTable.user_id, userId),
      eq(bookmarkTable.year, year),
      eq(bookmarkTable.status, status),
    ),
  });
}

export async function findBookmarksByUserAndYear(
  userId: number,
  year: number,
): Promise<Bookmark[]> {
  return db
    .select()
    .from(bookmarkTable)
    .where(and(eq(bookmarkTable.user_id, userId), eq(bookmarkTable.year, year)));
}

export async function findBookmark(
  userId: number,
  year: number,
  slug: string,
): Promise<Bookmark | undefined> {
  return db.query.bookmark.findFirst({
    where: and(
      eq(bookmarkTable.user_id, userId),
      eq(bookmarkTable.year, year),
      eq(bookmarkTable.slug, slug),
    ),
  });
}

export async function findBookmarkById(
  id: string,
  userId: number,
): Promise<Bookmark | undefined> {
  return db.query.bookmark.findFirst({
    where: and(eq(bookmarkTable.id, id), eq(bookmarkTable.user_id, userId)),
  });
}

const VALID_BOOKMARK_TYPES = ['event', 'track', 'speaker', 'room'] as const;
const VALID_BOOKMARK_STATUSES = ['favourited', 'unfavourited'] as const;

export async function upsertBookmark(
  userId: number,
  year: number,
  type: string,
  slug: string,
  status: string,
): Promise<void> {
  if (!VALID_BOOKMARK_TYPES.includes(type as any)) {
    throw new Error(`Invalid bookmark type: ${type}`);
  }

  if (!VALID_BOOKMARK_STATUSES.includes(status as any)) {
    throw new Error(`Invalid bookmark status: ${status}`);
  }

  if (!slug || typeof slug !== 'string' || slug.length > 255) {
    throw new Error('Invalid slug');
  }

  await db
    .insert(bookmarkTable)
    .values({
      id: generateBookmarkId(userId, year, slug),
      slug,
      type: `bookmark_${type}`,
      year,
      status,
      user_id: userId,
    })
    .onConflictDoUpdate({
      target: bookmarkTable.id,
      set: { status },
    });
}

export async function updateBookmark(
  id: string,
  userId: number,
  updates: Partial<Pick<Bookmark,
    | "status"
    | "priority"
    | "last_notification_sent_at"
    | "watch_later"
    | "watch_status"
    | "watch_progress_seconds"
    | "playback_speed"
    | "last_watched_at"
    | "attended"
    | "attended_at"
    | "attended_in_person"
  >>,
): Promise<void> {
  await db.update(bookmarkTable).set(updates).where(and(eq(bookmarkTable.id, id), eq(bookmarkTable.user_id, userId)));
}

export async function deleteBookmark(id: string, userId: number): Promise<void> {
  await db.delete(bookmarkTable).where(and(eq(bookmarkTable.id, id), eq(bookmarkTable.user_id, userId)));
}

export async function findWatchLaterBookmarks(
  userId: number,
  year: number,
): Promise<Bookmark[]> {
  return db.query.bookmark.findMany({
    where: and(
      eq(bookmarkTable.user_id, userId),
      eq(bookmarkTable.year, year),
      eq(bookmarkTable.watch_later, true),
    ),
  });
}

export async function findBookmarksByWatchStatus(
  userId: number,
  year: number,
  watchStatus: "unwatched" | "watching" | "watched",
): Promise<Bookmark[]> {
  return db.query.bookmark.findMany({
    where: and(
      eq(bookmarkTable.user_id, userId),
      eq(bookmarkTable.year, year),
      eq(bookmarkTable.watch_status, watchStatus),
    ),
  });
}

export async function updateWatchProgress(
  id: string,
  userId: number,
  progressSeconds: number,
  playbackSpeed?: string,
): Promise<void> {
  const bookmark = await findBookmarkById(id, userId);
  if (!bookmark) return;

  const updates: Partial<Bookmark> = {
    watch_progress_seconds: progressSeconds,
    last_watched_at: new Date().toISOString(),
  };

  if (playbackSpeed) {
    updates.playback_speed = playbackSpeed;
  }

  if (progressSeconds > 0 && bookmark.watch_status === "unwatched") {
    updates.watch_status = "watching";
  }

  await db.update(bookmarkTable).set(updates).where(and(eq(bookmarkTable.id, id), eq(bookmarkTable.user_id, userId)));
}

export async function markAsWatched(
  id: string,
  userId: number,
): Promise<void> {
  const bookmark = await findBookmarkById(id, userId);
  if (!bookmark) return;

  await db
    .update(bookmarkTable)
    .set({
      watch_status: "watched",
      last_watched_at: new Date().toISOString(),
    })
    .where(and(eq(bookmarkTable.id, id), eq(bookmarkTable.user_id, userId)));
}

export async function toggleWatchLater(
  id: string,
  userId: number,
): Promise<boolean> {
  const bookmark = await findBookmarkById(id, userId);
  if (!bookmark) return false;

  const newValue = !bookmark.watch_later;
  await db
    .update(bookmarkTable)
    .set({ watch_later: newValue })
    .where(and(eq(bookmarkTable.id, id), eq(bookmarkTable.user_id, userId)));

  return newValue;
}

export async function markAsAttended(
  id: string,
  userId: number,
  inPerson: boolean = false,
): Promise<void> {
  const bookmark = await findBookmarkById(id, userId);
  if (!bookmark) return;

  await db
    .update(bookmarkTable)
    .set({
      attended: true,
      attended_at: new Date().toISOString(),
      attended_in_person: inPerson,
    })
    .where(and(eq(bookmarkTable.id, id), eq(bookmarkTable.user_id, userId)));
}
