"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getUserBookmarks } from "~/server/functions/bookmarks";

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
		queryKey: ["userBookmarks", userId, year],
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
