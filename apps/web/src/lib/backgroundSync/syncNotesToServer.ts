import { getSyncQueue, removeFromSyncQueue } from "~/lib/localStorage";
import { withRetry } from "~/lib/withRetry";
import { createNote, updateNote, deleteNote } from "~/server/functions/notes";
import { normalizeServerActionResult } from "~/lib/backgroundSync/utils";
import type { SyncResult } from "~/lib/backgroundSync/types";


export async function syncNotesToServer(): Promise<SyncResult> {
  const syncQueue = await getSyncQueue();
  const noteItems = syncQueue.filter((item) => item.type === "note");

  if (noteItems.length === 0) {
    return { success: true, syncedCount: 0, errors: [] };
  }

  const operations = noteItems.map(async (item) => {
    try {
      if (item.action === "create") {
        const response = await withRetry(() =>
          createNote({
            data: {
              year: item.data.year,
              eventId: item.data.slug,
              note: item.data.content,
              time: item.data.time,
            },
          }),
        );

        const result = normalizeServerActionResult(response);
        if (result.success) {
          await removeFromSyncQueue(item.id);
          return { success: true as const, id: item.id };
        } else if (result.statusCode === 404) {
          console.warn(`Note not found (404), removing from sync queue: ${item.id}`);
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
          const response = await withRetry(() =>
            updateNote({
              data: {
                id: item.data.serverId,
                updates: {
                  note: item.data.content,
                  time: item.data.time,
                },
              },
            }),
          );
          const result = normalizeServerActionResult(response);
          if (result.success) {
            await removeFromSyncQueue(item.id);
            return { success: true as const, id: item.id };
          } else if (result.statusCode === 404) {
            console.warn(`Note not found (404), removing from sync queue: ${item.id}`);
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
            createNote({
              data: {
                year: item.data.year,
                eventId: item.data.slug,
                note: item.data.content,
                time: item.data.time,
              },
            }),
          );
          const result = normalizeServerActionResult(response);
          if (result.success) {
            await removeFromSyncQueue(item.id);
            return { success: true as const, id: item.id };
          } else if (result.statusCode === 404) {
            console.warn(`Note not found (404), removing from sync queue: ${item.id}`);
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
            deleteNote({
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
            console.warn(`Note not found (404), removing from sync queue: ${item.id}`);
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
        console.warn(`Unknown note sync action "${item.action}", removing from queue: ${item.id}`);
        await removeFromSyncQueue(item.id);
        return { success: true as const, id: item.id };
      }
    } catch (error) {
      console.error("Sync error for note:", item.id, error);
      return { success: false as const, id: item.id, error: String(error) };
    }
  });

  const results = await Promise.allSettled(operations);
  const processedResults = results
    .map((r) => r.status === "fulfilled" ? r.value : { success: false as const, id: "unknown", error: "Promise rejected" });

  const successCount = processedResults.filter((r) => r.success).length;
  const errors = processedResults
    .filter((r): r is { success: false; id: string; error: string } => !r.success)
    .map((r) => r.error);

  return {
    success: errors.length === 0,
    syncedCount: successCount,
    errors,
  };
}
