import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { bookmark as bookmarkTable } from "~/server/db/schema";
import type { Conference } from "~/types/fosdem";

export type BookmarkPayload = {
  year: number;
  type: string;
  slug: string;
  status: string;
};

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

export function validateYear(year: unknown): number {
  const yearNum = Number.parseInt(String(year));
  if (!Number.isFinite(yearNum) || yearNum < MIN_YEAR || yearNum > MAX_YEAR) {
    throw new Error("Invalid year parameter");
  }
  return yearNum;
}

export function generateBookmarkId(
  userId: number,
  year: number,
  slug: string
): string {
  return `${userId}_${year}_${slug}`;
}

export async function upsertBookmark(
  payload: BookmarkPayload,
  userId: number
): Promise<void> {
  const { type, slug, status } = payload;
  const yearNum = validateYear(payload.year);

  const existingBookmark = await db.query.bookmark.findFirst({
    where: and(
      eq(bookmarkTable.user_id, userId),
      eq(bookmarkTable.year, yearNum),
      eq(bookmarkTable.slug, slug)
    ),
  });

  if (existingBookmark) {
    await db
      .update(bookmarkTable)
      .set({ status })
      .where(eq(bookmarkTable.id, existingBookmark.id));
  } else {
    await db
      .insert(bookmarkTable)
      .values({
        id: generateBookmarkId(userId, yearNum, slug),
        slug,
        type: `bookmark_${type}`,
        year: yearNum,
        status,
        user_id: userId,
      })
      .onConflictDoUpdate({
        target: bookmarkTable.id,
        set: { status },
      });
  }
}

export function buildIdToSlugMaps(fosdemData: Conference) {
  const eventIdToSlug = new Map<string, string>();
  for (const [slug, event] of Object.entries(fosdemData.events ?? {})) {
    if (event?.id) eventIdToSlug.set(String(event.id), slug);
  }

  const trackIdToSlug = new Map<string, string>();
  for (const [slug, track] of Object.entries(fosdemData.tracks ?? {})) {
    if (track?.id) trackIdToSlug.set(String(track.id), slug);
  }

  return { eventIdToSlug, trackIdToSlug };
}
