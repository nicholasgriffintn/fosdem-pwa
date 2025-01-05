import type { Event, Track } from "~/types/fosdem";
import type { Bookmark } from "~/server/db/schema";
import { useBookmarks } from "~/hooks/use-bookmarks";
import { sortEventsWithFavorites, sortTracksWithFavorites } from "~/lib/sorting";

interface UseEventListProps {
  items: Event[];
  year: number;
}

interface UseTrackListProps {
  items: Track[];
  year: number;
}

export function useEventList({ items, year }: UseEventListProps) {
  const { bookmarks, loading: bookmarksLoading } = useBookmarks({ year });

  const itemsWithFavourites = items?.length
    ? items.map((item) => ({
      ...item,
      isFavourited: bookmarks?.length
        ? Boolean(
          bookmarks.find(
            (bookmark: Bookmark) => bookmark.slug === item.id && bookmark.status === "favourited"
          )
        )
        : undefined,
    }))
    : [];

  const favorites = bookmarks?.reduce((acc: Record<string, boolean>, bookmark: Bookmark) => {
    if (bookmark.status === "favourited") {
      acc[bookmark.slug] = true;
    }
    return acc;
  }, {} as Record<string, boolean>) || {};

  const sortedItems = [...itemsWithFavourites].sort(sortEventsWithFavorites(favorites));

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
            (bookmark: Bookmark) => bookmark.slug === item.id && bookmark.status === "favourited"
          )
        )
        : undefined,
    }))
    : [];

  const favorites = bookmarks?.reduce((acc: Record<string, boolean>, bookmark: Bookmark) => {
    if (bookmark.status === "favourited") {
      acc[bookmark.slug] = true;
    }
    return acc;
  }, {} as Record<string, boolean>) || {};

  const sortedItems = [...itemsWithFavourites].sort(sortTracksWithFavorites(favorites));

  return {
    items: sortedItems,
    bookmarksLoading,
  };
} 