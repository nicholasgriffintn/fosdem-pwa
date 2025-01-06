import { cn } from "~/lib/utils";
import type { Event } from "~/types/fosdem";
import type { EventConflict } from "~/lib/fosdem";
import { ItemActions } from "~/components/ItemActions";
import { useEventList } from "~/hooks/use-item-list";
import { calculateEndTime } from "~/lib/dateTime";
import { sortScheduleEvents } from "~/lib/sorting";

type EventScheduleListProps = {
  events: Event[];
  year: number;
  conflicts?: EventConflict[];
  onSetPriority?: (eventId: string, updates: { priority: number | null }) => void;
  showTrack?: boolean;
}

function calculateTransitionTime(event1: Event, event2: Event) {
  const [hours1, minutes1] = calculateEndTime(event1.startTime, event1.duration).split(':').map(Number);
  const [hours2, minutes2] = event2.startTime.split(':').map(Number);

  const totalMinutes1 = hours1 * 60 + minutes1;
  const totalMinutes2 = hours2 * 60 + minutes2;

  return totalMinutes2 - totalMinutes1;
}

function EventScheduleListItem({
  event,
  nextEvent,
  year,
  bookmarksLoading,
  showTrack,
}: {
  event: Event;
  nextEvent?: Event;
  year: number;
  bookmarksLoading: boolean;
  showTrack?: boolean;
}) {
  const transitionTime = nextEvent ? calculateTransitionTime(event, nextEvent) : null;
  const differentRooms = nextEvent && event.room !== nextEvent.room;

  return (
    <div className="relative">
      <div className="bg-card border rounded-lg p-4 mb-2">
        <div className="flex flex-col space-y-2">
          <h3 className="font-semibold">{event.title}</h3>
          <p className="text-sm text-muted-foreground">
            {event.room} | {event.startTime} - {calculateEndTime(event.startTime, event.duration)}
            {event.persons?.length > 0 && ` | ${event.persons.join(", ")}`}
            {showTrack && event.trackKey && ` | ${event.trackKey}`}
          </p>
          <ItemActions
            item={event}
            year={year}
            type="event"
            bookmarksLoading={bookmarksLoading}
            size="sm"
          />
        </div>
      </div>
      {transitionTime !== null && (
        <div className={cn(
          "ml-4 pl-4 border-l-2 py-2 text-sm",
          differentRooms && transitionTime <= 0 ? "text-destructive border-destructive" :
            differentRooms && transitionTime <= 10 ? "text-orange-500 dark:text-orange-400 border-orange-500" :
              "text-muted-foreground border-muted"
        )}>
          {differentRooms && (
            <div className="font-medium mb-1">
              Room change: {event.room} → {nextEvent.room}
            </div>
          )}
          {transitionTime > 0 ? (
            <>{transitionTime} minute{transitionTime !== 1 ? 's' : ''} until next event</>
          ) : differentRooms ? (
            <span>
              Events overlap by {Math.abs(transitionTime)} minute{Math.abs(transitionTime) !== 1 ? 's' : ''}!
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function EventScheduleList({
  events,
  year,
  conflicts,
  showTrack,
}: EventScheduleListProps) {
  const { items: sortedEvents, bookmarksLoading } = useEventList({ items: events, year, sortFn: sortScheduleEvents });

  return (
    <div className="space-y-2">
      {sortedEvents.map((event, index) => (
        <EventScheduleListItem
          key={event.id}
          event={event}
          nextEvent={sortedEvents[index + 1]}
          year={year}
          bookmarksLoading={bookmarksLoading}
          showTrack={showTrack}
        />
      ))}
    </div>
  );
} 