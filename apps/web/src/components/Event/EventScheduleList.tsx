import { cn } from "~/lib/utils";
import type { Event } from "~/types/fosdem";
import type { EventConflict } from "~/lib/fosdem";
import { ItemActions } from "~/components/shared/ItemActions";
import { EventListItem } from "~/components/Event/EventItemList";
import { useEventList } from "~/hooks/use-item-list";
import { calculateEndTime, calculateTransitionTime } from "~/lib/dateTime";
import { sortScheduleEvents } from "~/lib/sorting";
import type { User } from "~/server/db/schema";

type EventScheduleListProps = {
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
	serverBookmarks?: Array<{
		slug: string;
		status: string;
	}>;
};

type EventScheduleListItemProps = {
	event: Event;
	nextEvent?: Event;
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

function EventScheduleListItem({
	event,
	nextEvent,
	year,
	bookmarksLoading,
	conflicts,
	onSetPriority,
	showTrack,
	user,
	onCreateBookmark,
}: EventScheduleListItemProps) {
	const transitionTime = nextEvent
		? calculateTransitionTime(event, nextEvent)
		: null;
	const differentRooms = nextEvent && event.room !== nextEvent.room;

	return (
		<div className="relative">
			<EventListItem
				variant="list"
				year={year}
				event={event}
				bookmarksLoading={bookmarksLoading}
				conflicts={conflicts}
				onSetPriority={onSetPriority}
				showTrack={showTrack}
				user={user}
				onCreateBookmark={onCreateBookmark}
				actionSize="sm"
			/>
			{transitionTime !== null && (
				<div
					className={cn(
						"ml-4 pl-4 border-l-2 py-2 text-sm",
						differentRooms && transitionTime <= 0
							? "text-destructive border-destructive"
							: differentRooms && transitionTime <= 10
								? "text-orange-500 dark:text-orange-400 border-orange-500"
								: "text-muted-foreground border-muted",
					)}
				>
					{differentRooms && (
						<div className="font-medium mb-1">
							Room change: {event.room} → {nextEvent.room}
						</div>
					)}
					{transitionTime > 0 ? (
						<>
							{transitionTime} minute{transitionTime !== 1 ? "s" : ""} until
							next event
						</>
					) : differentRooms ? (
						<span>
							Events overlap by {Math.abs(transitionTime)} minute
							{Math.abs(transitionTime) !== 1 ? "s" : ""}!
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
	onSetPriority,
	showTrack,
	user,
	onCreateBookmark,
	serverBookmarks,
}: EventScheduleListProps) {
	const { items: sortedEvents, bookmarksLoading } = useEventList({
		items: events,
		year,
		sortFn: sortScheduleEvents,
		serverBookmarks,
	});

	return (
		<ul className="event-list w-full divide-y divide-border rounded-lg border border-border bg-card/40">
			{sortedEvents.map((event, index) => (
				<li key={event?.id}>
					<EventScheduleListItem
						event={event}
						nextEvent={sortedEvents[index + 1]}
						year={year}
						bookmarksLoading={bookmarksLoading}
						conflicts={conflicts}
						onSetPriority={onSetPriority}
						showTrack={showTrack}
						user={user}
						onCreateBookmark={onCreateBookmark}
					/>
				</li>
			))}
		</ul>
	);
}
