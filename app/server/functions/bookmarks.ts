import { and } from "drizzle-orm";
import { createServerFn } from "@tanstack/start";
import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { bookmark as bookmarkTable, user as userTable } from "~/server/db/schema";
import { getFullAuthSession } from "~/server/auth";

export const getBookmarks = createServerFn({
  method: "GET",
})
  .validator((data: { year: number }) => data)
  .handler(async (ctx: any) => {
    const { year } = ctx.data;

    const { user } = await getFullAuthSession();

    if (!user) {
      return [];
    }

    const bookmarkData = await db.query.bookmark.findMany({
      where: and(
        eq(bookmarkTable.user_id, user.id),
        eq(bookmarkTable.year, Number.parseInt(year)),
      ),
    });

    if (!bookmarkData) {
      return [];
    }

    return bookmarkData;
  });

export const createBookmark = createServerFn({
  method: "POST",
})
  .validator((data: { year: number; type: string; slug: string; status: string }) => data)
  .handler(async (ctx: any) => {
    const { year, type, slug, status } = ctx.data;

    if (!type || !slug || !status) {
      throw new Error("Invalid request");
    }

    const { user } = await getFullAuthSession();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const existingBookmark = await db.query.bookmark.findFirst({
      where: and(
        eq(bookmarkTable.user_id, user.id),
        eq(bookmarkTable.year, Number.parseInt(year)),
        eq(bookmarkTable.slug, slug),
      ),
    });

    try {
      if (existingBookmark) {
        await db
          .update(bookmarkTable)
          .set({
            status,
          })
          .where(eq(bookmarkTable.id, existingBookmark.id));
      } else {
        await db
          .insert(bookmarkTable)
          .values({
            id: `${user.id}_${year}_${slug}`,
            slug,
            type: `bookmark_${type}`,
            year: Number.parseInt(year),
            status,
            user_id: user.id,
          })
          .returning();
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error(error);

      return {
        success: false,
        error: "Failed to save bookmark",
      };
    }
  });

export const updateBookmark = createServerFn({
  method: "POST",
})
  .validator((data: { id: string; updates: any }) => data)
  .handler(async (ctx: any) => {
    const { id, updates } = ctx.data;

    const { user } = await getFullAuthSession();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const existingBookmark = await db.query.bookmark.findFirst({
      where: and(eq(bookmarkTable.id, id), eq(bookmarkTable.user_id, user.id)),
    });

    if (!existingBookmark) {
      throw new Error("Bookmark not found");
    }

    try {
      await db
        .update(bookmarkTable)
        .set({ ...updates })
        .where(eq(bookmarkTable.id, id));

      return {
        success: true,
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        error: "Failed to update bookmark",
      };
    }
  });


export const getUserBookmarks = createServerFn({
  method: "GET",
})
  .validator((data: { year: number, userId: string }) => data)
  .handler(async (ctx: any) => {
    const { year, userId } = ctx.data;

    if (!userId) {
      throw new Error("User ID is required");
    }

    const user = await db.query.user.findFirst({
      where: eq(userTable.github_username, userId),
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.bookmarks_visibility === "private") {
      throw new Error("User has private bookmarks");
    }

    const bookmarks = await db
      .select()
      .from(bookmarkTable)
      .where(
        and(
          eq(bookmarkTable.user_id, user.id),
          eq(bookmarkTable.year, Number(year)),
        ),
      );

    return bookmarks;
  })