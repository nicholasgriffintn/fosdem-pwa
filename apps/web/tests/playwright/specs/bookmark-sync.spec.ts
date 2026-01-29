import { expect, test } from "@playwright/test";

const DB_NAME = "fosdem_offline";
const DB_VERSION = 1;

async function seedLocalBookmark(page: any, { year, slug }: { year: number; slug: string }) {
	await page.evaluate(
		async ({ year, slug, dbName, dbVersion }) => {
			const openDb = () =>
				new Promise<IDBDatabase>((resolve, reject) => {
					const request = indexedDB.open(dbName, dbVersion);

					request.onupgradeneeded = () => {
						const db = request.result;
						const stores = ["bookmarks", "notes", "sync_queue"];
						for (const storeName of stores) {
							if (!db.objectStoreNames.contains(storeName)) {
								db.createObjectStore(storeName, { keyPath: "id" });
							}
						}
					};

					request.onsuccess = () => resolve(request.result);
					request.onerror = () => reject(request.error);
				});

			const clearStore = (db: IDBDatabase, storeName: string) =>
				new Promise<void>((resolve, reject) => {
					const transaction = db.transaction(storeName, "readwrite");
					const store = transaction.objectStore(storeName);
					const request = store.clear();
					request.onsuccess = () => resolve();
					request.onerror = () => reject(request.error);
				});

			const putBookmark = (db: IDBDatabase, bookmark: Record<string, unknown>) =>
				new Promise<void>((resolve, reject) => {
					const transaction = db.transaction("bookmarks", "readwrite");
					const store = transaction.objectStore("bookmarks");
					const request = store.put(bookmark);
					request.onsuccess = () => resolve();
					request.onerror = () => reject(request.error);
				});

			const db = await openDb();
			await clearStore(db, "bookmarks");
			await clearStore(db, "sync_queue");

			const now = new Date().toISOString();
			await putBookmark(db, {
				id: `${year}_${slug}`,
				year,
				slug,
				type: "event",
				status: "favourited",
				created_at: now,
				updated_at: now,
			});

			db.close();
		},
		{ year, slug, dbName: DB_NAME, dbVersion: DB_VERSION },
	);
}

async function getLocalBookmarkServerId(page: any, id: string) {
	return page.evaluate(
		async ({ id, dbName, dbVersion }) => {
			const openDb = () =>
				new Promise<IDBDatabase>((resolve, reject) => {
					const request = indexedDB.open(dbName, dbVersion);
					request.onsuccess = () => resolve(request.result);
					request.onerror = () => reject(request.error);
				});

			const readBookmark = (db: IDBDatabase, key: string) =>
				new Promise<any>((resolve, reject) => {
					const transaction = db.transaction("bookmarks", "readonly");
					const store = transaction.objectStore("bookmarks");
					const request = store.get(key);
					request.onsuccess = () => resolve(request.result ?? null);
					request.onerror = () => reject(request.error);
				});

			const db = await openDb();
			const bookmark = await readBookmark(db, id);
			db.close();
			return bookmark?.serverId ?? null;
		},
		{ id, dbName: DB_NAME, dbVersion: DB_VERSION },
	);
}

test.describe("Bookmark sync on login", () => {
	test("queues and syncs local bookmarks created before sign-in", async ({ page }) => {
		const year = 2026;
		const slug = "sync-test-event";
		const bookmarkId = `${year}_${slug}`;

		await page.goto("/signin");
		await seedLocalBookmark(page, { year, slug });

		await page.getByRole("button", { name: /Continue as Guest/i }).click();
		await page.waitForURL(/\/(\?|$)/);

		await page.goto("/bookmarks");
		await expect(
			page.getByRole("heading", { level: 1, name: "Bookmarks" }),
		).toBeVisible();

		await page.waitForFunction(
			async ({ id, dbName, dbVersion }) => {
				const openDb = () =>
					new Promise<IDBDatabase>((resolve, reject) => {
						const request = indexedDB.open(dbName, dbVersion);
						request.onsuccess = () => resolve(request.result);
						request.onerror = () => reject(request.error);
					});

				const readBookmark = (db: IDBDatabase, key: string) =>
					new Promise<any>((resolve, reject) => {
						const transaction = db.transaction("bookmarks", "readonly");
						const store = transaction.objectStore("bookmarks");
						const request = store.get(key);
						request.onsuccess = () => resolve(request.result ?? null);
						request.onerror = () => reject(request.error);
					});

				const db = await openDb();
				const bookmark = await readBookmark(db, id);
				db.close();
				return Boolean(bookmark?.serverId);
			},
			{ id: bookmarkId, dbName: DB_NAME, dbVersion: DB_VERSION },
			{ timeout: 30_000 },
		);

		const serverId = await getLocalBookmarkServerId(page, bookmarkId);
		expect(serverId).toBeTruthy();
	});
});
