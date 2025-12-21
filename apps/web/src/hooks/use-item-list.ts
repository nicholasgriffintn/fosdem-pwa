import type { Bookmark } from "~/server/db/schema";
import type { LocalBookmark } from "~/lib/localStorage";
import { useBookmarks } from "~/hooks/use-bookmarks";
import {
	sortEvents,
	sortEventsWithFavorites,
	sortTracks,
	sortTracksWithFavorites,
} from "~/lib/sorting";
import type { Event, Track } from "~/types/fosdem";
import { useIsClient } from "~/hooks/use-is-client";

interface UseEventListProps {
	items: Event[];
	year: number;
	sortFn?: (a: Event, b: Event) => number;
	sortByFavourites?: boolean;
	serverBookmarks?: Bookmark[];
}

interface UseTrackListProps {
	items: Track[];
	year: number;
	sortByFavourites?: boolean;
	serverBookmarks?: Bookmark[];
}

export function useEventList({
	items,
	year,
	sortFn,
	sortByFavourites = false,
	serverBookmarks,
}: UseEventListProps) {
	const isClient = useIsClient();
	const { bookmarks, loading: bookmarksLoading } = useBookmarks({ year });
	const resolvedBookmarks = isClient ? bookmarks : serverBookmarks || [];
	const resolvedLoading = isClient ? bookmarksLoading : false;

	const itemsWithFavourites = items?.length
		? items.map((item) => ({
				...item,
				isFavourited: resolvedBookmarks?.length
					? Boolean(
							resolvedBookmarks.find(
								(bookmark: Bookmark | LocalBookmark) =>
									bookmark.slug === item.id && bookmark.status === "favourited",
							),
						)
					: undefined,
			}))
		: [];

	const favorites =
		resolvedBookmarks?.reduce(
			(acc: Record<string, boolean>, bookmark: Bookmark | LocalBookmark) => {
				if (bookmark.status === "favourited") {
					acc[bookmark.slug] = true;
				}
				return acc;
			},
			{} as Record<string, boolean>,
		) || {};

	const sorter =
		sortFn ||
		(sortByFavourites ? sortEventsWithFavorites(favorites) : sortEvents);

	const sortedItems = [...itemsWithFavourites].sort(sorter);

	return {
		items: sortedItems,
		bookmarksLoading: resolvedLoading,
	};
}

export function useTrackList({
	items,
	year,
	sortByFavourites = false,
	serverBookmarks,
}: UseTrackListProps) {
	const isClient = useIsClient();
	const { bookmarks, loading: bookmarksLoading } = useBookmarks({ year });
	const resolvedBookmarks = isClient ? bookmarks : serverBookmarks || [];
	const resolvedLoading = isClient ? bookmarksLoading : false;

	const itemsWithFavourites = items?.length
		? items.map((item) => ({
				...item,
				isFavourited: resolvedBookmarks?.length
					? Boolean(
							resolvedBookmarks.find(
								(bookmark: Bookmark | LocalBookmark) =>
									bookmark.slug === item.id && bookmark.status === "favourited",
							),
						)
					: undefined,
			}))
		: [];

	const favorites =
		resolvedBookmarks?.reduce(
			(acc: Record<string, boolean>, bookmark: Bookmark | LocalBookmark) => {
				if (bookmark.status === "favourited") {
					acc[bookmark.slug] = true;
				}
				return acc;
			},
			{} as Record<string, boolean>,
		) || {};

	const sorter = sortByFavourites
		? sortTracksWithFavorites(favorites)
		: sortTracks;

	const sortedItems = [...itemsWithFavourites].sort(sorter);

	return {
		items: sortedItems,
		bookmarksLoading: resolvedLoading,
	};
}
