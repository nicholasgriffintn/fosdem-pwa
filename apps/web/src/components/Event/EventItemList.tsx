import type React from "react";
import clsx from "clsx";
import { Link } from "@tanstack/react-router";

import type { Event } from "~/types/fosdem";
import type { EventConflict } from "~/lib/fosdem";
import { ConflictTooltip } from "~/components/Event/ConflictTooltip";
import { ItemActions } from "~/components/ItemActions";
import { useEventList } from "~/hooks/use-item-list";
import { calculateEndTime } from "~/lib/dateTime";
import type { User } from "~/server/db/schema";
import { Badge } from "~/components/ui/badge";
import { Icons } from "~/components/Icons";
import { constants } from "../../constants";

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
	variant?: "list" | "card";
	className?: string;
	style?: React.CSSProperties;
	actionSize?: "default" | "sm";
};

export function EventListItem({
	year,
	event,
	bookmarksLoading,
	conflicts,
	onSetPriority,
	showTrack,
	user,
	onCreateBookmark,
	variant = "list",
	className,
	style,
	actionSize,
}: EventListItemProps) {
	const hasConflicts = conflicts?.some(
		(conflict) =>
			conflict.event1.id === event.id || conflict.event2.id === event.id,
	);
	const endTime = calculateEndTime(event.startTime, event.duration);
	const layoutClass =
		variant === "card"
			? "flex flex-col gap-3 h-full"
			: "flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3";
	const metaBadges = [
		{
			key: "time",
			label: `${event.startTime} – ${endTime}`,
			icon: <Icons.clock className="h-3.5 w-3.5" />,
		},
		event.room
			? {
				key: "room",
				label: event.room,
				icon: <Icons.mapPin className="h-3.5 w-3.5" />,
			}
			: null,
		showTrack && event.trackKey
			? {
				key: "track",
				label: event.trackKey,
				icon: <Icons.list className="h-3.5 w-3.5" />,
			}
			: null,
		event.persons?.length > 0
			? {
				key: "persons",
				label: event.persons.join(", "),
				icon: <Icons.users className="h-3.5 w-3.5" />,
			}
			: null,
	]
		.filter(Boolean)
		.map((meta) => meta as { key: string; label: string; icon?: React.ReactNode });
	const hasStatusBadges = Boolean(
		event.isLive || hasConflicts || event.priority === 1,
	);

	const containerClass = clsx(
		variant === "card"
			? "bg-card border rounded-lg p-3 hover:shadow-md transition-shadow relative flex flex-col"
			: "relative py-4 px-3 sm:px-4 hover:bg-muted/40 transition-colors",
		hasConflicts &&
			!event.priority &&
			(variant === "card"
				? "border-destructive/70"
				: "border-l-4 border-l-destructive/70"),
		className,
	);

	return (
		<div className={containerClass} style={style}>
			<div className="flex flex-1 flex-col gap-2 min-w-0">
				{hasStatusBadges && (
					<div className="flex flex-wrap items-start gap-2">
						{event.isLive && (
							<Badge variant="default" className="bg-red-500 hover:bg-red-500">
								Live
							</Badge>
						)}
						{hasConflicts && <Badge variant="destructive">Conflict</Badge>}
						{event.priority === 1 && <Badge variant="secondary">Pinned</Badge>}
					</div>
				)}
				<div className={layoutClass}>
					<div className="flex-1 space-y-2 min-w-0">
						<h3 className="font-semibold leading-tight text-base">
							<Link
								to={`/event/$slug`}
								params={{ slug: event.id }}
								search={{
									year: Number.isFinite(year) ? year : constants.DEFAULT_YEAR,
									test: false,
								}}
								className="no-underline hover:underline"
							>
								{event.title}
							</Link>
						</h3>
						<div
							className={clsx(
								"flex flex-wrap gap-2",
								variant === "card" ? "text-xs" : "",
							)}
						>
							{metaBadges.map((meta) => (
								<div
									key={meta.key}
									className="flex items-center gap-1 text-xs"
								>
									{meta.icon}
									<span className="truncate">{meta.label}</span>
								</div>
							))}
						</div>
						{hasConflicts && (
							<ConflictTooltip
								event={event}
								conflicts={conflicts}
								className="inline-flex"
								onSetPriority={onSetPriority}
								priority={event.priority}
							/>
						)}
					</div>
					<ItemActions
						item={event}
						year={year}
						type="event"
						bookmarksLoading={bookmarksLoading}
						size={actionSize ?? (variant === "card" ? "sm" : "default")}
						className={
							variant === "card"
								? "pt-2 mt-auto"
								: "pt-1 lg:pt-0 lg:pl-6"
						}
						onCreateBookmark={onCreateBookmark}
					/>
				</div>
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
