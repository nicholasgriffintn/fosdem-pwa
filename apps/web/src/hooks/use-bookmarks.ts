"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef } from "react";

import { getBookmarks } from "~/server/functions/bookmarks";
import { useAuth } from "~/hooks/use-auth";
import {
	getLocalBookmarks,
	saveLocalBookmark,
	updateLocalBookmark,
	type LocalBookmark,
} from "~/lib/localStorage";
import type { Bookmark } from "~/server/db/schema";
import { bookmarkQueryKeys } from "~/lib/query-keys";

type MergedBookmark = LocalBookmark & {
	existsOnServer?: boolean;
	serverId?: string;
};

export function useBookmarks({
	year,
	localOnly = false,
	initialServerBookmarks,
}: {
	year: number;
	localOnly?: boolean;
		initialServerBookmarks?: Bookmark[];
}): {
	bookmarks: MergedBookmark[];
	loading: boolean;
} {
	const { user } = useAuth();
	const userId = user?.id;
	const queryClient = useQueryClient();
	const reconciliationInProgress = useRef(false);

	const getBookmarksFromServer = useServerFn(getBookmarks);

	const localQueryKey = bookmarkQueryKeys.local(year);
	const serverQueryKey = bookmarkQueryKeys.list(year, userId);

	const { data: localBookmarks, isLoading: localLoading } = useQuery({
		queryKey: localQueryKey,
		queryFn: () => getLocalBookmarks(year),
		staleTime: 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});

	const { data: serverBookmarks, isLoading: serverLoading } = useQuery({
		queryKey: serverQueryKey,
		queryFn: async () => {
			if (!userId) return [];

			const data = await getBookmarksFromServer({
				data: { year, status: "favourited" },
			});

			return data;
		},
		enabled: !!userId && !localOnly,
		staleTime: 5 * 60 * 1000, // 5 minutes
		initialData: userId && initialServerBookmarks ? initialServerBookmarks : undefined,
	});

	const mergedBookmarks = useMemo(() => {
		if (localOnly) {
			return localBookmarks || [];
		}

		if (!userId) {
			return localBookmarks || [];
		}

		if (!localBookmarks && !serverBookmarks) {
			return [];
		}

		if (!serverBookmarks) {
			return localBookmarks || [];
		}
		if (!localBookmarks) {
			return serverBookmarks || [];
		}

		const serverMap = new Map(serverBookmarks.map((b) => [b.slug, b]));
		const localMap = new Map(localBookmarks.map((b) => [b.slug, b]));

		const merged = localBookmarks.map((local) => ({
			...local,
			serverId: serverMap.get(local.slug)?.id,
			existsOnServer: serverMap.has(local.slug),
		}));

			for (const serverBookmark of serverBookmarks) {
				if (!localMap.has(serverBookmark.slug)) {
					merged.push({
						...serverBookmark,
						id: `${serverBookmark.year}_${serverBookmark.slug}`,
						created_at: new Date().toISOString(),
						serverId: serverBookmark.id,
						existsOnServer: true,
						watch_later: serverBookmark.watch_later ?? null,
					});
				}
			}

		return merged;
	}, [localOnly, userId, localBookmarks, serverBookmarks]);

	const serverBookmarksRef = useRef<Bookmark[]>([]);
	const localBookmarksRef = useRef<LocalBookmark[]>([]);

	useEffect(() => {
		if (localOnly) return;
		if (!userId) return;
		if (!serverBookmarks || !localBookmarks) return;
		if (reconciliationInProgress.current) return;

		const serverChanged = JSON.stringify(serverBookmarks.map(b => b.id)) !== JSON.stringify(serverBookmarksRef.current.map(b => b.id));
		const localChanged = JSON.stringify(localBookmarks.map(b => b.id)) !== JSON.stringify(localBookmarksRef.current.map(b => b.id));

		if (!serverChanged && !localChanged) return;

		serverBookmarksRef.current = serverBookmarks;
		localBookmarksRef.current = localBookmarks;

		let cancelled = false;
		reconciliationInProgress.current = true;

		const reconcile = async () => {
			if (cancelled) {
				reconciliationInProgress.current = false;
				return;
			}

			try {
				const localBySlug = new Map(localBookmarks.map((b) => [b.slug, b]));
				const updates: Array<() => Promise<any>> = [];

				for (const serverBookmark of serverBookmarks) {
					if (cancelled) break;

					const existingLocal = localBySlug.get(serverBookmark.slug);

					if (!existingLocal) {
						updates.push(async () => {
							await saveLocalBookmark(
								{
									year: serverBookmark.year,
									slug: serverBookmark.slug,
									type: serverBookmark.type,
									status: serverBookmark.status,
									serverId: serverBookmark.id,
									watch_later: serverBookmark.watch_later ?? null,
								},
								true,
							);
						});
					} else {
						const needsUpdate =
							existingLocal.serverId !== serverBookmark.id ||
							existingLocal.status !== serverBookmark.status ||
							existingLocal.type !== serverBookmark.type ||
							existingLocal.watch_later !== serverBookmark.watch_later;

						if (needsUpdate) {
							updates.push(async () => {
								await updateLocalBookmark(
									existingLocal.id,
									{
										serverId: serverBookmark.id,
										status: serverBookmark.status,
										type: serverBookmark.type,
										watch_later: serverBookmark.watch_later ?? null,
									},
									true,
								);
							});
						}
					}
				}

				if (updates.length > 0 && !cancelled) {
					await Promise.all(updates.map(fn => fn()));
					await queryClient.invalidateQueries({
						queryKey: localQueryKey,
					});
				}
			} catch (error) {
				console.error("Failed to reconcile local bookmarks:", error);
			} finally {
				reconciliationInProgress.current = false;
			}
		};

		void reconcile();

		return () => {
			cancelled = true;
		};
	}, [localOnly, userId, serverBookmarks, localBookmarks, year, queryClient, localQueryKey]);

	return {
		bookmarks: mergedBookmarks,
		loading: localLoading || (!localOnly && userId ? serverLoading : false),
	};
}
