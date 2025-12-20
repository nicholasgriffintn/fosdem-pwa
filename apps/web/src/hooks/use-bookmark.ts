"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";

import { getEventBookmark } from "~/server/functions/bookmarks";
import { useAuth } from "~/hooks/use-auth";
import { getLocalBookmarks, type LocalBookmark } from "~/lib/localStorage";

type MergedBookmark = LocalBookmark & {
	existsOnServer?: boolean;
	serverId?: string;
};

export function useBookmark({ year, slug }: { year: number; slug: string }): {
	bookmark: MergedBookmark | null;
	loading: boolean;
} {
	const { user } = useAuth();
	const getEventBookmarkFromServer = useServerFn(getEventBookmark);

	const { data: localBookmarks, isLoading: localLoading } = useQuery({
		queryKey: ["local-bookmarks", year],
		queryFn: () => getLocalBookmarks(year),
		staleTime: 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});

	const { data: serverBookmark, isLoading: serverLoading } = useQuery({
		queryKey: ["bookmark", year, slug],
		queryFn: async () => {
			if (!user?.id) return null;
			const data = await getEventBookmarkFromServer({ data: { year, slug } });
			return data;
		},
		enabled: !!user?.id,
		staleTime: 5 * 60 * 1000,
	});

	const localBookmark = useMemo(() => {
		return localBookmarks?.find((b) => b.slug === slug);
	}, [localBookmarks, slug]);

	const mergedBookmark = useMemo((): MergedBookmark | null => {
		if (!user?.id) {
			return localBookmark ?? null;
		}

		if (serverBookmark) {
			return {
				...(localBookmark ?? {}),
				...serverBookmark,
				serverId: serverBookmark.id,
				existsOnServer: true,
			};
		}

		if (localBookmark) {
			return {
				...localBookmark,
				existsOnServer: false,
			};
		}

		return null;
	}, [user?.id, localBookmark, serverBookmark]);

	return {
		bookmark: mergedBookmark,
		loading: localLoading || (user?.id ? serverLoading : false),
	};
}
