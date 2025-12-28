import { createServerFn } from "@tanstack/react-start";

import { getAuthUser } from "~/server/lib/auth-middleware";
import { ok, err, type Result } from "~/server/lib/result";
import {
  findWatchLaterBookmarks,
  findBookmarksByWatchStatus,
  updateWatchProgress as updateWatchProgressRepo,
  markAsWatched as markAsWatchedRepo,
  toggleWatchLater as toggleWatchLaterRepo,
  findBookmarkById,
  updateBookmark,
} from "~/server/repositories/bookmark-repository";
import type { Bookmark } from "~/server/db/schema";

export const getWatchLaterList = createServerFn({
  method: "GET",
})
  .inputValidator((data: { year: number }) => data)
  .handler(async (ctx): Promise<Bookmark[]> => {
    const user = await getAuthUser();
    if (!user) {
      return [];
    }

    return findWatchLaterBookmarks(user.id, ctx.data.year);
  });

export const getBookmarksByWatchStatus = createServerFn({
  method: "GET",
})
  .inputValidator(
    (data: { year: number; status: "unwatched" | "watching" | "watched" }) =>
      data,
  )
  .handler(async (ctx): Promise<Bookmark[]> => {
    const user = await getAuthUser();
    if (!user) {
      return [];
    }

    return findBookmarksByWatchStatus(user.id, ctx.data.year, ctx.data.status);
  });

export const toggleWatchLater = createServerFn({
  method: "POST",
})
  .inputValidator((data: { bookmarkId: string }) => data)
  .handler(async (ctx): Promise<Result<boolean> | null> => {
    const user = await getAuthUser();
    if (!user) {
      return null;
    }

    try {
      const newValue = await toggleWatchLaterRepo(ctx.data.bookmarkId, user.id);
      return ok(newValue);
    } catch (error) {
      console.error("Failed to toggle watch later:", error);
      return err("Failed to toggle watch later");
    }
  });

export const updateWatchProgress = createServerFn({
  method: "POST",
})
  .inputValidator(
    (data: {
      bookmarkId: string;
      progressSeconds: number;
      playbackSpeed?: string;
    }) => data,
  )
  .handler(async (ctx): Promise<Result<boolean> | null> => {
    const user = await getAuthUser();
    if (!user) {
      return null;
    }

    try {
      await updateWatchProgressRepo(
        ctx.data.bookmarkId,
        user.id,
        ctx.data.progressSeconds,
        ctx.data.playbackSpeed,
      );
      return ok(true);
    } catch (error) {
      console.error("Failed to update watch progress:", error);
      return err("Failed to update watch progress");
    }
  });

export const markAsWatched = createServerFn({
  method: "POST",
})
  .inputValidator((data: { bookmarkId: string }) => data)
  .handler(async (ctx): Promise<Result<boolean> | null> => {
    const user = await getAuthUser();
    if (!user) {
      return null;
    }

    try {
      await markAsWatchedRepo(ctx.data.bookmarkId, user.id);
      return ok(true);
    } catch (error) {
      console.error("Failed to mark as watched:", error);
      return err("Failed to mark as watched");
    }
  });

export const setPlaybackSpeed = createServerFn({
  method: "POST",
})
  .inputValidator((data: { bookmarkId: string; speed: string }) => data)
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
        playback_speed: ctx.data.speed,
      });
      return ok(true);
    } catch (error) {
      console.error("Failed to set playback speed:", error);
      return err("Failed to set playback speed");
    }
  });
