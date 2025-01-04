"use client";

import { useQuery } from "@tanstack/react-query";

export function useUserBookmarks({
	year,
	userId,
}: { year: number; userId?: string }) {
	const { data: bookmarks, isLoading } = useQuery({
		queryKey: ["userBookmarks", userId, year],
		queryFn: async ({ queryKey: [, userId, year] }) => {
			const response = await fetch(
				`/api/user/github/${userId}/bookmarks/${year}`,
			);
			return response.json();
		},
	});

	return {
		bookmarks,
		loading: isLoading,
	};
}
