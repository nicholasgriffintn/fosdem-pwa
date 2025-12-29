const DB_NAME = "fosdem_offline";
const DB_VERSION = 1;

import { isValidNote } from "./type-guards";

const STORE_NAMES = {
  BOOKMARKS: "bookmarks",
  NOTES: "notes",
  SYNC_QUEUE: "sync_queue",
} as const;

const SYNC_ENABLED_KEY = "fosdem_sync_enabled";

type StoreName = (typeof STORE_NAMES)[keyof typeof STORE_NAMES];

let dbPromise: Promise<IDBDatabase | null> | null = null;

function getIndexedDBFactory(): IDBFactory | undefined {
  if (typeof globalThis === "undefined") {
    return undefined;
  }

  const globalRef = globalThis as typeof globalThis & {
    indexedDB?: IDBFactory;
  };

  return globalRef.indexedDB;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

async function openDatabase(): Promise<IDBDatabase | null> {
  const indexedDBFactory = getIndexedDBFactory();
  if (!indexedDBFactory) {
    console.warn("IndexedDB is not supported in this environment.");
    return null;
  }

  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase | null>((resolve, reject) => {
      const request = indexedDBFactory.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAMES.BOOKMARKS)) {
          db.createObjectStore(STORE_NAMES.BOOKMARKS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_NAMES.NOTES)) {
          db.createObjectStore(STORE_NAMES.NOTES, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_NAMES.SYNC_QUEUE)) {
          db.createObjectStore(STORE_NAMES.SYNC_QUEUE, { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error ?? new Error("Failed to open IndexedDB"));
      request.onblocked = () => {
        const error = new Error("IndexedDB_BLOCKED");
        console.warn(
          "IndexedDB upgrade blocked. Please close other tabs using this app."
        );
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent("indexeddb-blocked", {
              detail: { message: "Please close other tabs to enable offline features" },
            })
          );
        }
        reject(error);
      };
    }).catch((error) => {
      console.error("Failed to open IndexedDB database:", error);
      dbPromise = null;
      return null;
    });
  }

  return dbPromise;
}

async function getAllFromStore<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDatabase();
  if (!db) return [];

  const transaction = db.transaction(storeName, "readonly");
  const store = transaction.objectStore(storeName);
  const request = store.getAll();

  try {
    const result = await requestToPromise<T[]>(request);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error(`Error reading from ${storeName}:`, error);
    return [];
  }
}

async function getFromStore<T>(
  storeName: StoreName,
  key: IDBValidKey
): Promise<T | null> {
  const db = await openDatabase();
  if (!db) return null;

  const transaction = db.transaction(storeName, "readonly");
  const store = transaction.objectStore(storeName);
  const request = store.get(key);

  try {
    const result = await requestToPromise<T | undefined>(request);
    return result ?? null;
  } catch (error) {
    console.error(`Error reading record from ${storeName}:`, error);
    return null;
  }
}

async function putInStore<T>(storeName: StoreName, value: T): Promise<void> {
  const db = await openDatabase();
  if (!db) {
    throw new Error("IndexedDB is not available.");
  }

  const transaction = db.transaction(storeName, "readwrite");
  const store = transaction.objectStore(storeName);
  const request = store.put(value);

  await requestToPromise(request);
}

async function deleteFromStore(storeName: StoreName, key: IDBValidKey): Promise<void> {
  const db = await openDatabase();
  if (!db) {
    throw new Error("IndexedDB is not available.");
  }

  const transaction = db.transaction(storeName, "readwrite");
  const store = transaction.objectStore(storeName);
  const request = store.delete(key);

  await requestToPromise(request);
}

function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

function handleStorageError(error: unknown, operation: string): never {
  if (isQuotaExceededError(error)) {
    console.error(
      `Storage quota exceeded while ${operation}. Consider clearing old data.`
    );
    throw new Error(
      "Storage quota exceeded. Please clear some bookmarks or notes to free up space."
    );
  }

  console.error(`Error ${operation}:`, error);
  if (error instanceof Error) {
    throw error;
  }
  throw new Error(String(error));
}

function validateNoteInput(
  note: Partial<Omit<LocalNote, "id" | "created_at" | "updated_at">>
): asserts note is Omit<LocalNote, "id" | "created_at" | "updated_at"> {
  if (typeof note.year !== "number" || Number.isNaN(note.year)) {
    throw new Error("Local note must include a numeric year");
  }

  if (!note.slug) {
    throw new Error("Local note must include a slug");
  }

  if (typeof note.note !== "string") {
    throw new Error("Local note content is required");
  }
}

