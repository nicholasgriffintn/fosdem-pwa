import {
  type PersistedClient,
  type Persister,
} from "@tanstack/react-query-persist-client";

const DB_NAME = "fosdem_query_cache";
const DB_VERSION = 1;
const STORE_NAME = "query_cache";
const STORE_KEY: IDBValidKey = "react_query";

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
    return null;
  }

  return new Promise<IDBDatabase | null>((resolve, reject) => {
    const request = indexedDBFactory.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to open IndexedDB"));
  }).catch((error) => {
    console.error("Failed to open query cache database:", error);
    return null;
  });
}

async function readStore<T>(key: IDBValidKey): Promise<T | undefined> {
  const db = await openDatabase();
  if (!db) return undefined;

  const transaction = db.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const request = store.get(key);
  return requestToPromise<T | undefined>(request);
}

async function writeStore<T>(key: IDBValidKey, value: T): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  await requestToPromise(store.put(value, key));
}

async function deleteStore(key: IDBValidKey): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  await requestToPromise(store.delete(key));
}

export function createQueryPersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      await writeStore(STORE_KEY, client);
    },
    restoreClient: async () => {
      return readStore<PersistedClient>(STORE_KEY);
    },
    removeClient: async () => {
      await deleteStore(STORE_KEY);
    },
  };
}
