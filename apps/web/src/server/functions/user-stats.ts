import { createServerFn } from "@tanstack/react-start";

import { getAuthUser } from "~/server/lib/auth-middleware";
import { ok, err, type Result } from "~/server/lib/result";
import {
  findUserConferenceStats,
  calculateAndUpdateUserStats,
  findUserStatsAcrossYears,
} from "~/server/repositories/user-stats-repository";
import {
  markAsAttended as markAsAttendedRepo,
  findBookmarkById,
  updateBookmark,
} from "~/server/repositories/bookmark-repository";
import type { UserConferenceStats } from "~/server/db/schema";

export const getUserStats = createServerFn({
  method: "GET",
})
  .inputValidator((data: { year: number }) => data)
  .handler(async (ctx): Promise<UserConferenceStats | null> => {
    const user = await getAuthUser();
    if (!user) {
      return null;
    }

    const stats = await findUserConferenceStats(user.id, ctx.data.year);
    return stats ?? null;
  });

export const refreshUserStats = createServerFn({
  method: "POST",
})
  .inputValidator((data: { year: number }) => data)
  .handler(async (ctx): Promise<Result<UserConferenceStats> | null> => {
    const user = await getAuthUser();
    if (!user) {
      return null;
    }

    try {
      const stats = await calculateAndUpdateUserStats(user.id, ctx.data.year);
      return ok(stats);
    } catch (error) {
      console.error("Failed to refresh user stats:", error);
      return err("Failed to refresh user stats");
    }
  });

export const getUserStatsHistory = createServerFn({
  method: "GET",
}).handler(async (): Promise<UserConferenceStats[]> => {
  const user = await getAuthUser();
  if (!user) {
    return [];
  }

  return findUserStatsAcrossYears(user.id);
});

export const markEventAttended = createServerFn({
  method: "POST",
})
  .inputValidator((data: { bookmarkId: string; inPerson?: boolean }) => data)
  .handler(async (ctx): Promise<Result<boolean> | null> => {
    const user = await getAuthUser();
    if (!user) {
      return null;
    }

    const bookmark = await findBookmarkById(ctx.data.bookmarkId, user.id);
    if (!bookmark) {
      return err("Bookmark not found");
    }

    try {
      await markAsAttendedRepo(
        ctx.data.bookmarkId,
        user.id,
        ctx.data.inPerson ?? false,
      );
      return ok(true);
    } catch (error) {
      console.error("Failed to mark event as attended:", error);
      return err("Failed to mark event as attended");
    }
  });

export const unmarkEventAttended = createServerFn({
  method: "POST",
})
  .inputValidator((data: { bookmarkId: string }) => data)
  .handler(async (ctx): Promise<Result<boolean> | null> => {
    const user = await getAuthUser();
    if (!user) {
      return null;
    }

    const bookmark = await findBookmarkById(ctx.data.bookmarkId, user.id);
    if (!bookmark) {
      return err("Bookmark not found");
    }

    try {
      await updateBookmark(ctx.data.bookmarkId, {
        attended: false,
        attended_at: null,
        attended_in_person: false,
      });
      return ok(true);
    } catch (error) {
      console.error("Failed to unmark event as attended:", error);
      return err("Failed to unmark event as attended");
    }
  });
