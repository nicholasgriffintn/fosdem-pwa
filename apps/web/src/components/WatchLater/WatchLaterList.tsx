"use client";

import { EventItemList } from "~/components/Event/EventItemList";
import { LoadingState } from "~/components/shared/LoadingState";
import type { Bookmark } from "~/server/db/schema";
import type { Conference, Event } from "~/types/fosdem";
import { isEvent } from "~/lib/type-guards";

type WatchLaterListProps = {
  items: Bookmark[];
  fosdemData: Conference | null;
  year: number;
  loading?: boolean;
  onToggleWatchLater: (bookmarkId: string) => Promise<unknown>;
  onMarkAsWatched: (bookmarkId: string) => Promise<unknown>;
};

export function WatchLaterList({
  items,
  fosdemData,
  year,
  loading,
  onToggleWatchLater,
}: WatchLaterListProps) {
  if (loading) {
    return (
      <LoadingState
        type="spinner"
        message="Loading watch later..."
        variant="centered"
      />
    );
  }

  if (!items.length) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No items in this category
      </p>
    );
  }

  const events: Event[] = items
    .map((item) => {
      const event = fosdemData?.events?.[item.slug];
      if (!event || !isEvent(event)) {
        return null;
      }
      return event;
    })
    .filter((e): e is Event => e !== null);

  const serverBookmarks = items.map((item) => ({
    slug: item.slug,
    status: "favourited",
    id: item.id,
    watch_later: true,
  }));

  return (
    <EventItemList
      events={events}
      year={year}
      showTrack={true}
      serverBookmarks={serverBookmarks}
      onToggleWatchLater={onToggleWatchLater}
    />
  );
}
