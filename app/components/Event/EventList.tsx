"use client";

import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Icons } from "~/components/Icons";
import type { EventConflict } from "~/lib/fosdem";
import type { Event } from "~/types/fosdem";
import { EventItemList } from "~/components/Event/EventItemList";
import { EventCalendarList } from "~/components/Event/EventCalendarList";
import { groupEventsByDay } from "~/lib/grouping";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";
import { EventScheduleList } from "~/components/Event/EventScheduleList";

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
	onSetPriority?: (eventId: string, updates: { priority: number | null }) => void;
	showTrack?: boolean;
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
	onSetPriority,
	showTrack = false,
}: EventListProps) {
	const [viewMode, setViewMode] = useState<EventListViewModes>(defaultViewMode);

	// Filter events for schedule view (priority 1 or no conflicts)
	const scheduleEvents = events.filter(event => {
		const hasConflict = conflicts?.some(
			conflict => conflict.event1.id === event.id || conflict.event2.id === event.id
		);
		return event.priority === 1 || !hasConflict;
	});

	if (groupByDay && days && days.length > 0) {
		const eventDataSplitByDay = groupEventsByDay(viewMode === "schedule" ? scheduleEvents : events);
		const uniqueDays = [...new Set(events.map((event) => event.day).sort())];

		const dayId = day || uniqueDays[0] || days[0]?.id;

		return (
			<section>
				<div className="flex flex-col space-y-4">
					<Tabs defaultValue={dayId?.toString()} className="w-full">
						<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
							<div className="flex flex-col md:flex-row md:items-center gap-4">
								{title && <h2 className="text-xl font-semibold shrink-0">{title}</h2>}
								<TabsList className="bg-transparent p-0 h-auto justify-start gap-2">
									{days.map((day) => {
										const hasEvents = Boolean(eventDataSplitByDay[day.id]);
										return (
											<TabsTrigger
												key={day.id}
												value={day.id}
												disabled={!hasEvents}
												className={cn(
													"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2",
													"border border-input bg-background hover:bg-accent hover:text-accent-foreground",
													"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
												)}
											>
												{day.name}
											</TabsTrigger>
										);
									})}
								</TabsList>
							</div>
							{displayViewMode && (
								<div className="flex gap-2 shrink-0">
									<Button
										variant={viewMode === "list" ? "default" : "outline"}
										size="sm"
										onClick={() => setViewMode("list")}
									>
										<Icons.list className="h-4 w-4 mr-1" />
										List
									</Button>
									<Button
										variant={viewMode === "calendar" ? "default" : "outline"}
										size="sm"
										onClick={() => setViewMode("calendar")}
									>
										<Icons.calendar className="h-4 w-4 mr-1" />
										Calendar
									</Button>
									<Button
										variant={viewMode === "schedule" ? "default" : "outline"}
										size="sm"
										onClick={() => setViewMode("schedule")}
									>
										<Icons.clock className="h-4 w-4 mr-1" />
										Schedule
									</Button>
								</div>
							)}
						</div>
						{days.map((day) => {
							if (!eventDataSplitByDay[day.id]) {
								return (
									<TabsContent key={day.id} value={day.id}>
										<p>
											No events are currently scheduled for this day, check the
											next day instead. Or check back later for updates.
										</p>
									</TabsContent>
								);
							}

							return (
								<TabsContent key={day.id} value={day.id}>
									{viewMode === "schedule" ? (
										<EventScheduleList
											events={eventDataSplitByDay[day.id]}
											year={year}
											conflicts={conflicts}
											onSetPriority={onSetPriority}
											showTrack={showTrack}
										/>
									) : viewMode === "list" ? (
										<EventItemList
											events={eventDataSplitByDay[day.id]}
											year={year}
											conflicts={conflicts}
											onSetPriority={onSetPriority}
											showTrack={showTrack}
										/>
									) : (
										<EventCalendarList
											events={eventDataSplitByDay[day.id]}
											year={year}
											conflicts={conflicts}
											onSetPriority={onSetPriority}
											showTrack={showTrack}
										/>
									)}
								</TabsContent>
							);
						})}
					</Tabs>
				</div>
			</section>
		);
	}

	return (
		<section>
			{(title || displayViewMode) && (
				<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
					{title && <h2 className="text-xl font-semibold shrink-0">{title}</h2>}
					{displayViewMode && (
						<div className="flex gap-2 shrink-0">
							<Button
								variant={viewMode === "list" ? "default" : "outline"}
								size="sm"
								onClick={() => setViewMode("list")}
							>
								<Icons.list className="h-4 w-4 mr-1" />
								List
							</Button>
							<Button
								variant={viewMode === "calendar" ? "default" : "outline"}
								size="sm"
								onClick={() => setViewMode("calendar")}
							>
								<Icons.calendar className="h-4 w-4 mr-1" />
								Calendar
							</Button>
							<Button
								variant={viewMode === "schedule" ? "default" : "outline"}
								size="sm"
								onClick={() => setViewMode("schedule")}
							>
								<Icons.clock className="h-4 w-4 mr-1" />
								Schedule
							</Button>
						</div>
					)}
				</div>
			)}
			{events.length > 0 ? (
				<>
					{viewMode === "schedule" ? (
						<EventScheduleList
							events={scheduleEvents}
							year={year}
							conflicts={conflicts}
							onSetPriority={onSetPriority}
							showTrack={showTrack}
						/>
					) : viewMode === "list" ? (
						<EventItemList
							events={events}
							year={year}
							conflicts={conflicts}
							onSetPriority={onSetPriority}
							showTrack={showTrack}
						/>
					) : (
						<EventCalendarList
							events={events}
							year={year}
							conflicts={conflicts}
							onSetPriority={onSetPriority}
							showTrack={showTrack}
						/>
					)}
				</>
			) : (
				<div className="text-muted-foreground">No events found</div>
			)}
		</section>
	);
}
