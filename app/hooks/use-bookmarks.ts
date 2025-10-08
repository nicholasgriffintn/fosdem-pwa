"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/start";
import { useEffect, useMemo } from "react";

import { getBookmarks } from "~/server/functions/bookmarks";
import { useAuth } from "~/hooks/use-auth";
import { syncAllOfflineData } from "~/lib/backgroundSync";
import {
	getLocalBookmarks,
	saveLocalBookmark,
} from "~/lib/localStorage";

export function useBookmarks({ year }: { year: number }) {
	const { user } = useAuth();

	const getBookmarksFromServer = useServerFn(getBookmarks);

	const { data: localBookmarks, isLoading: localLoading } = useQuery({
		queryKey: ["local-bookmarks", year],
		queryFn: () => getLocalBookmarks(year),
		staleTime: 0,
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

		const serverMap = new Map(serverBookmarks.map(b => [b.slug, b]));

		return localBookmarks.map(local => ({
			...local,
			serverId: serverMap.get(local.slug)?.id,
			existsOnServer: serverMap.has(local.slug),
		}));
	}, [user?.id, localBookmarks, serverBookmarks]);

	useEffect(() => {
		if (!user?.id) return;

		if (localBookmarks && localBookmarks.length > 0) {
			syncAllOfflineData().catch(error => {
				console.error('Background sync failed:', error);
			});
		}
	}, [user?.id, localBookmarks]);

	useEffect(() => {
		if (!user?.id) return;

		if (serverBookmarks && localBookmarks) {
			const localSlugs = new Set(localBookmarks.map(b => b.slug));

			const newFromServer = serverBookmarks.filter(b => !localSlugs.has(b.slug));

			if (newFromServer.length > 0) {
				newFromServer.forEach(serverBookmark => {
					saveLocalBookmark({
						year: serverBookmark.year,
						slug: serverBookmark.slug,
						type: serverBookmark.type,
						status: serverBookmark.status,
					});
				});
			}
		}
	}, [user?.id, serverBookmarks, localBookmarks]);

	return {
		bookmarks: mergedBookmarks,
		loading: localLoading || (user?.id ? serverLoading : false),
	};
}
