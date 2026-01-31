import { useMemo } from "react";
import { cn } from "~/lib/utils";
import type { Event } from "~/types/fosdem";
import type { EventConflict } from "~/lib/fosdem";
import { EventListItem } from "~/components/Event/EventItemList";
import { useEventList } from "~/hooks/use-item-list";
import { calculateTransitionTime } from "~/lib/dateTime";
import { sortScheduleEvents } from "~/lib/sorting";
import { useRoomStatuses } from "~/hooks/use-room-statuses";
import type { User } from "~/server/db/schema";
import type { BookmarkSnapshot } from "~/lib/type-guards";
import type { RoomStatusBatchResult } from "~/server/functions/room-status";

type EventScheduleListProps = {
	events: Event[];
	year: number;
	conflicts?: EventConflict[];
	onSetPriority?: (
		eventId: string,
		updates: { priority: number | null },
	) => void;
	showConflictIndicators?: boolean;
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
	serverBookmarks?: BookmarkSnapshot[];
	onToggleWatchLater?: (bookmarkId: string) => Promise<unknown>;
	isProfilePage?: boolean;
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
	showConflictIndicators?: boolean;
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
	isProfilePage?: boolean;
	roomStatus?: RoomStatusBatchResult;
};

function EventScheduleListItem({
	event,
	nextEvent,
	year,
	bookmarksLoading,
	conflicts,
	onSetPriority,
	showConflictIndicators,
	showTrack,
	user,
	onCreateBookmark,
	onToggleWatchLater,
	isProfilePage = false,
	roomStatus,
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
				showConflictIndicators={showConflictIndicators}
				showTrack={showTrack}
				user={user}
				onCreateBookmark={onCreateBookmark}
				actionSize="sm"
				onToggleWatchLater={onToggleWatchLater}
				isProfilePage={isProfilePage}
				roomStatus={roomStatus}
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
	showConflictIndicators,
	showTrack,
	user,
	onCreateBookmark,
	serverBookmarks,
	onToggleWatchLater,
	isProfilePage = false,
}: EventScheduleListProps) {
	const { items: sortedEvents, bookmarksLoading } = useEventList({
		items: events,
		year,
		sortFn: sortScheduleEvents,
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
						showConflictIndicators={showConflictIndicators}
						showTrack={showTrack}
						user={user}
						onCreateBookmark={onCreateBookmark}
						onToggleWatchLater={onToggleWatchLater}
						isProfilePage={isProfilePage}
						roomStatus={event.room ? statusByRoom.get(event.room) : undefined}
					/>
				</li>
			))}
		</ul>
	);
}
