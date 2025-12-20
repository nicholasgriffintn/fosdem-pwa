import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";

vi.mock("@tanstack/react-start", () => ({
	useServerFn: (fn: unknown) => fn,
}));

const localBookmarksStore: any[] = [];

vi.mock("~/lib/localStorage", () => {
	return {
		getLocalBookmarks: vi.fn(async (year?: number) => {
			if (typeof year === "number") {
				return localBookmarksStore.filter((bookmark) => bookmark.year === year);
			}
			return [...localBookmarksStore];
		}),
		saveLocalBookmark: vi.fn(async (bookmarkData: any) => {
			const stored = {
				id: `${bookmarkData.year}_${bookmarkData.slug}`,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				...bookmarkData,
			};
			const index = localBookmarksStore.findIndex((b) => b.id === stored.id);
			if (index === -1) {
				localBookmarksStore.push(stored);
			} else {
				localBookmarksStore[index] = stored;
			}
			return stored;
		}),
		removeLocalBookmark: vi.fn(async (id: string) => {
			const index = localBookmarksStore.findIndex((bookmark) => bookmark.id === id);
			if (index === -1) return false;
			localBookmarksStore.splice(index, 1);
			return true;
		}),
		updateLocalBookmark: vi.fn(async (id: string, updates: Record<string, unknown>) => {
			const target = localBookmarksStore.find((bookmark) => bookmark.id === id);
			if (!target) return null;
			Object.assign(target, updates);
			target.updated_at = new Date().toISOString();
			return target;
		}),
		removeFromSyncQueue: vi.fn(async () => { }),
	};
});

const bookmarkServerMocks = vi.hoisted(() => ({
	createBookmark: vi.fn(),
	updateBookmark: vi.fn(),
}));

vi.mock("~/server/functions/bookmarks", () => bookmarkServerMocks);

vi.mock("~/hooks/use-auth", () => ({
	useAuth: vi.fn(() => ({
		user: { id: "user-1" },
	})),
}));

import { useAuth } from "~/hooks/use-auth";
import {
	getLocalBookmarks,
	removeFromSyncQueue,
	removeLocalBookmark as removeLocalBookmarkFromStorage,
	saveLocalBookmark,
	updateLocalBookmark as updateLocalBookmarkFromStorage,
} from "~/lib/localStorage";
import { createBookmark, updateBookmark } from "~/server/functions/bookmarks";

const useAuthMock = vi.mocked(useAuth);
const getLocalBookmarksMock = vi.mocked(getLocalBookmarks);
const saveLocalBookmarkMock = vi.mocked(saveLocalBookmark);
const removeLocalBookmarkMock = vi.mocked(removeLocalBookmarkFromStorage);
const updateLocalBookmarkMock = vi.mocked(updateLocalBookmarkFromStorage);
const removeFromSyncQueueMock = vi.mocked(removeFromSyncQueue);
const serverCreateBookmarkMock = vi.mocked(createBookmark);
const serverUpdateBookmarkMock = vi.mocked(updateBookmark);

const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
	return { wrapper, queryClient };
};

const favouritedBookmark = {
	year: 2024,
	type: "event",
	slug: "event-1",
	status: "favourited",
};

describe("useMutateBookmark", () => {
	beforeEach(() => {
		localBookmarksStore.length = 0;
		getLocalBookmarksMock.mockClear();
		saveLocalBookmarkMock.mockClear();
		removeLocalBookmarkMock.mockClear();
		updateLocalBookmarkMock.mockClear();
		removeFromSyncQueueMock.mockClear();
		serverCreateBookmarkMock.mockReset();
		serverUpdateBookmarkMock.mockReset();
		serverCreateBookmarkMock.mockResolvedValue({ success: true });
		serverUpdateBookmarkMock.mockResolvedValue({ success: true });
		// @ts-ignore - test
		useAuthMock.mockReturnValue({ user: { id: "user-1" } });
	});

	it("creates local bookmarks optimistically and syncs to the server", async () => {
		const { wrapper, queryClient } = createWrapper();
		const { result } = renderHook(() => useMutateBookmark({ year: 2024 }), {
			wrapper,
		});

		await act(async () => {
			await result.current.create(favouritedBookmark);
		});

		expect(saveLocalBookmarkMock).toHaveBeenCalledWith(
			expect.objectContaining({ slug: "event-1" }),
		);
		expect(serverCreateBookmarkMock).toHaveBeenCalledWith({
			data: favouritedBookmark,
		});
		await waitFor(() => {
			expect(removeFromSyncQueueMock).toHaveBeenCalledWith("2024_event-1");
		});
		queryClient.clear();
	});

	it("removes local entries when unfavouriting and propagates the change", async () => {
		localBookmarksStore.push({
			id: "2024_event-1",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			...favouritedBookmark,
		});

		const { wrapper, queryClient } = createWrapper();
		const { result } = renderHook(() => useMutateBookmark({ year: 2024 }), {
			wrapper,
		});

		await act(async () => {
			await result.current.create({
				...favouritedBookmark,
				status: "unfavourited",
			});
		});

		expect(removeLocalBookmarkMock).toHaveBeenCalledWith("2024_event-1");
		expect(serverCreateBookmarkMock).toHaveBeenCalledWith({
			data: {
				...favouritedBookmark,
				status: "unfavourited",
			},
		});
		queryClient.clear();
	});

	it("updates remote bookmarks using the stored server id", async () => {
		localBookmarksStore.push({
			id: "2024_event-1",
			serverId: "server-1",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			...favouritedBookmark,
		});

		const { wrapper, queryClient } = createWrapper();
		const { result } = renderHook(() => useMutateBookmark({ year: 2024 }), {
			wrapper,
		});

		await act(async () => {
			await result.current.update("2024_event-1", { status: "unfavourited" });
		});

		expect(updateLocalBookmarkMock).toHaveBeenCalledWith(
			"2024_event-1",
			expect.objectContaining({ status: "unfavourited" }),
		);
		expect(serverUpdateBookmarkMock).toHaveBeenCalledWith({
			data: {
				id: "server-1",
				updates: expect.objectContaining({ status: "unfavourited" }),
			},
		});
		queryClient.clear();
	});
});
