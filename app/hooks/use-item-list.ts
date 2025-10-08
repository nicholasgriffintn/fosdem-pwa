import type { Bookmark } from "~/server/db/schema";
import type { LocalBookmark } from "~/lib/localStorage";
import { useBookmarks } from "~/hooks/use-bookmarks";
import {
	sortEventsWithFavorites,
	sortTracksWithFavorites,
} from "~/lib/sorting";
import type { Event, Track } from "~/types/fosdem";

interface UseEventListProps {
	items: Event[];
	year: number;
	sortFn?: (a: Event, b: Event) => number;
}

interface UseTrackListProps {
	items: Track[];
	year: number;
}

export function useEventList({ items, year, sortFn }: UseEventListProps) {
	const { bookmarks, loading: bookmarksLoading } = useBookmarks({ year });

	const itemsWithFavourites = items?.length
		? items.map((item) => ({
			...item,
			isFavourited: bookmarks?.length
				? Boolean(
					bookmarks.find(
						(bookmark: Bookmark | LocalBookmark) =>
							bookmark.slug === item.id && bookmark.status === "favourited",
					),
				)
				: undefined,
		}))
		: [];

	const favorites =
		bookmarks?.reduce(
			(acc: Record<string, boolean>, bookmark: Bookmark | LocalBookmark) => {
				if (bookmark.status === "favourited") {
					acc[bookmark.slug] = true;
				}
				return acc;
			},
			{} as Record<string, boolean>,
		) || {};

	const sortedItems = [...itemsWithFavourites].sort(
		sortFn || sortEventsWithFavorites(favorites),
	);

	return {
		items: sortedItems,
		bookmarksLoading,
	};
}

export function useTrackList({ items, year }: UseTrackListProps) {
	const { bookmarks, loading: bookmarksLoading } = useBookmarks({ year });

	const itemsWithFavourites = items?.length
		? items.map((item) => ({
			...item,
			isFavourited: bookmarks?.length
				? Boolean(
					bookmarks.find(
						(bookmark: Bookmark | LocalBookmark) =>
							bookmark.slug === item.id && bookmark.status === "favourited",
					),
				)
				: undefined,
		}))
		: [];

	const favorites =
		bookmarks?.reduce(
			(acc: Record<string, boolean>, bookmark: Bookmark | LocalBookmark) => {
				if (bookmark.status === "favourited") {
					acc[bookmark.slug] = true;
				}
				return acc;
			},
			{} as Record<string, boolean>,
		) || {};

	const sortedItems = [...itemsWithFavourites].sort(
		sortTracksWithFavorites(favorites),
	);

	return {
		items: sortedItems,
		bookmarksLoading,
	};
}
