"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/start";

import { createBookmark, updateBookmark } from "~/server/functions/bookmarks";
import type { Bookmark } from "~/server/db/schema";

export function useMutateBookmark({ year }: { year: number }) {
    const queryClient = useQueryClient();
    const useCreateBookmark = useServerFn(createBookmark);
    const useUpdateBookmark = useServerFn(updateBookmark);

    const create = useMutation({
        mutationFn: async ({
            type,
            slug,
            status,
        }: { year: number; type: string; slug: string; status: string }) => {
            const data = await useCreateBookmark({ data: { year, type, slug, status } });

            if (!data.success) {
                throw new Error("Failed to create bookmark");
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["bookmarks", year],
            });
        },
    });

    const update = useMutation({
        mutationFn: async ({
            id,
            updates,
        }: { id: string; updates: Partial<Bookmark> }) => {
            const data = await useUpdateBookmark({ data: { id, updates } });

            if (!data.success) {
                throw new Error("Failed to update bookmark");
            }

            return data;
        },
        onMutate: async ({ id, updates }) => {
            await queryClient.cancelQueries({ queryKey: ["bookmarks", year] });

            const previousBookmarks = queryClient.getQueryData(["bookmarks", year]);

            queryClient.setQueryData(
                ["bookmarks", year],
                (old: Bookmark[] | null) => {
                    if (!old) return null;
                    return old.map((bookmark) =>
                        bookmark.id === id ? { ...bookmark, ...updates } : bookmark,
                    );
                },
            );

            return { previousBookmarks };
        },
        onError: (err, _variables, context) => {
            console.error(err);
            if (context?.previousBookmarks) {
                queryClient.setQueryData(
                    ["bookmarks", year],
                    context.previousBookmarks,
                );
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["bookmarks", year],
            });
        },
    });

    return {
        create: create.mutate,
        createLoading: create.isPending,
        update: update.mutate,
        updateBookmarkLoading: update.isPending,
    };
}
