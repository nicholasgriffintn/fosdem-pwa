"use client";

import type { EventConflict } from "~/lib/fosdem";
import type { Event } from "~/types/fosdem";
import { EventItemList } from "~/components/Event/EventItemList";
import { EventCalendarList } from "~/components/Event/EventCalendarList";
import { groupEventsByDay } from "~/lib/grouping";
import { EventScheduleList } from "~/components/Event/EventScheduleList";
import type { User } from "~/server/db/schema";
import { ViewModeSwitch } from "~/components/shared/ViewModeSwitch";
import { ItemListContainer } from "~/components/shared/ItemListContainer";
import type { BookmarkSnapshot } from "~/lib/type-guards";

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
	scheduleShowConflictIndicators?: boolean;
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
	serverBookmarks?: BookmarkSnapshot[];
	onToggleWatchLater?: (bookmarkId: string) => Promise<unknown>;
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
	scheduleShowConflictIndicators = true,
	showTrack = false,
	user = null,
	onCreateBookmark,
	displaySortByFavourites = false,
	emptyStateTitle = "No events to show",
	emptyStateMessage = "Adjust filters or pick another day to see more sessions.",
	serverBookmarks,
	onToggleWatchLater,
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
					showConflictIndicators={scheduleShowConflictIndicators}
					showTrack={showTrack}
					user={user}
					onCreateBookmark={onCreateBookmark}
					serverBookmarks={serverBookmarks}
					onToggleWatchLater={onToggleWatchLater}
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
					onToggleWatchLater={onToggleWatchLater}
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
				onToggleWatchLater={onToggleWatchLater}
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
