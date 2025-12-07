"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getEventBookmark } from "~/server/functions/bookmarks";

export function useBookmark({ year, slug }: { year: number; slug: string }) {
	const getEventBookmarkFromServer = useServerFn(getEventBookmark);

	const { data: bookmark, isLoading } = useQuery({
		queryKey: ["bookmark", year, slug],
		queryFn: async () => {
			const data = await getEventBookmarkFromServer({ data: { year, slug } });

			return data;
		},
	});

	return {
		bookmark,
		loading: isLoading,
	};
}
