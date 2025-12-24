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

export async function upsertBookmark(
  userId: number,
  year: number,
  type: string,
  slug: string,
  status: string,
): Promise<void> {
  const existingBookmark = await findBookmark(userId, year, slug);

  if (existingBookmark) {
    await db
      .update(bookmarkTable)
      .set({ status })
      .where(eq(bookmarkTable.id, existingBookmark.id));
  } else {
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
}

export async function updateBookmark(
  id: string,
  updates: Partial<Pick<Bookmark, "status" | "priority" | "last_notification_sent_at">>,
): Promise<void> {
  await db.update(bookmarkTable).set(updates).where(eq(bookmarkTable.id, id));
}

export async function deleteBookmark(id: string): Promise<void> {
  await db.delete(bookmarkTable).where(eq(bookmarkTable.id, id));
}
