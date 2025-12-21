"use client";

import { useId } from "react";

import type { EventConflict } from "~/lib/fosdem";
import type { Event } from "~/types/fosdem";
import { EventItemList } from "~/components/Event/EventItemList";
import { EventCalendarList } from "~/components/Event/EventCalendarList";
import { groupEventsByDay } from "~/lib/grouping";
import { EventScheduleList } from "~/components/Event/EventScheduleList";
import type { User } from "~/server/db/schema";
import { EmptyStateCard } from "~/components/EmptyStateCard";
import { DaySwitcher } from "../DaySwitcher";
import { SortFavouritesSwitch } from "../SortFavouritesSwitch";
import { ViewModeSwitch } from "../ViewModeSwitch";

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
	const sortSwitchId = useId();

	const scheduleEvents = events.filter((event) => {
		const hasConflict = conflicts?.some(
			(conflict) =>
				conflict.event1.id === event?.id || conflict.event2.id === event?.id,
		);
		return event.priority === 1 || !hasConflict;
	});

	if (!events.length) {
		return (
			<div className="my-6">
				{title && (
					<h2 className="text-xl font-semibold shrink-0">{title}</h2>
				)}
				<EmptyStateCard
					title={emptyStateTitle}
					description={emptyStateMessage}
					className="my-6"
				/>
			</div>
		);
	}

	if (groupByDay && days && days.length > 0) {
		const eventDataSplitByDay = groupEventsByDay(
			viewMode === "schedule" ? scheduleEvents : events,
		);
		const uniqueDays = [...new Set(events.map((event) => event.day).sort())];

		const dayId = day || uniqueDays[0] || days[0]?.id;

		return (
			<section>
				<div className="flex flex-col space-y-4">
					<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
						<div className="flex flex-col md:flex-row md:items-center gap-4">
							{title && (
								<h2 className="text-xl font-semibold shrink-0">{title}</h2>
							)}
							<div className="flex gap-2 justify-start flex-wrap">
								<DaySwitcher
									days={days}
									dayId={dayId}
									datSplitByDay={eventDataSplitByDay}
								/>
							</div>
						</div>
						<div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
							{displaySortByFavourites && (
								<SortFavouritesSwitch
									sortSwitchId={sortSwitchId}
									sortByFavourites={sortByFavourites}
									onToggle={onSortFavouritesChange}
								/>
							)}
							{displayViewMode && (
								<ViewModeSwitch viewMode={viewMode} />
							)}
						</div>
					</div>
					{typeof dayId === "string" && eventDataSplitByDay[dayId] ? (
						<div>
							{viewMode === "schedule" ? (
								<EventScheduleList
									events={eventDataSplitByDay[dayId]}
									year={year}
									conflicts={conflicts}
									onSetPriority={onSetPriority}
									showTrack={showTrack}
									user={user}
									onCreateBookmark={onCreateBookmark}
									serverBookmarks={serverBookmarks}
								/>
							) : viewMode === "list" ? (
								<EventItemList
										events={eventDataSplitByDay[dayId]}
										year={year}
										conflicts={conflicts}
										onSetPriority={onSetPriority}
										showTrack={showTrack}
										user={user}
										sortByFavourites={sortByFavourites}
										onCreateBookmark={onCreateBookmark}
										serverBookmarks={serverBookmarks}
									/>
								) : (
									<EventCalendarList
									events={eventDataSplitByDay[dayId]}
									year={year}
									conflicts={conflicts}
									onSetPriority={onSetPriority}
									showTrack={showTrack}
									user={user}
									sortByFavourites={sortByFavourites}
									onCreateBookmark={onCreateBookmark}
									serverBookmarks={serverBookmarks}
								/>
							)}
						</div>
					) : (
						<EmptyStateCard
							title="No events for this day"
							description="Try switching to another day or come back later for updates."
							className="my-4"
						/>
					)}
				</div>
			</section>
		);
	}

	return (
		<section>
			<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
				{title && (
					<h2 className="text-xl font-semibold shrink-0 text-foreground">
						{title}
					</h2>
				)}
				<div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
					{displaySortByFavourites && (
						<SortFavouritesSwitch
							sortSwitchId={sortSwitchId}
							sortByFavourites={sortByFavourites}
							onToggle={onSortFavouritesChange}
						/>
					)}
					{displayViewMode && (
						<ViewModeSwitch viewMode={viewMode} />
					)}
				</div>
			</div>
			{events.length > 0 ? (
				<>
					{viewMode === "schedule" ? (
						<EventScheduleList
							events={scheduleEvents}
							year={year}
							conflicts={conflicts}
							onSetPriority={onSetPriority}
							showTrack={showTrack}
							user={user}
							onCreateBookmark={onCreateBookmark}
							serverBookmarks={serverBookmarks}
						/>
					) : viewMode === "list" ? (
						<EventItemList
							events={events}
							year={year}
							conflicts={conflicts}
							onSetPriority={onSetPriority}
							showTrack={showTrack}
							user={user}
							sortByFavourites={sortByFavourites}
							onCreateBookmark={onCreateBookmark}
							serverBookmarks={serverBookmarks}
						/>
					) : (
						<EventCalendarList
							events={events}
							year={year}
							conflicts={conflicts}
							onSetPriority={onSetPriority}
							showTrack={showTrack}
							user={user}
							sortByFavourites={sortByFavourites}
							onCreateBookmark={onCreateBookmark}
							serverBookmarks={serverBookmarks}
						/>
					)}
				</>
			) : (
				<div className="text-muted-foreground">No events found</div>
			)}
		</section>
	);
}
