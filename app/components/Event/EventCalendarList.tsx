import { cn } from "~/lib/utils";
import type { Event } from "~/types/fosdem";
import { generateTimeSlots, type EventConflict } from "~/lib/fosdem";
import { useEventList } from "~/hooks/use-item-list";
import { ConflictTooltip } from "~/components/Event/ConflictTooltip";
import { ItemActions } from "~/components/ItemActions";
import { calculateEndTime } from "~/lib/dateTime";
import type { User } from "~/server/db/schema";

type EventCalendarListProps = {
  events: Event[];
  year: number;
  conflicts?: EventConflict[];
  onSetPriority?: (
    eventId: string,
    updates: { priority: number | null },
  ) => void;
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
};

type EventCalendarListItemProps = {
  event: Event;
  year: number;
  bookmarksLoading: boolean;
  conflicts?: EventConflict[];
  onSetPriority?: (
    eventId: string,
    updates: { priority: number | null },
  ) => void;
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
}: EventCalendarListItemProps) {
  const durationInMinutes =
    Number.parseInt(event.duration.split(":")[0], 10) * 60 +
    Number.parseInt(event.duration.split(":")[1], 10);
  const heightClass = `h-[${Math.max(durationInMinutes * 2, 80)}px]`;

  const hasConflicts = conflicts?.some(
    (conflict) =>
      conflict.event1.id === event.id || conflict.event2.id === event.id,
  );

  return (
    <div
      className={cn(
        "bg-card border rounded-lg p-3 mb-2 hover:shadow-md transition-shadow relative",
        heightClass,
        hasConflicts && !event.priority && "border-destructive/50",
      )}
    >
      <ConflictTooltip
        event={event}
        conflicts={conflicts}
        className="absolute -top-2 -right-2"
        onSetPriority={onSetPriority}
        priority={event.priority}
      />
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">{event.title}</h4>
          <p className="text-xs text-muted-foreground">
            {event.room} | {event.startTime} -{" "}
            {calculateEndTime(event.startTime, event.duration)}
            {event.persons?.length > 0 && ` | ${event.persons.join(", ")}`}
            {showTrack && event.trackKey && ` | ${event.trackKey}`}
          </p>
        </div>
        <ItemActions
          item={event}
          year={year}
          type="event"
          bookmarksLoading={bookmarksLoading}
          size="sm"
          className="mt-2"
          user={user}
          onCreateBookmark={onCreateBookmark}
        />
      </div>
    </div>
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
}: EventCalendarListProps) {
  const { items: sortedEvents, bookmarksLoading } = useEventList({
    items: events,
    year,
  });
  const timeSlots = generateTimeSlots(sortedEvents);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px]">
        {timeSlots.map(({ time, events: slotEvents }) => (
          <div key={time} className="flex border-t py-2">
            <div className="w-24 flex-shrink-0 pr-4 font-medium text-muted-foreground">
              {time}
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4">
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
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
