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

type BookmarkSnapshot = {
	slug: string;
	status: string;
};

type ItemWithId = {
	id: string;
};

type ItemWithFavorites<T extends ItemWithId> = T & {
	isFavourited?: boolean;
};

function useBookmarkResolution(year: number, serverBookmarks?: BookmarkSnapshot[]) {
	const isClient = useIsClient();
	const { bookmarks, loading: bookmarksLoading } = useBookmarks({ year });
	const resolvedBookmarks = isClient ? bookmarks : serverBookmarks || [];
	const resolvedLoading = isClient ? bookmarksLoading : false;

	return { resolvedBookmarks, resolvedLoading };
}

function createFavoritesMap(bookmarks: (BookmarkSnapshot | LocalBookmark)[]) {
	return bookmarks?.reduce(
		(acc: Record<string, boolean>, bookmark: BookmarkSnapshot | LocalBookmark) => {
			if (bookmark.status === "favourited") {
				acc[bookmark.slug] = true;
			}
			return acc;
		},
		{} as Record<string, boolean>,
	) || {};
}

function addFavoritesToItems<T extends ItemWithId>(
	items: T[],
	bookmarks: (BookmarkSnapshot | LocalBookmark)[]
): ItemWithFavorites<T>[] {
	return items?.length
		? items.map((item) => ({
				...item,
			isFavourited: bookmarks?.length
					? Boolean(
						bookmarks.find(
								(bookmark: BookmarkSnapshot | LocalBookmark) =>
									bookmark.slug === item.id && bookmark.status === "favourited",
							),
					)
					: undefined,
			}))
		: [];
}

interface UseEventListProps {
	items: Event[];
	year: number;
	sortFn?: (a: Event, b: Event) => number;
	sortByFavourites?: boolean;
	serverBookmarks?: BookmarkSnapshot[];
}

interface UseTrackListProps {
	items: Track[];
	year: number;
	sortByFavourites?: boolean;
	serverBookmarks?: BookmarkSnapshot[];
}

interface UseItemListProps<T extends ItemWithId> {
	items: T[];
	year: number;
	sortByFavourites?: boolean;
	serverBookmarks?: BookmarkSnapshot[];
	defaultSortFn: (a: T, b: T) => number;
	favoritesSortFn: (favorites: Record<string, boolean>) => (a: T, b: T) => number;
}

function useItemList<T extends ItemWithId>({
	items,
	year,
	sortByFavourites = false,
	serverBookmarks,
	defaultSortFn,
	favoritesSortFn,
}: UseItemListProps<T>) {
	const { resolvedBookmarks, resolvedLoading } = useBookmarkResolution(year, serverBookmarks);
	const favorites = createFavoritesMap(resolvedBookmarks);
	const itemsWithFavourites = addFavoritesToItems(items, resolvedBookmarks);

	const sorter = sortByFavourites
		? favoritesSortFn(favorites)
		: defaultSortFn;

	const sortedItems = [...itemsWithFavourites].sort(sorter);

	return {
		items: sortedItems,
		bookmarksLoading: resolvedLoading,
	};
}

export function useEventList({
	items,
	year,
	sortFn,
	sortByFavourites = false,
	serverBookmarks,
}: UseEventListProps) {
	return useItemList({
		items,
		year,
		sortByFavourites,
		serverBookmarks,
		defaultSortFn: sortFn || sortEvents,
		favoritesSortFn: sortEventsWithFavorites,
	});
}

export function useTrackList({
	items,
	year,
	sortByFavourites = false,
	serverBookmarks,
}: UseTrackListProps) {
	return useItemList({
		items,
		year,
		sortByFavourites,
		serverBookmarks,
		defaultSortFn: sortTracks,
		favoritesSortFn: sortTracksWithFavorites,
	});
}
