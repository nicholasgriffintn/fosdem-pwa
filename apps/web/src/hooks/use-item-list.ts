import { useBookmarks } from "~/hooks/use-bookmarks";
import {
	sortEvents,
	sortEventsWithFavorites,
	sortTracks,
	sortTracksWithFavorites,
} from "~/lib/sorting";
import type { Event, Track } from "~/types/fosdem";
import { useIsClient } from "~/hooks/use-is-client";
import type { ItemWithId, BookmarkSnapshot } from "~/lib/type-guards";
import { isFavourited } from "~/lib/type-guards";
import type { Bookmark } from "~/server/db/schema";

type ItemWithFavorites<T extends ItemWithId> = T & {
	isFavourited?: boolean;
	bookmarkId?: string;
	watchLater?: boolean;
};

function isFullBookmarkList(
	bookmarks: BookmarkSnapshot[] | undefined,
): bookmarks is Bookmark[] {
	if (!bookmarks?.length) {
		return false;
	}
	return bookmarks.every(
		(bookmark) =>
			typeof (bookmark as Bookmark).id === "string" &&
			typeof (bookmark as Bookmark).year === "number" &&
			typeof (bookmark as Bookmark).type === "string",
	);
}

function useBookmarkResolution(year: number, serverBookmarks?: BookmarkSnapshot[]) {
	const isClient = useIsClient();
	const initialServerBookmarks = isFullBookmarkList(serverBookmarks)
		? serverBookmarks
		: undefined;
	const { bookmarks, loading: bookmarksLoading } = useBookmarks({
		year,
		initialServerBookmarks,
	});
	const resolvedBookmarks = isClient ? bookmarks : serverBookmarks || [];
	const resolvedLoading = isClient ? bookmarksLoading : false;

	return { resolvedBookmarks, resolvedLoading };
}

export function createFavoritesMap(bookmarks: BookmarkSnapshot[]): Record<string, boolean> {
	return bookmarks?.reduce(
		(acc: Record<string, boolean>, bookmark) => {
			if (isFavourited(bookmark)) {
				acc[bookmark.slug] = true;
			}
			return acc;
		},
		{} as Record<string, boolean>,
	) || {};
}

function addFavoritesToItems<T extends ItemWithId>(
	items: T[],
	bookmarks: BookmarkSnapshot[]
): ItemWithFavorites<T>[] {
	return items?.length
		? items.map((item) => {
			const bookmark = bookmarks?.find((b) => b.slug === item.id);
			const bookmarkId = bookmark?.serverId ?? bookmark?.id;
			const watchLater = bookmark?.watch_later === true;
			return {
				...item,
				isFavourited: bookmark ? isFavourited(bookmark) : undefined,
				bookmarkId,
				watchLater,
			};
		})
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
