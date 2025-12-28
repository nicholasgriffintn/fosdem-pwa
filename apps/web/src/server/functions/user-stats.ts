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
      await updateBookmark(ctx.data.bookmarkId, user.id, {
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

export const toggleAttendanceFromForm = createServerFn({
  method: "POST",
})
  .inputValidator((data: FormData) => {
    if (!(data instanceof FormData)) {
      throw new Error("Invalid! FormData is required");
    }

    const bookmarkId = data.get("bookmarkId");
    const currentStatus = data.get("currentStatus");
    const returnTo = data.get("returnTo");

    if (!bookmarkId) {
      throw new Error("Invalid request: bookmarkId is required");
    }

    return {
      bookmarkId: bookmarkId.toString(),
      currentStatus: currentStatus?.toString() === "true",
      returnTo: returnTo?.toString(),
    };
  })
  .handler(async (ctx): Promise<Response> => {
    const { bookmarkId, currentStatus, returnTo } = ctx.data;
    const user = await getAuthUser();

    if (!user) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: "/signin",
        },
      });
    }

    const bookmark = await findBookmarkById(bookmarkId, user.id);
    if (!bookmark) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: returnTo?.startsWith("/") ? returnTo : "/",
        },
      });
    }

    try {
      if (currentStatus) {
        await updateBookmark(bookmarkId, user.id, {
          attended: false,
          attended_at: null,
          attended_in_person: false,
        });
      } else {
        await markAsAttendedRepo(bookmarkId, user.id, false);
      }
    } catch (error) {
      console.error("Failed to toggle attendance:", error);
    }

    return new Response(null, {
      status: 303,
      headers: {
        Location: returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/",
      },
    });
  });
