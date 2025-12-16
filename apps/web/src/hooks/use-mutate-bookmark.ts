"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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

export type CreateBookmarkInput = {
	year: number;
	type: string;
	slug: string;
	status: string;
};

export type OptimisticCreateDeps = {
	createLocal: (
		bookmarkData: Omit<LocalBookmark, "id" | "created_at" | "updated_at"> & {
			status: string;
		},
	) => Promise<LocalBookmark>;
	removeLocal: (id: string) => Promise<boolean>;
	createServer?: (bookmarkData: CreateBookmarkInput) => Promise<unknown>;
	userId?: string;
};

export async function createBookmarkOptimistic(
	deps: OptimisticCreateDeps,
	bookmarkData: CreateBookmarkInput,
) {
	const created = await deps.createLocal(bookmarkData);

	if (deps.userId && deps.createServer) {
		try {
			await deps.createServer(bookmarkData);
		} catch (error) {
			await deps.removeLocal(created.id);
			throw error;
		}
	}

	return created;
}

export function useMutateBookmark({ year }: { year: number }) {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	const createBookmarkOnServer = useServerFn(createBookmark);
	const updateBookmarkOnServer = useServerFn(updateBookmark);

	const createLocalBookmark = async (
		bookmarkData: Omit<LocalBookmark, "id" | "created_at" | "updated_at"> & {
			status: string;
		},
	) => {
		const newBookmark = await saveLocalBookmark(bookmarkData);
		await queryClient.invalidateQueries({
			queryKey: ["local-bookmarks", bookmarkData.year],
		});

		if (user?.id) {
			syncAllOfflineData().catch((error) => {
				console.error("Background sync failed:", error);
			});
		}

		return newBookmark;
	};

	const updateLocalBookmark = async (
		id: string,
		updates: Partial<LocalBookmark> & { status?: string },
	) => {
		const updated = await updateLocalBookmarkFromStorage(id, updates);
		if (updated) {
			await queryClient.invalidateQueries({
				queryKey: ["local-bookmarks", updated.year],
			});

			if (user?.id) {
				syncAllOfflineData().catch((error) => {
					console.error("Background sync failed:", error);
				});
			}
		}
		return updated;
	};

	const removeLocalBookmark = async (id: string) => {
		const bookmarks = await getLocalBookmarks();
		const bookmark = bookmarks.find((b) => b.id === id);
		const success = await removeLocalBookmarkFromStorage(id);
		if (success && bookmark) {
			await queryClient.invalidateQueries({
				queryKey: ["local-bookmarks", bookmark.year],
			});

			if (user?.id) {
				syncAllOfflineData().catch((error) => {
					console.error("Background sync failed:", error);
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
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["bookmarks", year, user?.id],
			});
			queryClient.invalidateQueries({
				queryKey: ["bookmark", variables.year, variables.slug],
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
			const serverQueryKey = ["bookmarks", year, user?.id];
			await queryClient.cancelQueries({ queryKey: serverQueryKey });

			const previousBookmarks = queryClient.getQueryData(serverQueryKey);

			queryClient.setQueryData(
				serverQueryKey,
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
				const serverQueryKey = ["bookmarks", year, user?.id];
				queryClient.setQueryData(
					serverQueryKey,
					context.previousBookmarks,
				);
			}
		},
		onSettled: (_data, _error, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["bookmarks", year, user?.id],
			});

			const bookmarks = queryClient.getQueryData<(Bookmark | LocalBookmark)[]>(["bookmarks", year, user?.id]);
			const bookmark = bookmarks?.find((b) => b.id === variables.id);
			if (bookmark && "slug" in bookmark) {
				queryClient.invalidateQueries({
					queryKey: ["bookmark", year, bookmark.slug],
				});
			}
		},
	});

	const create = async (bookmarkData: {
		year: number;
		type: string;
		slug: string;
		status: string;
	}) => {
		const bookmarkId = `${bookmarkData.year}_${bookmarkData.slug}`;
		const bookmarks = await getLocalBookmarks(bookmarkData.year);
		const existingBookmark = bookmarks.find((b) => b.id === bookmarkId);

		if (bookmarkData.status === "unfavourited") {
			if (existingBookmark) {
				await removeLocalBookmark(bookmarkId);
			}
			if (user?.id) {
				await createServerBookmark.mutateAsync(bookmarkData);
			}
			queryClient.invalidateQueries({
				queryKey: ["bookmark", bookmarkData.year, bookmarkData.slug],
			});
		} else {
			await createBookmarkOptimistic(
				{
					createLocal: createLocalBookmark,
					removeLocal: removeLocalBookmark,
					createServer: async (data) => createServerBookmark.mutateAsync(data),
					userId: user?.id,
				},
				bookmarkData,
			);
		}
	};

	const update = async (
		id: string,
		updates: Partial<Bookmark | LocalBookmark>,
	) => {
		await updateLocalBookmark(id, updates);

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
