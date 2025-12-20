import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	enableSync,
	disableSync,
	isSyncEnabled,
	getLocalBookmarks,
	saveLocalBookmark,
	updateLocalBookmark,
	removeLocalBookmark,
	getLocalNotes,
	saveLocalNote,
	updateLocalNote,
	removeLocalNote,
	getSyncQueue,
	addToSyncQueue,
	removeFromSyncQueue,
} from "~/lib/localStorage";

type StoreName = "bookmarks" | "notes" | "sync_queue";

interface FakeIDBContext {
	stores: Record<StoreName, Map<IDBValidKey, any>>;
}

function createRequest<T>(executor: () => T): IDBRequest<T> {
	const request = {} as IDBRequest<T>;
	queueMicrotask(() => {
		try {
			const result = executor();
			(request as any).result = result;
			request.onsuccess?.({ target: request } as unknown as Event);
		} catch (error) {
			(request as any).error = error;
			request.onerror?.({ target: request } as unknown as Event);
		}
	});
	return request;
}

class FakeObjectStore {
	constructor(private store: Map<IDBValidKey, any>) { }

	getAll() {
		return createRequest(() => Array.from(this.store.values()));
	}

	get(key: IDBValidKey) {
		return createRequest(() => this.store.get(key));
	}

	put(value: any) {
		const id = value.id ?? crypto.randomUUID();
		this.store.set(id, value);
		return createRequest(() => value);
	}

	delete(key: IDBValidKey) {
		this.store.delete(key);
		return createRequest(() => undefined);
	}
}

class FakeDatabase {
	constructor(private context: FakeIDBContext) { }

	get objectStoreNames() {
		const ctx = this.context;
		return {
			contains: (name: string) => ctx.stores[name as StoreName] !== undefined,
			item: (index: number) => Object.keys(ctx.stores)[index] ?? null,
			get length() {
				return Object.keys(ctx.stores).length;
			},
		} as unknown as DOMStringList;
	}

	createObjectStore(name: string) {
		const storeName = name as StoreName;
		if (!this.context.stores[storeName]) {
			this.context.stores[storeName] = new Map();
		}
		return new FakeObjectStore(this.context.stores[storeName]);
	}

	transaction(storeName: string) {
		const target = storeName as StoreName;
		if (!this.context.stores[target]) {
			this.context.stores[target] = new Map();
		}
		return {
			objectStore: () => new FakeObjectStore(this.context.stores[target]),
		};
	}
}

class FakeIndexedDBFactory {
	constructor(private db: FakeDatabase) { }

	open() {
		const request = {} as IDBOpenDBRequest;
		queueMicrotask(() => {
			(request as any).result = this.db as unknown as IDBDatabase;
			// @ts-ignore
			request.onupgradeneeded?.({ target: request });
			// @ts-ignore
			request.onsuccess?.({ target: request });
		});
		return request;
	}
}

let context: FakeIDBContext;

function setupIndexedDb() {
	context = {
		stores: {
			bookmarks: new Map(),
			notes: new Map(),
			sync_queue: new Map(),
		},
	};

	const factory = new FakeIndexedDBFactory(new FakeDatabase(context));
	Object.defineProperty(globalThis, "indexedDB", {
		value: factory,
		configurable: true,
	});
}

beforeEach(() => {
	setupIndexedDb();
	vi.useFakeTimers();
	vi.setSystemTime(new Date("2024-02-03T10:00:00Z"));
});

afterEach(() => {
	vi.useRealTimers();
});

describe("local storage helpers", () => {
	it("toggles sync flags via localStorage", () => {
		expect(isSyncEnabled()).toBe(false);
		enableSync();
		expect(isSyncEnabled()).toBe(true);
		disableSync();
		expect(isSyncEnabled()).toBe(false);
	});

	it("saves, updates, filters, and removes local bookmarks", async () => {
		enableSync();
		const bookmark = await saveLocalBookmark(
			{
				year: 2024,
				slug: "event",
				type: "talk",
				status: "favourited",
			},
			false,
		);

		const all = await getLocalBookmarks();
		expect(all).toHaveLength(1);

		const filtered = await getLocalBookmarks(2023);
		expect(filtered).toHaveLength(0);

		const updated = await updateLocalBookmark(bookmark.id, {
			status: "unfavourited",
		});
		expect(updated?.status).toBe("unfavourited");

		const deleted = await removeLocalBookmark(bookmark.id);
		expect(deleted).toBe(true);

		const queue = await getSyncQueue();
		const bookmarkEntry = queue.filter(
			(q) => q.type === "bookmark" && q.id === bookmark.id,
		);
		expect(bookmarkEntry).toHaveLength(1);
		expect(bookmarkEntry[0]?.action).toBe("delete");
	});

	it("saves, updates, and removes local notes", async () => {
		enableSync();
		const note = await saveLocalNote(
			{
				year: 2024,
				slug: "event",
				note: "Remember this",
				time: 120,
			},
			false,
		);

		const notes = await getLocalNotes();
		expect(notes).toHaveLength(1);

		const updated = await updateLocalNote(note.id, {
			note: "New note",
		});
		expect(updated?.note).toBe("New note");

		const removed = await removeLocalNote(note.id);
		expect(removed).toBe(true);

		const queue = await getSyncQueue();
		const noteEntries = queue.filter(
			(q) => q.type === "note" && q.id === note.id,
		);
		expect(noteEntries).toHaveLength(1);
		expect(noteEntries[0]?.action).toBe("delete");
	});

	it("manages the sync queue", async () => {
		await addToSyncQueue({
			id: "queue-item",
			type: "bookmark",
			action: "create",
			data: {},
			timestamp: new Date().toISOString(),
		});

		const queue = await getSyncQueue();
		expect(queue.some((item) => item.id === "queue-item")).toBe(true);

		await removeFromSyncQueue("queue-item");
		const afterRemoval = await getSyncQueue();
		expect(afterRemoval.some((item) => item.id === "queue-item")).toBe(false);
	});

	it("filters out invalid notes when retrieving", async () => {
		const validNote = await saveLocalNote({
			year: 2024,
			slug: "valid-event",
			note: "Valid note",
			time: 100,
		});

		const invalidNote = {
			id: "invalid-note",
			year: null as any,
			slug: "",
			note: "",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		context.stores.notes.set(invalidNote.id, invalidNote);

		const notes = await getLocalNotes();

		expect(notes.some((n) => n.id === validNote.id)).toBe(true);
		expect(notes.some((n) => n.id === invalidNote.id)).toBe(false);
	});

	it("handles errors during invalid note cleanup gracefully", async () => {
		const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const validNote = await saveLocalNote({
			year: 2024,
			slug: "valid-event",
			note: "Valid note",
			time: 100,
		});

		const invalidNote = {
			id: "invalid-note",
			year: null as any,
			slug: "",
			note: "",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		context.stores.notes.set(invalidNote.id, invalidNote);

		const originalDelete = context.stores.notes.delete.bind(context.stores.notes);
		context.stores.notes.delete = vi.fn(() => {
			throw new Error("Storage quota exceeded");
		});

		const notes = await getLocalNotes();

		expect(notes.some((n) => n.id === validNote.id)).toBe(true);

		await vi.runAllTimersAsync();

		context.stores.notes.delete = originalDelete;
		consoleWarnSpy.mockRestore();
	});
});
