import clsx from "clsx";

import type { Event } from "~/types/fosdem";
import type { EventConflict } from "~/lib/fosdem";
import { ConflictTooltip } from "~/components/Event/ConflictTooltip";
import { ItemActions } from "~/components/ItemActions";
import { useEventList } from "~/hooks/use-item-list";
import { calculateEndTime } from "~/lib/dateTime";
import type { User } from "~/server/db/schema";

type EventListProps = {
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
};

type EventListItemProps = {
	year: number;
	event: Event;
	index: number;
	isLast: boolean;
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

function EventListItem({
	year,
	event,
	index,
	isLast,
	bookmarksLoading,
	conflicts,
	onSetPriority,
	showTrack,
	user,
	onCreateBookmark,
}: EventListItemProps) {
	const hasConflicts = conflicts?.some(
		(conflict) =>
			conflict.event1.id === event.id || conflict.event2.id === event.id,
	);

	return (
		<div
			className={clsx(
				"flex items-center justify-between relative py-3 px-1 sm:px-2",
				hasConflicts && !event.priority && "border-l-4 border-l-destructive",
			)}
		>
			<ConflictTooltip
				event={event}
				conflicts={conflicts}
				className="pl-2 py-3"
				onSetPriority={onSetPriority}
				priority={event.priority}
			/>
			<div className="flex flex-col md:flex-row md:justify-between w-full">
				<div
					className={clsx(
						"flex flex-col space-y-1.5 pl-1 pr-1",
						hasConflicts && "pl-2",
					)}
				>
					<h3 className="font-semibold leading-none tracking-tight">
						{event.title}
					</h3>
					<p className="text-muted-foreground">
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
					className="pl-1 md:pl-6 pb-3 md:pb-0"
					onCreateBookmark={onCreateBookmark}
				/>
			</div>
		</div>
	);
}

export function EventItemList({
	events,
	year,
	conflicts,
	onSetPriority,
	showTrack,
	user,
	onCreateBookmark,
	sortByFavourites = false,
}: EventListProps) {
	const { items: sortedEvents, bookmarksLoading } = useEventList({
		items: events,
		year,
		sortByFavourites,
	});

	return (
		<ul className="event-list w-full divide-y divide-border rounded-lg border border-border bg-card/40">
			{sortedEvents?.length > 0 ? (
				sortedEvents.map((event, index) => (
					<li key={event.id}>
						<EventListItem
							year={year}
							event={event}
							index={index}
							isLast={events.length === index + 1}
							bookmarksLoading={bookmarksLoading}
							conflicts={conflicts}
							onSetPriority={onSetPriority}
							showTrack={showTrack}
							user={user}
							onCreateBookmark={onCreateBookmark}
						/>
					</li>
				))
			) : (
				<li>
						<div className="flex justify-between px-3 py-4">
							<div className="flex flex-col space-y-1.5">
							<h3 className="font-semibold leading-none tracking-tight">
								No events found
							</h3>
								<p className="text-muted-foreground text-sm">
									Try adjusting filters or search terms.
								</p>
						</div>
					</div>
				</li>
			)}
		</ul>
	);
}
