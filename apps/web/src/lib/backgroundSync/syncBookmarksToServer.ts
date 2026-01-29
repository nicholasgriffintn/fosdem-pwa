import { getSyncQueue, removeFromSyncQueue, updateLocalBookmark } from "~/lib/localStorage";
import { withRetry } from "~/lib/withRetry";
import {
  createBookmark,
  deleteBookmark,
  updateBookmark,
} from "~/server/functions/bookmarks";
import type { SyncResult } from "~/lib/backgroundSync/types";
import { normalizeServerActionResult } from "~/lib/backgroundSync/utils";
import { generateBookmarkId } from "~/lib/bookmark-id";
import { withBookmarkSyncLock } from "~/lib/backgroundSync/bookmarkSyncLock";

export async function syncBookmarksToServer(userId?: number): Promise<SyncResult> {
  return withBookmarkSyncLock(async () => {
    const syncQueue = await getSyncQueue();
    const bookmarkItems = syncQueue.filter((item) => item.type === "bookmark");

    if (bookmarkItems.length === 0) {
      return { success: true, syncedCount: 0, errors: [] };
    }

    const operations = bookmarkItems.map(async (item) => {
      try {
        if (item.action === "create") {
          const response = await withRetry(() =>
            createBookmark({
              data: {
                year: item.data.year,
                type: item.data.type,
                slug: item.data.slug,
                status: item.data.status,
              },
            }),
          );

          const result = normalizeServerActionResult(response);
          if (result.success) {
            await removeFromSyncQueue(item.id);
            if (userId && item.data?.year && item.data?.slug) {
              await updateLocalBookmark(
                item.id,
                { serverId: generateBookmarkId(userId, item.data.year, item.data.slug) },
                true,
              );
            }
            return { success: true as const, id: item.id };
          } else if (result.statusCode === 404) {
            console.warn(`Bookmark not found (404), removing from sync queue: ${item.id}`);
            await removeFromSyncQueue(item.id);
            return { success: true as const, id: item.id };
          } else {
            return {
              success: false as const,
              id: item.id,
              error: result.error || "Unknown error",
            };
          }
        } else if (item.action === "update") {
          if (item.data.serverId) {
            const updates: Record<string, unknown> = {
              status: item.data.status,
            };

            if (Object.prototype.hasOwnProperty.call(item.data, "priority")) {
              updates.priority = item.data.priority;
            }

            if (
              Object.prototype.hasOwnProperty.call(
                item.data,
                "last_notification_sent_at",
              )
            ) {
              updates.last_notification_sent_at =
                item.data.last_notification_sent_at;
            }

            const response = await withRetry(() =>
              updateBookmark({
                data: {
                  id: item.data.serverId,
                  updates,
                },
              }),
            );

            const result = normalizeServerActionResult(response);
            if (result.success) {
              await removeFromSyncQueue(item.id);
              return { success: true as const, id: item.id };
            } else if (result.statusCode === 404) {
              console.warn(`Bookmark not found (404), removing from sync queue: ${item.id}`);
              await removeFromSyncQueue(item.id);
              return { success: true as const, id: item.id };
            } else {
              return {
                success: false as const,
                id: item.id,
                error: result.error || "Unknown error",
              };
            }
          } else {
            const response = await withRetry(() =>
              createBookmark({
                data: {
                  year: item.data.year,
                  type: item.data.type,
                  slug: item.data.slug,
                  status: item.data.status,
                },
              }),
            );

            const result = normalizeServerActionResult(response);
            if (result.success) {
              await removeFromSyncQueue(item.id);
              if (userId && item.data?.year && item.data?.slug) {
                await updateLocalBookmark(
                  item.id,
                  { serverId: generateBookmarkId(userId, item.data.year, item.data.slug) },
                  true,
                );
              }
              return { success: true as const, id: item.id };
            } else if (result.statusCode === 404) {
              console.warn(`Bookmark not found (404), removing from sync queue: ${item.id}`);
              await removeFromSyncQueue(item.id);
              return { success: true as const, id: item.id };
            } else {
              return {
                success: false as const,
                id: item.id,
                error: result.error || "Unknown error",
              };
            }
          }

        } else if (item.action === "delete") {
          if (item.data.serverId) {
            const response = await withRetry(() =>
              deleteBookmark({
                data: {
                  id: item.data.serverId,
                },
              }),
            );
            const result = normalizeServerActionResult(response);
            if (result.success) {
              await removeFromSyncQueue(item.id);
              return { success: true as const, id: item.id };
            } else if (result.statusCode === 404) {
              console.warn(`Bookmark not found (404), removing from sync queue: ${item.id}`);
              await removeFromSyncQueue(item.id);
              return { success: true as const, id: item.id };
            } else {
              return {
                success: false as const,
                id: item.id,
                error: result.error || "Unknown error",
              };
            }
          } else {
            await removeFromSyncQueue(item.id);
            return { success: true as const, id: item.id };
          }
        } else {
          console.warn(`Unknown bookmark sync action "${item.action}", removing from queue: ${item.id}`);
          await removeFromSyncQueue(item.id);
          return { success: true as const, id: item.id };
        }
      } catch (error) {
        console.error("Sync error for bookmark:", item.id, error);
        return { success: false, id: item.id, error: String(error) };
      }
    });

    const results = await Promise.allSettled(operations);
    const processedResults = results
      .map((r) => r.status === "fulfilled" ? r.value : { success: false, id: "unknown", error: "Promise rejected" });

    const successCount = processedResults.filter((r) => r.success).length;
    const errors = processedResults
      .filter((r): r is { success: false; id: string; error: string } => !r.success)
      .map((r) => r.error);

    return {
      success: errors.length === 0,
      syncedCount: successCount,
      errors,
    };
  });
}
