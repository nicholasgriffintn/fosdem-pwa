import { cn } from "~/lib/utils";
import type { Event } from "~/types/fosdem";
import type { EventConflict } from "~/lib/fosdem";
import { ItemActions } from "~/components/ItemActions";
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
};

type EventScheduleListItemProps = {
	event: Event;
	nextEvent?: Event;
	year: number;
	bookmarksLoading: boolean;
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
			<div className="bg-card border rounded-lg p-4 mb-2">
				<div className="flex flex-col space-y-2">
					<h3 className="font-semibold">{event.title}</h3>
					<p className="text-sm text-muted-foreground">
						{event.room} | {event.startTime} -{" "}
						{calculateEndTime(event.startTime, event.duration)}
						{event.persons?.length > 0 && ` | ${event.persons.join(", ")}`}
						{showTrack && event.trackKey && ` | ${event.trackKey}`}
					</p>
					<ItemActions
						item={event}
						year={year}
						type="event"
						bookmarksLoading={bookmarksLoading}
						size="sm"
						user={user}
						onCreateBookmark={onCreateBookmark}
					/>
				</div>
			</div>
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
	showTrack,
	user,
	onCreateBookmark,
}: EventScheduleListProps) {
	const { items: sortedEvents, bookmarksLoading } = useEventList({
		items: events,
		year,
		sortFn: sortScheduleEvents,
	});

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
					user={user}
					onCreateBookmark={onCreateBookmark}
				/>
			))}
		</div>
	);
}
