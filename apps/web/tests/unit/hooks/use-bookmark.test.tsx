import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { createQueryClientWrapper } from "../../utils/queryClient";
import { useBookmark } from "~/hooks/use-bookmark";
import { getLocalBookmarks } from "~/lib/localStorage";
import { getEventBookmark } from "~/server/functions/bookmarks";
import { useAuth } from "~/hooks/use-auth";

vi.mock("@tanstack/react-start", () => ({
	useServerFn: (fn: unknown) => fn,
}));

const localStorageMocks = vi.hoisted(() => ({
	getLocalBookmarks: vi.fn(),
}));

vi.mock("~/lib/localStorage", () => localStorageMocks);

const serverBookmarkMocks = vi.hoisted(() => ({
	getEventBookmark: vi.fn(),
}));

vi.mock("~/server/functions/bookmarks", () => serverBookmarkMocks);

vi.mock("~/hooks/use-auth", () => ({
	useAuth: vi.fn(),
}));

const getLocalBookmarksMock = vi.mocked(getLocalBookmarks);
const getEventBookmarkMock = vi.mocked(getEventBookmark);
const useAuthMock = vi.mocked(useAuth);

const localBookmark = {
	id: "2024_local",
	year: 2024,
	slug: "local",
	type: "event",
	status: "favourited",
	existsOnServer: false,
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
};

describe("useBookmark", () => {
	beforeEach(() => {
		getLocalBookmarksMock.mockReset();
		getEventBookmarkMock.mockReset();
		// @ts-ignore
		useAuthMock.mockReturnValue({ user: { id: "user-1" } });
	});

	it("merges server bookmark data when authenticated", async () => {
		getLocalBookmarksMock.mockResolvedValue([localBookmark]);
		getEventBookmarkMock.mockResolvedValue({
			priority: null,
			id: "server-bookmark",
			slug: "remote",
			type: "event",
			status: "favourited",
			year: 2024,
			created_at: new Date().toISOString(),
			updated_at: null,
			user_id: 1,
			last_notification_sent_at: null,
			watch_later: false,
			watch_status: "unwatched",
			watch_progress_seconds: 0,
			playback_speed: "1",
			last_watched_at: null,
			attended: false,
			attended_at: null,
			attended_in_person: false,
		});

		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(
			() => useBookmark({ year: 2024, slug: "remote" }),
			{ wrapper },
		);

		await waitFor(() => {
			expect(result.current.bookmark).toBeTruthy();
		});

		expect(result.current.bookmark?.slug).toBe("remote");
		expect(result.current.bookmark?.existsOnServer).toBe(true);
		queryClient.clear();
	});

	it("returns local bookmark when unauthenticated", async () => {
		useAuthMock.mockReturnValue({ user: null, loading: false, logout: vi.fn() });
		getLocalBookmarksMock.mockResolvedValue([localBookmark]);

		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(
			() => useBookmark({ year: 2024, slug: "local" }),
			{ wrapper },
		);

		await waitFor(() => {
			expect(result.current.bookmark).toBeTruthy();
		});

		expect(result.current.bookmark?.slug).toBe("local");
		expect(getEventBookmarkMock).not.toHaveBeenCalled();
		queryClient.clear();
	});

	it("returns merged bookmark even if local data is missing", async () => {
		getLocalBookmarksMock.mockResolvedValue([]);
		getEventBookmarkMock.mockResolvedValue({
			priority: null,
			id: "server-only",
			slug: "server-only",
			type: "event",
			year: 2024,
			status: "favourited",
			created_at: new Date().toISOString(),
			updated_at: null,
			user_id: 1,
			last_notification_sent_at: null,
			watch_later: false,
			watch_status: "unwatched",
			watch_progress_seconds: 0,
			playback_speed: "1",
			last_watched_at: null,
			attended: false,
			attended_at: null,
			attended_in_person: false,
		});

		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(
			() => useBookmark({ year: 2024, slug: "server-only" }),
			{ wrapper },
		);

		await waitFor(() => {
			expect(result.current.bookmark?.slug).toBe("server-only");
		});
		queryClient.clear();
	});
});
