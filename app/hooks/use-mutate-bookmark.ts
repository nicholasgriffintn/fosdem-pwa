"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/start";
import { useAuth } from "~/hooks/use-auth";
import { syncAllOfflineData } from "~/lib/backgroundSync";
import {
	getLocalBookmarks,
	saveLocalBookmark,
	removeLocalBookmark as removeLocalBookmarkFromStorage,
	updateLocalBookmark as updateLocalBookmarkFromStorage,
	type LocalBookmark,
} from "~/lib/localStorage";
import { createBookmark, updateBookmark } from "~/server/functions/bookmarks";
import type { Bookmark } from "~/server/db/schema";

export function useMutateBookmark({ year }: { year: number }) {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	const createBookmarkOnServer = useServerFn(createBookmark);
	const updateBookmarkOnServer = useServerFn(updateBookmark);

	const createLocalBookmark = (bookmarkData: Omit<LocalBookmark, 'id' | 'created_at' | 'updated_at'> & { status: string }) => {
		const newBookmark = saveLocalBookmark(bookmarkData);
		queryClient.invalidateQueries({ queryKey: ["local-bookmarks", bookmarkData.year] });

		if (user?.id) {
			syncAllOfflineData().catch(error => {
				console.error('Background sync failed:', error);
			});
		}

		return newBookmark;
	};

	const updateLocalBookmark = (id: string, updates: Partial<LocalBookmark> & { status?: string }) => {
		const updated = updateLocalBookmarkFromStorage(id, updates);
		if (updated) {
			queryClient.invalidateQueries({ queryKey: ["local-bookmarks", updated.year] });

			if (user?.id) {
				syncAllOfflineData().catch(error => {
					console.error('Background sync failed:', error);
				});
			}
		}
		return updated;
	};

	const removeLocalBookmark = (id: string) => {
		const bookmark = getLocalBookmarks().find(b => b.id === id);
		const success = removeLocalBookmarkFromStorage(id);
		if (success && bookmark) {
			queryClient.invalidateQueries({ queryKey: ["local-bookmarks", bookmark.year] });

			if (user?.id) {
				syncAllOfflineData().catch(error => {
					console.error('Background sync failed:', error);
				});
			}
		}
		return success;
	};

	const createServerBookmark = useMutation({
		mutationKey: ["createBookmark"],
		mutationFn: async ({
			type,
			slug,
			status,
		}: {
			year: number;
			type: string;
			slug: string;
			status: string;
		}) => {
			const data = await createBookmarkOnServer({
				data: { year, type, slug, status },
			});

			if (!data?.success) {
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

	const updateServerBookmark = useMutation({
		mutationKey: ["updateBookmark"],
		mutationFn: async ({
			id,
			updates,
		}: {
			id: string;
			updates: Partial<Bookmark | LocalBookmark>;
		}) => {
			const data = await updateBookmarkOnServer({ data: { id, updates } });

			if (!data?.success) {
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

	const create = (bookmarkData: {
		year: number;
		type: string;
		slug: string;
		status: string;
	}) => {
		createLocalBookmark({
			year: bookmarkData.year,
			slug: bookmarkData.slug,
			type: bookmarkData.type,
			status: bookmarkData.status,
		});

		if (user?.id) {
			createServerBookmark.mutate(bookmarkData);
		}
	};

	const update = (id: string, updates: Partial<Bookmark | LocalBookmark>) => {
		updateLocalBookmark(id, updates);

		if (user?.id) {
			updateServerBookmark.mutate({ id, updates });
		}
	};

	return {
		createLocal: createLocalBookmark,
		updateLocal: updateLocalBookmark,
		removeLocal: removeLocalBookmark,

		createServer: createServerBookmark.mutate,
		updateServer: updateServerBookmark.mutate,

		create,
		update,

		createLoading: createServerBookmark.isPending,
		updateLoading: updateServerBookmark.isPending,
	};
}
