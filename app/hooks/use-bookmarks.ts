"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import type { Bookmark } from "~/server/db/schema";

export function useBookmarks({ year }: { year: number }) {
    const queryClient = useQueryClient();

    const { data: bookmarks, isLoading } = useQuery({
        queryKey: ["bookmarks", year],
        queryFn: async () => {
            const response = await fetch(`/api/bookmarks/${year}`);
            if (!response.ok) return null;
            const data = await response.json();
            return data;
        },
    });

    const create = useMutation({
        mutationFn: async ({
            type,
            slug,
            status,
        }: { type: string; slug: string; status: string }) => {
            const response = await fetch(`/api/bookmarks/${year}`, {
                method: "POST",
                body: JSON.stringify({ type, slug, status }),
            });
            if (!response.ok) {
                throw new Error("Failed to create bookmark");
            }

            const data = await response.json();
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["bookmarks", year],
            });
        },
    });

    const updateBookmark = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Bookmark> }) => {
            const response = await fetch(`/api/bookmarks/${year}/${id}`, {
                method: "PUT",
                body: JSON.stringify({ id, updates }),
            });

            if (!response.ok) {
                throw new Error("Failed to update bookmark");
            }

            const data = await response.json();
            return data;
        },
        onMutate: async ({ id, updates }) => {
            await queryClient.cancelQueries({ queryKey: ["bookmarks", year] });

            const previousBookmarks = queryClient.getQueryData(["bookmarks", year]);

            queryClient.setQueryData(["bookmarks", year], (old: Bookmark[] | null) => {
                if (!old) return null;
                return old.map(bookmark =>
                    bookmark.id === id ? { ...bookmark, ...updates } : bookmark
                );
            });

            return { previousBookmarks };
        },
        onError: (err, _variables, context) => {
            console.error(err);
            if (context?.previousBookmarks) {
                queryClient.setQueryData(["bookmarks", year], context.previousBookmarks);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["bookmarks", year],
            });
        },
    });

    return {
        bookmarks,
        loading: isLoading,
        create: create.mutate,
        updateBookmark: updateBookmark.mutate,
    };
}
