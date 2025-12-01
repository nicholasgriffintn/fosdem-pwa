export const STORAGE_KEYS = {
  BOOKMARKS: 'fosdem_bookmarks',
  NOTES: 'fosdem_notes',
  SYNC_QUEUE: 'fosdem_sync_queue',
  SYNC_ENABLED: 'fosdem_sync_enabled',
} as const;

function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

function handleStorageError(error: unknown, operation: string): void {
  if (isQuotaExceededError(error)) {
    console.error(`Storage quota exceeded while ${operation}. Consider clearing old data.`);
    throw new Error(
      `Storage quota exceeded. Please clear some bookmarks or notes to free up space.`
    );
  }
  console.error(`Error ${operation}:`, error);
  throw error;
}

export function enableSync(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SYNC_ENABLED, 'true');
  } catch (error) {
    console.error('Error enabling sync:', error);
  }
}

export function disableSync(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SYNC_ENABLED, 'false');
  } catch (error) {
    console.error('Error disabling sync:', error);
  }
}

export function isSyncEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.SYNC_ENABLED) === 'true';
  } catch (error) {
    return false;
  }
}

export interface LocalBookmark {
  id: string;
  year: number;
  slug: string;
  type: string;
  status: string;
  created_at: string;
  updated_at?: string | null;
  user_id?: number | null;
  priority?: number | null;
  last_notification_sent_at?: string | null;
  serverId?: string;
}

export interface LocalNote {
  id: string;
  year: number;
  slug: string;
  note: string;
  time?: number | null;
  created_at: string;
  updated_at: string;
  serverId?: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'bookmark' | 'note';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
}

export function getLocalBookmarks(year?: number): LocalBookmark[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    if (!stored) return [];

    const bookmarks: LocalBookmark[] = JSON.parse(stored);
    return year ? bookmarks.filter(b => b.year === year) : bookmarks;
  } catch (error) {
    console.error('Error reading local bookmarks:', error);
    return [];
  }
}

export function saveLocalBookmark(bookmark: Omit<LocalBookmark, 'id' | 'created_at' | 'updated_at'> & { status: string }, skipSync?: boolean): LocalBookmark {
  const now = new Date().toISOString();
  const id = `${bookmark.year}_${bookmark.slug}_${Date.now()}`;

  const newBookmark: LocalBookmark = {
    id,
    ...bookmark,
    created_at: now,
    updated_at: now,
  };

  try {
    const existing = getLocalBookmarks();
    const updated = [...existing.filter(b => b.id !== id), newBookmark];
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));

    if (isSyncEnabled() && !skipSync) {
      addToSyncQueue({
        id,
        type: 'bookmark',
        action: 'create',
        data: newBookmark,
        timestamp: now,
      });
    }

    return newBookmark;
  } catch (error) {
    handleStorageError(error, 'saving local bookmark');
    throw error;
  }
}

export function updateLocalBookmark(id: string, updates: Partial<LocalBookmark> & { status?: string }, skipSync?: boolean): LocalBookmark | null {
  try {
    const existing = getLocalBookmarks();
    const index = existing.findIndex(b => b.id === id);

    if (index === -1) return null;

    const updatedBookmark: LocalBookmark = {
      ...existing[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    existing[index] = updatedBookmark;
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(existing));

    if (isSyncEnabled() && !skipSync) {
      addToSyncQueue({
        id,
        type: 'bookmark',
        action: 'update',
        data: updatedBookmark,
        timestamp: new Date().toISOString(),
      });
    }

    return updatedBookmark;
  } catch (error) {
    console.error('Error updating local bookmark:', error);
    return null;
  }
}

export function removeLocalBookmark(id: string, skipSync?: boolean): boolean {
  try {
    const existing = getLocalBookmarks();
    const filtered = existing.filter(b => b.id !== id);

    if (filtered.length === existing.length) return false;

    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(filtered));

    if (isSyncEnabled() && !skipSync) {
      addToSyncQueue({
        id,
        type: 'bookmark',
        action: 'delete',
        data: { id },
        timestamp: new Date().toISOString(),
      });
    }

    return true;
  } catch (error) {
    console.error('Error removing local bookmark:', error);
    return false;
  }
}

export function getLocalNotes(year?: number): LocalNote[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (!stored) return [];

    const notes: LocalNote[] = JSON.parse(stored);
    return year ? notes.filter(n => n.year === year) : notes;
  } catch (error) {
    console.error('Error reading local notes:', error);
    return [];
  }
}

export function saveLocalNote(note: Omit<LocalNote, 'id' | 'created_at' | 'updated_at'>, skipSync?: boolean): LocalNote {
  const now = new Date().toISOString();
  const id = `${note.year}_${note.slug}_${Date.now()}`;

  const newNote: LocalNote = {
    id,
    ...note,
    created_at: now,
    updated_at: now,
  };

  try {
    const existing = getLocalNotes();
    const updated = [...existing.filter(n => n.id !== id), newNote];
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updated));

    if (isSyncEnabled() && !skipSync) {
      addToSyncQueue({
        id,
        type: 'note',
        action: 'create',
        data: { ...newNote, content: newNote.note },
        timestamp: now,
      });
    }

    return newNote;
  } catch (error) {
    handleStorageError(error, 'saving local note');
    throw error;
  }
}

export function updateLocalNote(id: string, updates: Partial<LocalNote>, skipSync?: boolean): LocalNote | null {
  try {
    const existing = getLocalNotes();
    const index = existing.findIndex(n => n.id === id);

    if (index === -1) return null;

    const updatedNote: LocalNote = {
      ...existing[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    existing[index] = updatedNote;
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(existing));

    if (isSyncEnabled() && !skipSync) {
      addToSyncQueue({
        id,
        type: 'note',
        action: 'update',
        data: { ...updatedNote, content: updatedNote.note },
        timestamp: new Date().toISOString(),
      });
    }

    return updatedNote;
  } catch (error) {
    console.error('Error updating local note:', error);
    return null;
  }
}

export function removeLocalNote(id: string, skipSync?: boolean): boolean {
  try {
    const existing = getLocalNotes();
    const filtered = existing.filter(n => n.id !== id);

    if (filtered.length === existing.length) return false;

    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(filtered));

    if (isSyncEnabled() && !skipSync) {
      addToSyncQueue({
        id,
        type: 'note',
        action: 'delete',
        data: { id },
        timestamp: new Date().toISOString(),
      });
    }

    return true;
  } catch (error) {
    console.error('Error removing local note:', error);
    return false;
  }
}

export function getSyncQueue(): SyncQueueItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading sync queue:', error);
    return [];
  }
}

export function addToSyncQueue(item: SyncQueueItem): void {
  try {
    const existing = getSyncQueue();
    const updated = [...existing.filter(i => i.id !== item.id), item];
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(updated));
  } catch (error) {
    console.error('Error adding to sync queue:', error);
  }
}

export function removeFromSyncQueue(id: string): void {
  try {
    const existing = getSyncQueue();
    const filtered = existing.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing from sync queue:', error);
  }
}
