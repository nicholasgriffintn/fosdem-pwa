import { getSyncQueue } from "~/lib/localStorage";
import type { SyncResult } from "~/lib/backgroundSync/types";
import { syncBookmarksToServer } from "~/lib/backgroundSync/syncBookmarksToServer";
import { syncNotesToServer } from "~/lib/backgroundSync/syncNotesToServer";

let currentSyncPromise: Promise<{
  bookmarks: SyncResult;
  notes: SyncResult;
}> | null = null;

export async function checkAndSyncOnOnline(userId?: string) {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return;
  }

  if (navigator.onLine && userId) {
    const syncQueue = await getSyncQueue();
    if (syncQueue.length > 0) {
      const wasRunning = !!currentSyncPromise;
      if (!wasRunning) {
        console.info("Syncing offline data...");
      }
      try {
        const results = await syncAllOfflineData();
        if (!wasRunning) {
          console.info("Sync completed:", results);
        }

        window.dispatchEvent(
          new CustomEvent("offline-sync-completed", {
            detail: results,
          }),
        );
      } catch (error) {
        console.error("Sync failed:", error);

        window.dispatchEvent(
          new CustomEvent("offline-sync-failed", {
            detail: error,
          }),
        );
      }
    }
  }
}


export async function syncAllOfflineData(): Promise<{
  bookmarks: SyncResult;
  notes: SyncResult;
}> {
  if (currentSyncPromise) {
    return currentSyncPromise;
  }

  currentSyncPromise = (async () => {
    const results = await Promise.allSettled([
      syncBookmarksToServer(),
      syncNotesToServer(),
    ]);

    const hasAnyRejected = results.some(r => r.status === 'rejected');

    const bookmarkResult = results[0].status === 'fulfilled'
      ? results[0].value
      : { success: false, syncedCount: 0, errors: [String(results[0].reason)] };

    const noteResult = results[1].status === 'fulfilled'
      ? results[1].value
      : { success: false, syncedCount: 0, errors: [String(results[1].reason)] };

    const syncResult = {
      bookmarks: bookmarkResult,
      notes: noteResult,
    };

    if (hasAnyRejected) {
      throw new Error('Sync failed');
    }

    return syncResult;
  })();

  try {
    return await currentSyncPromise;
  } finally {
    currentSyncPromise = null;
  }
}