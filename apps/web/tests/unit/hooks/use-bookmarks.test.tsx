import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBookmarks } from "~/hooks/use-bookmarks";
import { isNumber } from "~/lib/type-guards";

vi.mock("@tanstack/react-start", () => ({
	useServerFn: (fn: unknown) => fn,
}));

const localBookmarksStore: any[] = [];

vi.mock("~/lib/localStorage", () => {
	return {
		getLocalBookmarks: vi.fn(async (year?: number) => {
			if (isNumber(year)) {
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
		updateLocalBookmark: vi.fn(async (id: string, updates: Record<string, unknown>) => {
			const target = localBookmarksStore.find((bookmark) => bookmark.id === id);
			if (!target) {
				return null;
			}
			Object.assign(target, updates);
			target.updated_at = new Date().toISOString();
			return target;
		}),
	};
});

const serverBookmarkMocks = vi.hoisted(() => ({
	getBookmarks: vi.fn(),
}));

vi.mock("~/server/functions/bookmarks", () => serverBookmarkMocks);

vi.mock("~/hooks/use-auth", () => ({
	useAuth: vi.fn(),
}));

import { useAuth } from "~/hooks/use-auth";
import {
	getLocalBookmarks,
	saveLocalBookmark,
	updateLocalBookmark,
} from "~/lib/localStorage";
import { getBookmarks } from "~/server/functions/bookmarks";

const useAuthMock = vi.mocked(useAuth);
const getLocalBookmarksMock = vi.mocked(getLocalBookmarks);
const saveLocalBookmarkMock = vi.mocked(saveLocalBookmark);
const updateLocalBookmarkMock = vi.mocked(updateLocalBookmark);
const serverGetBookmarksMock = vi.mocked(getBookmarks);

const createLocalBookmark = (overrides: Record<string, unknown>) => ({
	id: `${overrides.year}_${overrides.slug}`,
	slug: "event-local",
	type: "event",
	status: "favourited",
	year: 2024,
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	...overrides,
});

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

describe("useBookmarks", () => {
	beforeEach(() => {
		localBookmarksStore.length = 0;
		getLocalBookmarksMock.mockClear();
		saveLocalBookmarkMock.mockClear();
		updateLocalBookmarkMock.mockClear();
		serverGetBookmarksMock.mockClear();
		// @ts-ignore - test
		useAuthMock.mockReturnValue({ user: { id: "user-1" } });
	});

	it("merges local and server bookmarks for authenticated users", async () => {
		localBookmarksStore.push(
			createLocalBookmark({
				id: "2024_event-local",
				slug: "event-local",
			}),
		);

		serverGetBookmarksMock.mockResolvedValue([
			// @ts-ignore - test
			{
				id: "srv-1",
				slug: "event-remote",
				type: "event",
				year: 2024,
				status: "favourited",
			},
		]);

		const { wrapper, queryClient } = createWrapper();
		const { result } = renderHook(() => useBookmarks({ year: 2024 }), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.bookmarks).toHaveLength(2);
		});

		const mergedSlugs = result.current.bookmarks.map((bookmark) => bookmark.slug);
		expect(mergedSlugs).toContain("event-local");
		expect(mergedSlugs).toContain("event-remote");
		const remoteBookmark = result.current.bookmarks.find(
			(bookmark) => bookmark.slug === "event-remote",
		);
		expect(remoteBookmark?.existsOnServer).toBe(true);
		queryClient.clear();
	});

	it("returns only local bookmarks when unauthenticated", async () => {
		// @ts-ignore - test
		useAuthMock.mockReturnValue({ user: null });
		localBookmarksStore.push(
			createLocalBookmark({
				id: "2024_only-local",
				slug: "only-local",
			}),
		);

		const { wrapper, queryClient } = createWrapper();
		const { result } = renderHook(() => useBookmarks({ year: 2024 }), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.bookmarks).toHaveLength(1);
		});

		expect(serverGetBookmarksMock).not.toHaveBeenCalled();
		expect(result.current.bookmarks[0]?.slug).toBe("only-local");
		queryClient.clear();
	});

	it("reconciles missing local records from the server", async () => {
		localBookmarksStore.length = 0;
		serverGetBookmarksMock.mockResolvedValue([
			// @ts-ignore - test
			{
				id: "srv-sync",
				slug: "event-sync",
				type: "event",
				year: 2024,
				status: "favourited",
			},
		]);

		const { wrapper, queryClient } = createWrapper();
		const { result } = renderHook(() => useBookmarks({ year: 2024 }), {
			wrapper,
		});

		await waitFor(() => {
			expect(saveLocalBookmarkMock).toHaveBeenCalledWith(
				expect.objectContaining({
					slug: "event-sync",
					serverId: "srv-sync",
				}),
				true,
			);
		});

		await waitFor(() => {
			expect(result.current.bookmarks).toHaveLength(1);
		});

		expect(result.current.bookmarks[0]?.slug).toBe("event-sync");
		expect(result.current.bookmarks[0]?.existsOnServer).toBe(true);
		queryClient.clear();
	});
});
