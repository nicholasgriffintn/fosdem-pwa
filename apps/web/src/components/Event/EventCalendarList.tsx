import { useMemo } from "react";
import type { Event } from "~/types/fosdem";
import { generateTimeSlots, type EventConflict } from "~/lib/fosdem";
import { useEventList } from "~/hooks/use-item-list";
import type { User } from "~/server/db/schema";
import { EventListItem } from "~/components/Event/EventItemList";
import type { BookmarkSnapshot } from "~/lib/type-guards";
import { useRoomStatuses } from "~/hooks/use-room-statuses";
import type { RoomStatusBatchResult } from "~/server/functions/room-status";

type EventCalendarListProps = {
  events: Event[];
  year: number;
  conflicts?: EventConflict[];
  onSetPriority?: (eventId: string, updates: { priority: number | null }) => void;
  showTrack?: boolean;
  user?: User | null;
  sortByFavourites?: boolean;
  onCreateBookmark?: ({
    type,
    slug,
    status,
  }: {
    type: string;
    slug: string;
    status: string;
  }) => void;
  serverBookmarks?: BookmarkSnapshot[];
  onToggleWatchLater?: (bookmarkId: string) => Promise<unknown>;
};

type EventCalendarListItemProps = {
  event: Event;
  year: number;
  bookmarksLoading: boolean;
  conflicts?: EventConflict[];
  onSetPriority?: (eventId: string, updates: { priority: number | null }) => void;
  showTrack?: boolean;
  user?: User | null;
  onCreateBookmark?: ({
    type,
    slug,
    status,
  }: {
    type: string;
    slug: string;
    status: string;
  }) => void;
  onToggleWatchLater?: (bookmarkId: string) => Promise<unknown>;
  roomStatus?: RoomStatusBatchResult;
};

function EventCalendarListItem({
  event,
  year,
  bookmarksLoading,
  conflicts,
  onSetPriority,
  showTrack,
  user,
  onCreateBookmark,
  onToggleWatchLater,
  roomStatus,
}: EventCalendarListItemProps) {
  const durationInMinutes =
    Number.parseInt(event.duration.split(":")[0], 10) * 60 +
    Number.parseInt(event.duration.split(":")[1], 10);
  const itemHeight = Math.max(durationInMinutes * 2, 80);

  return (
    <EventListItem
      variant="card"
      year={year}
      event={event}
      bookmarksLoading={bookmarksLoading}
      conflicts={conflicts}
      onSetPriority={onSetPriority}
      showTrack={showTrack}
      user={user}
      onCreateBookmark={onCreateBookmark}
      className="flex flex-col"
      style={{ minHeight: itemHeight }}
      actionSize="sm"
      onToggleWatchLater={onToggleWatchLater}
      roomStatus={roomStatus}
    />
  );
}

export function EventCalendarList({
  events,
  year,
  conflicts,
  onSetPriority,
  showTrack,
  user,
  onCreateBookmark,
  sortByFavourites = false,
  serverBookmarks,
  onToggleWatchLater,
}: EventCalendarListProps) {
  const { items: sortedEvents, bookmarksLoading } = useEventList({
    items: events,
    year,
    sortByFavourites,
    serverBookmarks,
  });
  const roomNames = useMemo(
    () =>
      Array.from(
        new Set(
          sortedEvents
            .map((event) => event.room)
            .filter((room): room is string => Boolean(room)),
        ),
      ),
    [sortedEvents],
  );
  const { statusByRoom } = useRoomStatuses(roomNames);
  const timeSlots = generateTimeSlots(sortedEvents);

  return (
    <div className="w-full md:overflow-x-auto">
      <div className="min-w-0 md:min-w-[800px]">
        {timeSlots.map(({ time, events: slotEvents }, index) => (
          <div
            key={time}
            className={`flex flex-col md:flex-row py-4 md:py-2 ${index === 0 ? "border-t-0 md:border-t" : "border-t"}`}
          >
            <div className="pb-2 md:pb-0 md:w-24 md:flex-shrink-0 md:pr-4 font-medium text-muted-foreground">
              {time}
            </div>
            <div className="flex-1 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {slotEvents.map((event) => (
                <EventCalendarListItem
                  key={event.id}
                  event={event}
                  year={year}
                  bookmarksLoading={bookmarksLoading}
                  conflicts={conflicts}
                  onSetPriority={onSetPriority}
                  showTrack={showTrack}
                  user={user}
                  onCreateBookmark={onCreateBookmark}
                  onToggleWatchLater={onToggleWatchLater}
                  roomStatus={event.room ? statusByRoom.get(event.room) : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
