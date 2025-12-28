"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getUserBookmarks } from "~/server/functions/bookmarks";
import { bookmarkQueryKeys } from "~/lib/query-keys";

export function useUserBookmarks({
	year,
	userId,
	enabled = true,
}: {
	year: number;
	userId: string;
		enabled?: boolean;
}) {
	const getUserBookmarksFromServer = useServerFn(getUserBookmarks);

	const { data: bookmarks, isLoading } = useQuery({
		queryKey: bookmarkQueryKeys.userBookmarks(userId, year),
		enabled,
		queryFn: async () => {
			const bookmarks = await getUserBookmarksFromServer({
				data: { year, userId },
			});
			return bookmarks;
		},
	});

	return {
		bookmarks,
		loading: isLoading,
	};
}
