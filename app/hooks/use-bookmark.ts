"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/start";

import { getEventBookmark } from "~/server/functions/bookmarks";

export function useBookmark({ year, slug }: { year: number; slug: string }) {
    const useGetEventBookmark = useServerFn(getEventBookmark);

    const { data: bookmark, isLoading } = useQuery({
        queryKey: ["bookmark", year, slug],
        queryFn: async () => {
            const data = await useGetEventBookmark({ data: { year, slug } });

            return data;
        },
    });

    return {
        bookmark,
        loading: isLoading,
    };
}
