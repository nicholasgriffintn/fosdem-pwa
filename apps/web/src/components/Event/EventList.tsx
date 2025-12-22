"use client";

import type { EventConflict } from "~/lib/fosdem";
import type { Event } from "~/types/fosdem";
import { EventItemList } from "~/components/Event/EventItemList";
import { EventCalendarList } from "~/components/Event/EventCalendarList";
import { groupEventsByDay } from "~/lib/grouping";
import { EventScheduleList } from "~/components/Event/EventScheduleList";
import type { User } from "~/server/db/schema";
import { ViewModeSwitch } from "../ViewModeSwitch";
import { ItemListContainer } from "~/components/shared/ItemListContainer";

type EventListViewModes = "list" | "calendar" | "schedule";

type EventListProps = {
	events: Event[];
	year: number;
	conflicts?: EventConflict[];
	title?: string;
	defaultViewMode?: EventListViewModes;
	displayViewMode?: boolean;
	groupByDay?: boolean;
	days?: Array<{ id: string; name: string }>;
	day?: string;
	view?: string;
	sortFavourites?: string;
	onSortFavouritesChange?: (checked: boolean) => void;
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
	displaySortByFavourites?: boolean;
	emptyStateTitle?: string;
	emptyStateMessage?: string;
	serverBookmarks?: Array<{
		slug: string;
		status: string;
	}>;
};

export function EventList({
	events,
	year,
	conflicts,
	title,
	defaultViewMode = "list",
	displayViewMode = false,
	groupByDay = false,
	days,
	day,
	view,
	sortFavourites,
	onSortFavouritesChange,
	onSetPriority,
	showTrack = false,
	user = null,
	onCreateBookmark,
	displaySortByFavourites = false,
	emptyStateTitle = "No events to show",
	emptyStateMessage = "Adjust filters or pick another day to see more sessions.",
	serverBookmarks,
}: EventListProps) {
	const viewMode = (view as EventListViewModes) || defaultViewMode;
	const sortByFavourites = sortFavourites === "true";

	const scheduleEvents = events.filter((event) => {
		const hasConflict = conflicts?.some(
			(conflict) =>
				conflict.event1.id === event?.id || conflict.event2.id === event?.id,
		);
		return event.priority === 1 || !hasConflict;
	});

	const renderEventList = (eventsToRender: Event[]) => {
		if (viewMode === "schedule") {
			return (
				<EventScheduleList
					events={eventsToRender}
					year={year}
					conflicts={conflicts}
					onSetPriority={onSetPriority}
					showTrack={showTrack}
					user={user}
					onCreateBookmark={onCreateBookmark}
					serverBookmarks={serverBookmarks}
				/>
			);
		}
		if (viewMode === "list") {
			return (
				<EventItemList
					events={eventsToRender}
					year={year}
					conflicts={conflicts}
					onSetPriority={onSetPriority}
					showTrack={showTrack}
					user={user}
					sortByFavourites={sortByFavourites}
					onCreateBookmark={onCreateBookmark}
					serverBookmarks={serverBookmarks}
				/>
			);
		}
		return (
			<EventCalendarList
				events={eventsToRender}
				year={year}
				conflicts={conflicts}
				onSetPriority={onSetPriority}
				showTrack={showTrack}
				user={user}
				sortByFavourites={sortByFavourites}
				onCreateBookmark={onCreateBookmark}
				serverBookmarks={serverBookmarks}
			/>
		);
	};

	return (
		<ItemListContainer
			items={groupByDay && viewMode === "schedule" ? scheduleEvents : events}
			title={title}
			groupByDay={groupByDay}
			days={days}
			currentDay={day}
			getDayId={(event) => event.day}
			groupItemsByDay={groupEventsByDay}
			displaySortByFavourites={displaySortByFavourites}
			sortByFavourites={sortByFavourites}
			onSortChange={onSortFavouritesChange}
			renderViewModeSwitch={displayViewMode ? () => <ViewModeSwitch viewMode={viewMode} /> : undefined}
			emptyStateTitle={emptyStateTitle}
			emptyStateMessage={emptyStateMessage}
			renderList={renderEventList}
		/>
	);
}
