import type React from "react";
import { useMemo } from "react";
import clsx from "clsx";
import { Link } from "@tanstack/react-router";

import type { Event } from "~/types/fosdem";
import type { EventConflict } from "~/lib/fosdem";
import { ConflictTooltip } from "~/components/Event/ConflictTooltip";
import { ItemActions } from "~/components/shared/ItemActions";
import { useEventList } from "~/hooks/use-item-list";
import { calculateEndTime } from "~/lib/dateTime";
import type { User } from "~/server/db/schema";
import type { BookmarkSnapshot } from "~/lib/type-guards";
import { Badge } from "~/components/ui/badge";
import { Icons } from "~/components/shared/Icons";
import { buildEventLink } from "~/lib/link-builder";
import { ListContainer, ListEmptyState } from "~/components/shared/ListContainer";
import type { RoomStatusBatchResult } from "~/server/functions/room-status";
import { useRoomStatuses } from "~/hooks/use-room-statuses";

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
	serverBookmarks?: BookmarkSnapshot[];
	onToggleWatchLater?: (bookmarkId: string) => Promise<unknown>;
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
	variant?: "list" | "card";
	className?: string;
	style?: React.CSSProperties;
	actionSize?: "default" | "sm";
	onToggleWatchLater?: (bookmarkId: string) => Promise<unknown>;
	isProfilePage?: boolean;
	roomStatus?: RoomStatusBatchResult;
};

type RoomStatusIndicatorProps = {
	state: RoomStatusBatchResult["state"];
};

const roomStatusStyles: Record<RoomStatusBatchResult["state"], string> = {
	available: "bg-green-500",
	full: "bg-red-500",
	unknown: "bg-gray-400",
};

function RoomStatusIndicator({ state }: RoomStatusIndicatorProps) {
	return (
		<span
			className={clsx("inline-flex h-2 w-2 rounded-full", roomStatusStyles[state])}
			aria-label={`Room status: ${state}`}
			title={`Room status: ${state}`}
		/>
	);
}

export function EventListItem({
	year,
	event,
	bookmarksLoading,
	conflicts,
	onSetPriority,
	showConflictIndicators = true,
	showTrack,
	user,
	onCreateBookmark,
	variant = "list",
	className,
	style,
	actionSize,
	onToggleWatchLater,
	isProfilePage = false,
	roomStatus,
}: EventListItemProps) {
	const hasConflicts = showConflictIndicators
		? conflicts?.some(
			(conflict) =>
				conflict.event1.id === event.id || conflict.event2.id === event.id,
		)
		: false;
	const endTime = calculateEndTime(event.startTime, event.duration);
	const layoutClass =
		variant === "card"
			? "flex flex-col gap-3 h-full"
			: "flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3";
	const showPinnedBadge = showConflictIndicators && event.priority === 1;
	const roomStatusState = roomStatus?.state ?? "unknown";

	const metaBadges: { key: string; label: string; icon?: React.ReactNode; status?: RoomStatusBatchResult["state"] }[] = [
		{
			key: "time",
			label: `${event.startTime} – ${endTime}`,
			icon: <Icons.clock className="h-3.5 w-3.5" />,
		},
		event.room
			? {
				key: "room",
				label: event.room,
				icon: (
					<span className="flex items-center gap-1">
						<Icons.mapPin className="h-3.5 w-3.5" />
					</span>
				),
				status: roomStatusState,
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
		event.isLive || hasConflicts || showPinnedBadge,
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
							<Badge variant="destructive" className="bg-red-600 hover:bg-red-600 text-white">
								Live
							</Badge>
						)}
						{!isProfilePage && hasConflicts && <Badge variant="destructive">Conflict</Badge>}
						{showPinnedBadge && <Badge variant="secondary">Pinned</Badge>}
					</div>
				)}
				<div className={layoutClass}>
					<div className="flex-1 space-y-2 min-w-0">
						<div className="font-semibold leading-tight text-base">
							<Link
								{...buildEventLink(event.id, {
									year: Number.isFinite(year) ? year : undefined
								})}
								className="no-underline hover:underline"
							>
								{event.title}
							</Link>
						</div>
						<div
							className={clsx(
								"flex flex-wrap gap-2",
								variant === "card" ? "text-xs" : "",
							)}
						>
							{metaBadges.map((meta) => (
								<div
									key={meta.key}
									className="flex items-center gap-1 text-xs min-w-0 max-w-full flex-1"
								>
									{meta.icon}
									<span className="truncate">{meta.label}</span>
									{meta.status && <RoomStatusIndicator state={meta.status} />}
								</div>
							))}
						</div>
						{!isProfilePage && hasConflicts && (
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
						onToggleWatchLater={onToggleWatchLater}
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
	serverBookmarks,
	onToggleWatchLater,
}: EventListProps) {
	const { items: sortedEvents, bookmarksLoading } = useEventList({
		items: events,
		year,
		sortByFavourites,
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
		<ListContainer className="event-list">
			{sortedEvents?.length > 0 ? (
				sortedEvents.map((event) => (
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
							onToggleWatchLater={onToggleWatchLater}
							roomStatus={event.room ? statusByRoom.get(event.room) : undefined}
						/>
					</li>
				))
			) : (
					<ListEmptyState
						title="No events found"
						description="Try adjusting filters or search terms."
					/>
			)}
		</ListContainer>
	);
}
