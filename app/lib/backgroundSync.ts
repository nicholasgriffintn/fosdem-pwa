import { getSyncQueue, removeFromSyncQueue } from "~/lib/localStorage";

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync: {
    register(tag: string): Promise<void>;
  };
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  errors: string[];
}

export async function syncBookmarksToServer(): Promise<SyncResult> {
  const syncQueue = getSyncQueue();
  const bookmarkItems = syncQueue.filter(item => item.type === 'bookmark');

  if (bookmarkItems.length === 0) {
    return { success: true, syncedCount: 0, errors: [] };
  }

  const results = [];

  for (const item of bookmarkItems) {
    try {
      if (item.action === 'create' || item.action === 'update') {
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            year: item.data.year,
            type: item.data.type,
            slug: item.data.slug,
            status: item.data.status,
          }),
        });

        if (response.ok) {
          results.push({ success: true, id: item.id });
          removeFromSyncQueue(item.id);
        } else {
          results.push({ success: false, id: item.id, error: response.statusText });
        }
      } else if (item.action === 'delete') {
        // TODO: Implement delete endpoint
        removeFromSyncQueue(item.id);
        results.push({ success: true, id: item.id });
      }
    } catch (error) {
      console.error('Sync error for bookmark:', item.id, error);
      results.push({ success: false, id: item.id, error: String(error) });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const errors = results.filter(r => !r.success).map(r => r.error || 'Unknown error');

  return {
    success: errors.length === 0,
    syncedCount: successCount,
    errors,
  };
}

export async function syncNotesToServer(): Promise<SyncResult> {
  const syncQueue = getSyncQueue();
  const noteItems = syncQueue.filter(item => item.type === 'note');

  if (noteItems.length === 0) {
    return { success: true, syncedCount: 0, errors: [] };
  }

  const results = [];

  for (const item of noteItems) {
    try {
      if (item.action === 'create' || item.action === 'update') {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            year: item.data.year,
            slug: item.data.slug,
            content: item.data.content,
          }),
        });

        if (response.ok) {
          results.push({ success: true, id: item.id });
          removeFromSyncQueue(item.id);
        } else {
          results.push({ success: false, id: item.id, error: response.statusText });
        }
      } else if (item.action === 'delete') {
        // TODO: Implement delete endpoint
        removeFromSyncQueue(item.id);
        results.push({ success: true, id: item.id });
      }
    } catch (error) {
      console.error('Sync error for note:', item.id, error);
      results.push({ success: false, id: item.id, error: String(error) });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const errors = results.filter(r => !r.success).map(r => r.error || 'Unknown error');

  return {
    success: errors.length === 0,
    syncedCount: successCount,
    errors,
  };
}

export async function syncAllOfflineData(): Promise<{
  bookmarks: SyncResult;
  notes: SyncResult;
}> {
  const [bookmarkResult, noteResult] = await Promise.all([
    syncBookmarksToServer(),
    syncNotesToServer(),
  ]);

  return {
    bookmarks: bookmarkResult,
    notes: noteResult,
  };
}

export function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      const registrationWithSync = registration as ServiceWorkerRegistrationWithSync;

      registrationWithSync.sync.register('bookmark-sync').catch((error: Error) => {
        console.error('Background sync registration failed:', error);
      });
    });
  } else {
    console.warn('Background sync not supported in this browser');
  }
}

export function checkAndSyncOnOnline(userId?: string) {
  if (navigator.onLine && userId) {
    const syncQueue = getSyncQueue();
    if (syncQueue.length > 0) {
      console.info('Syncing offline data...');
      syncAllOfflineData().then((results) => {
        console.info('Sync completed:', results);

        window.dispatchEvent(new CustomEvent('offline-sync-completed', {
          detail: results
        }));
      }).catch((error) => {
        console.error('Sync failed:', error);

        window.dispatchEvent(new CustomEvent('offline-sync-failed', {
          detail: error
        }));
      });
    }
  }
}
