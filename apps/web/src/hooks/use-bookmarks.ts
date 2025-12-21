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

type MergedBookmark = LocalBookmark & {
	existsOnServer?: boolean;
	serverId?: string;
};

export function useBookmarks({
	year,
	localOnly = false,
}: {
	year: number;
	localOnly?: boolean;
}): {
	bookmarks: MergedBookmark[];
	loading: boolean;
} {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const reconciliationInProgress = useRef(false);

	const getBookmarksFromServer = useServerFn(getBookmarks);

	const { data: localBookmarks, isLoading: localLoading } = useQuery({
		queryKey: ["local-bookmarks", year],
		queryFn: () => getLocalBookmarks(year),
		staleTime: 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});

	const { data: serverBookmarks, isLoading: serverLoading } = useQuery({
		queryKey: ["bookmarks", year, user?.id],
		queryFn: async () => {
			if (!user?.id) return [];

			const data = await getBookmarksFromServer({
				data: { year, status: "favourited" },
			});

			return data;
		},
		enabled: !!user?.id && !localOnly,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	const mergedBookmarks = useMemo(() => {
		if (localOnly) {
			return localBookmarks || [];
		}

		if (!user?.id) {
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
				});
			}
		}

		return merged;
	}, [localOnly, user?.id, localBookmarks, serverBookmarks]);

	useEffect(() => {
		if (localOnly) return;
		if (!user?.id) return;
		if (!serverBookmarks || !localBookmarks) return;
		if (reconciliationInProgress.current) return;

		let cancelled = false;
		reconciliationInProgress.current = true;

		const reconcile = async () => {
			if (cancelled) {
				reconciliationInProgress.current = false;
				return;
			}

			try {
				const localBySlug = new Map(localBookmarks.map((b) => [b.slug, b]));

				const operations = serverBookmarks.map(async (serverBookmark) => {
					if (cancelled) return { status: "skipped" as const };

					const existingLocal = localBySlug.get(serverBookmark.slug);

					try {
						if (!existingLocal) {
							await saveLocalBookmark(
								{
									year: serverBookmark.year,
									slug: serverBookmark.slug,
									type: serverBookmark.type,
									status: serverBookmark.status,
									serverId: serverBookmark.id,
								},
								true,
							);
							return { status: "created" as const };
						}

						const needsUpdate =
							existingLocal.serverId !== serverBookmark.id ||
							existingLocal.status !== serverBookmark.status ||
							existingLocal.type !== serverBookmark.type;

						if (needsUpdate) {
							await updateLocalBookmark(
								existingLocal.id,
								{
									serverId: serverBookmark.id,
									status: serverBookmark.status,
									type: serverBookmark.type,
								},
								true,
							);
							return { status: "updated" as const };
						}

						return { status: "unchanged" as const };
					} catch (error) {
						console.error(`Failed to reconcile bookmark ${serverBookmark.slug}:`, error);
						return { status: "failed" as const, error };
					}
				});

				if (operations.length > 0) {
					const results = await Promise.allSettled(operations);
					const failures = results.filter(
						(r) => r.status === "rejected" || (r.status === "fulfilled" && r.value?.status === "failed")
					);

					if (failures.length > 0) {
						console.warn(
							`Bookmark reconciliation completed with ${failures.length} failures out of ${results.length} operations`
						);
					}

					if (!cancelled) {
						await queryClient.invalidateQueries({
							queryKey: ["local-bookmarks", year],
						});
					}
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
	}, [localOnly, user?.id, serverBookmarks, localBookmarks, year, queryClient]);

	return {
		bookmarks: mergedBookmarks,
		loading: localLoading || (!localOnly && user?.id ? serverLoading : false),
	};
}
