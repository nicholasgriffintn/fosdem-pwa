"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/start";

import { getUserBookmarks } from "~/server/functions/bookmarks";

export function useUserBookmarks({
    year,
    userId,
}: { year: number; userId: string }) {
    const useGetUserBookmarks = useServerFn(getUserBookmarks);

    const { data: bookmarks, isLoading } = useQuery({
        queryKey: ["userBookmarks", userId, year],
        queryFn: async () => {
            const bookmarks = await useGetUserBookmarks({ data: { year, userId } });
            return bookmarks;
        },
    });

    return {
        bookmarks,
        loading: isLoading,
    };
}
