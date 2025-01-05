"use client";

import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Icons } from "~/components/Icons";
import type { EventConflict } from "~/lib/fosdem";
import type { Event } from "~/types/fosdem";
import { EventItemList } from "~/components/Event/EventItemList";
import { EventCalendarList } from "~/components/Event/EventCalendarList";

type EventListViewModes = "list" | "calendar";

type EventListProps = {
	events: Event[];
	year: number;
	conflicts?: EventConflict[];
	title?: string;
	defaultViewMode?: EventListViewModes;
	displayViewMode?: boolean;
}

export function EventList({
	events,
	year,
	conflicts,
	title,
	defaultViewMode = "list",
	displayViewMode = false,
}: EventListProps) {
	const [viewMode, setViewMode] = useState<EventListViewModes>(defaultViewMode);

	return (
		<section>
			{(title || displayViewMode) && (
				<div className="flex justify-between items-center mb-4">
					{title && <h2 className="text-xl font-semibold">{title}</h2>}
					{displayViewMode && (
						<div className="flex gap-2">
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
						</div>
					)}
				</div>
			)}
			{events.length > 0 ? (
				<>
					{viewMode === "list" ? (
						<EventItemList events={events} year={year} conflicts={conflicts} />
					) : (
						<EventCalendarList
							events={events}
							year={year}
							conflicts={conflicts}
						/>
					)}
				</>
			) : (
				<div className="text-muted-foreground">No events found</div>
			)}
		</section>
	);
}
