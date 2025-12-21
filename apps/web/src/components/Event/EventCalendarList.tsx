import type { Event } from "~/types/fosdem";
import { generateTimeSlots, type EventConflict } from "~/lib/fosdem";
import { useEventList } from "~/hooks/use-item-list";
import type { User } from "~/server/db/schema";
import { EventListItem } from "~/components/Event/EventItemList";

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
	serverBookmarks?: Array<{
		slug: string;
		status: string;
	}>;
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
}: EventCalendarListProps) {
	const { items: sortedEvents, bookmarksLoading } = useEventList({
		items: events,
		year,
		sortByFavourites,
		serverBookmarks,
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