export function enableSync(): void {
  try {
    localStorage.setItem(SYNC_ENABLED_KEY, "true");
  } catch (error) {
    console.error("Error enabling sync:", error);
  }
}

export function disableSync(): void {
  try {
    localStorage.setItem(SYNC_ENABLED_KEY, "false");
  } catch (error) {
    console.error("Error disabling sync:", error);
  }
}

export function isSyncEnabled(): boolean {
  try {
    return localStorage.getItem(SYNC_ENABLED_KEY) === "true";
  } catch {
    return false;
  }
}

export interface LocalBookmark {
  id: string;
  year: number;
  slug: string;
  type: string;
  status: string;
  watch_later?: boolean | null;
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
  type: "bookmark" | "note";
  action: "create" | "update" | "delete";
  data: any;
  timestamp: string;
  retryCount?: number;
  lastAttempt?: string;
}

export async function getLocalBookmarks(year?: number): Promise<LocalBookmark[]> {
  try {
    const bookmarks = await getAllFromStore<LocalBookmark>(STORE_NAMES.BOOKMARKS);
    return year ? bookmarks.filter((b) => b.year === year) : bookmarks;
  } catch (error) {
    console.error("Error reading local bookmarks:", error);
    return [];
  }
}

export async function saveLocalBookmark(
  bookmark: Omit<LocalBookmark, "id" | "created_at" | "updated_at"> & {
    status: string;
  },
  skipSync?: boolean
): Promise<LocalBookmark> {
  const now = new Date().toISOString();
  const id = `${bookmark.year}_${bookmark.slug}`;

  const existing = await getFromStore<LocalBookmark>(STORE_NAMES.BOOKMARKS, id);
  const createdAt = existing?.created_at ?? now;

  const newBookmark: LocalBookmark = {
    id,
    ...bookmark,
    created_at: createdAt,
    updated_at: now,
  };

  try {
    await putInStore(STORE_NAMES.BOOKMARKS, newBookmark);

    if (isSyncEnabled() && !skipSync) {
      await addToSyncQueue({
        id,
        type: "bookmark",
        action: existing ? "update" : "create",
        data: newBookmark,
        timestamp: now,
      });
    }

    return newBookmark;
  } catch (error) {
    handleStorageError(error, "saving local bookmark");
  }
}

export async function updateLocalBookmark(
  id: string,
  updates: Partial<LocalBookmark> & { status?: string },
  skipSync?: boolean
): Promise<LocalBookmark | null> {
  try {
    const existing = await getFromStore<LocalBookmark>(STORE_NAMES.BOOKMARKS, id);
    if (!existing) return null;

    const updatedBookmark: LocalBookmark = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await putInStore(STORE_NAMES.BOOKMARKS, updatedBookmark);

    if (isSyncEnabled() && !skipSync) {
      await addToSyncQueue({
        id,
        type: "bookmark",
        action: "update",
        data: updatedBookmark,
        timestamp: updatedBookmark.updated_at ?? new Date().toISOString(),
      });
    }

    return updatedBookmark;
  } catch (error) {
    console.error("Error updating local bookmark:", error);
    return null;
  }
}

export async function removeLocalBookmark(
  id: string,
  skipSync?: boolean
): Promise<boolean> {
  try {
    const existing = await getFromStore<LocalBookmark>(STORE_NAMES.BOOKMARKS, id);
    if (!existing) return false;

    await deleteFromStore(STORE_NAMES.BOOKMARKS, id);

    if (isSyncEnabled() && !skipSync) {
      await addToSyncQueue({
        id,
        type: "bookmark",
        action: "delete",
        data: { id, serverId: existing.serverId },
        timestamp: new Date().toISOString(),
      });
    }

    return true;
  } catch (error) {
    console.error("Error removing local bookmark:", error);
    return false;
  }
}

export async function getLocalNotes(year?: number): Promise<LocalNote[]> {
  try {
    const notes = await getAllFromStore<LocalNote>(STORE_NAMES.NOTES);
    const partitioned = notes.reduce(
      (acc, note) => {
        if (isValidNote(note)) {
          acc.valid.push(note);
        } else {
          acc.invalid.push(note);
        }
        return acc;
      },
      { valid: [] as LocalNote[], invalid: [] as LocalNote[] }
    );
    const { valid: validNotes, invalid: invalidNotes } = partitioned;

    if (invalidNotes.length > 0) {
      try {
        await Promise.allSettled(
          invalidNotes.map((note) => deleteFromStore(STORE_NAMES.NOTES, note.id))
        );
      } catch (error) {
        console.warn("Failed to clean invalid local notes:", error);
      }
    }

    return year ? validNotes.filter((n) => n.year === year) : validNotes;
  } catch (error) {
    console.error("Error reading local notes:", error);
    return [];
  }
}

