"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/start";

import { getBookmarks } from "~/server/functions/bookmarks";

export function useBookmarks({ year }: { year: number }) {
	const useGetBookmarks = useServerFn(getBookmarks);

	const { data: bookmarks, isLoading } = useQuery({
		queryKey: ["bookmarks", year],
		queryFn: async () => {
			const data = await useGetBookmarks({
				data: { year, status: "favourited" },
			});

			return data;
		},
	});

	return {
		bookmarks,
		loading: isLoading,
	};
}
