import { afterEach, beforeAll, vi } from "vitest";

const localStorageStore = new Map<string, string>();

beforeAll(() => {
	const localStorageMock: Storage = {
		getItem: (key: string) => localStorageStore.get(key) ?? null,
		setItem: (key: string, value: string) => {
			localStorageStore.set(key, String(value));
		},
		removeItem: (key: string) => {
			localStorageStore.delete(key);
		},
		clear: () => {
			localStorageStore.clear();
		},
		key: (index: number) => Array.from(localStorageStore.keys())[index] ?? null,
		get length() {
			return localStorageStore.size;
		},
	};

	Object.defineProperty(globalThis, "localStorage", {
		value: localStorageMock,
		writable: true,
	});
});

afterEach(() => {
	localStorageStore.clear();
	vi.restoreAllMocks();
	vi.clearAllMocks();
	vi.resetModules();
});
