"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo } from "react";

import { getBookmarks } from "~/server/functions/bookmarks";
import { useAuth } from "~/hooks/use-auth";
import {
	getLocalBookmarks,
	saveLocalBookmark,
	updateLocalBookmark,
} from "~/lib/localStorage";

export function useBookmarks({ year }: { year: number }) {
	const { user } = useAuth();

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
		enabled: !!user?.id,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	const mergedBookmarks = useMemo(() => {
		if (!user?.id) {
			return localBookmarks || [];
		}

		if (!serverBookmarks || !localBookmarks) {
			return localBookmarks || serverBookmarks || [];
		}

		const serverMap = new Map(serverBookmarks.map((b) => [b.slug, b]));

		return localBookmarks.map((local) => ({
			...local,
			serverId: serverMap.get(local.slug)?.id,
			existsOnServer: serverMap.has(local.slug),
		}));
	}, [user?.id, localBookmarks, serverBookmarks]);

	useEffect(() => {
		if (!user?.id) return;

		if (serverBookmarks && localBookmarks) {
			const localBySlug = new Map(localBookmarks.map((b) => [b.slug, b]));

			const operations = serverBookmarks.map(async (serverBookmark) => {
				const existingLocal = localBySlug.get(serverBookmark.slug);

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
					return;
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
				}
			});

			if (operations.length > 0) {
				void (async () => {
					try {
						await Promise.all(operations);
					} catch (error) {
						console.error("Failed to reconcile local bookmarks:", error);
					}
				})();
			}
		}
	}, [user?.id, serverBookmarks, localBookmarks]);

	return {
		bookmarks: mergedBookmarks,
		loading: localLoading || (user?.id ? serverLoading : false),
	};
}