export async function saveLocalNote(
  note: Omit<LocalNote, "id" | "created_at" | "updated_at">,
  skipSync?: boolean
): Promise<LocalNote> {
  validateNoteInput(note);
  const now = new Date().toISOString();
  const id = `${note.year}_${note.slug}_${Date.now()}`;

  const newNote: LocalNote = {
    id,
    ...note,
    created_at: now,
    updated_at: now,
  };

  try {
    await putInStore(STORE_NAMES.NOTES, newNote);

    if (isSyncEnabled() && !skipSync) {
      await addToSyncQueue({
        id,
        type: "note",
        action: "create",
        data: { ...newNote, content: newNote.note },
        timestamp: now,
      });
    }

    return newNote;
  } catch (error) {
    handleStorageError(error, "saving local note");
  }
}

export async function updateLocalNote(
  id: string,
  updates: Partial<LocalNote>,
  skipSync?: boolean
): Promise<LocalNote | null> {
  try {
    const existing = await getFromStore<LocalNote>(STORE_NAMES.NOTES, id);
    if (!existing) return null;

    const updatedNote: LocalNote = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    validateNoteInput(updatedNote);

    await putInStore(STORE_NAMES.NOTES, updatedNote);

    if (isSyncEnabled() && !skipSync) {
      await addToSyncQueue({
        id,
        type: "note",
        action: "update",
        data: { ...updatedNote, content: updatedNote.note },
        timestamp: updatedNote.updated_at ?? new Date().toISOString(),
      });
    }

    return updatedNote;
  } catch (error) {
    console.error("Error updating local note:", error);
    return null;
  }
}

export async function removeLocalNote(id: string, skipSync?: boolean): Promise<boolean> {
  try {
    const existing = await getFromStore<LocalNote>(STORE_NAMES.NOTES, id);
    if (!existing) return false;

    await deleteFromStore(STORE_NAMES.NOTES, id);

    if (isSyncEnabled() && !skipSync) {
      await addToSyncQueue({
        id,
        type: "note",
        action: "delete",
        data: { id, serverId: existing.serverId },
        timestamp: new Date().toISOString(),
      });
    }

    return true;
  } catch (error) {
    console.error("Error removing local note:", error);
    return false;
  }
}

const SYNC_QUEUE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_RETRY_COUNT = 10;

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const items = await getAllFromStore<SyncQueueItem>(STORE_NAMES.SYNC_QUEUE);
    const now = Date.now();
    const validItems: SyncQueueItem[] = [];
    const expiredIds: string[] = [];

    for (const item of items) {
      const itemAge = now - new Date(item.timestamp).getTime();
      const exceedsRetries = (item.retryCount ?? 0) >= MAX_RETRY_COUNT;

      if (itemAge > SYNC_QUEUE_TTL_MS || exceedsRetries) {
        expiredIds.push(item.id);
      } else {
        validItems.push(item);
      }
    }

    if (expiredIds.length > 0) {
      await Promise.allSettled(
        expiredIds.map((id) => deleteFromStore(STORE_NAMES.SYNC_QUEUE, id))
      );
    }

    return validItems;
  } catch (error) {
    console.error("Error reading sync queue:", error);
    return [];
  }
}

export async function addToSyncQueue(item: SyncQueueItem): Promise<void> {
  try {
    const existingItem = await getFromStore<SyncQueueItem>(STORE_NAMES.SYNC_QUEUE, item.id);
    const queueItem: SyncQueueItem = {
      ...item,
      retryCount: existingItem ? (existingItem.retryCount ?? 0) + 1 : 0,
      lastAttempt: new Date().toISOString(),
    };
    await putInStore(STORE_NAMES.SYNC_QUEUE, queueItem);
  } catch (error) {
    console.error("Error adding to sync queue:", error);
  }
}

export async function removeFromSyncQueue(id: string): Promise<void> {
  try {
    await deleteFromStore(STORE_NAMES.SYNC_QUEUE, id);
  } catch (error) {
    console.error("Error removing from sync queue:", error);
  }
}
