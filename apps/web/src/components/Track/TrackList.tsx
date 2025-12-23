import type { Track } from "~/types/fosdem";
import { ItemActions } from "~/components/shared/ItemActions";
import { useTrackList } from "~/hooks/use-item-list";
import { groupTracksByDay } from "~/lib/grouping";
import type { User } from "~/server/db/schema";
import { EmptyStateCard } from "~/components/shared/EmptyStateCard";
import { Icons } from "~/components/shared/Icons";
import { Link } from "@tanstack/react-router";
import { buildTrackLink } from "~/lib/link-builder";
import { ItemListContainer } from "~/components/shared/ItemListContainer";

type TrackListProps = {
	tracks: Track[];
	year: number;
	title?: string;
	groupByDay?: boolean;
	days?: Array<{ id: string; name: string }>;
	day?: string;
	sortFavourites?: string;
	onSortFavouritesChange?: (checked: boolean) => void;
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
	serverBookmarks?: Array<{
		slug: string;
		status: string;
	}>;
};

type TrackListItemProps = {
	year: number;
	track: Track;
	bookmarksLoading: boolean;
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

function TrackListItem({
	year,
	track,
	bookmarksLoading,
	user,
	onCreateBookmark,
}: TrackListItemProps) {
	const layoutClass =
		"flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3";
	const metaBadges = [
		track.room
			? {
				key: "room",
				label: track.room,
				icon: <Icons.mapPin className="h-3.5 w-3.5" />,
			}
			: null,
		{
			key: "events",
			label: `${track.eventCount} events`,
			icon: <Icons.list className="h-3.5 w-3.5" />,
		},
		track.type
			? {
				key: "type",
				label: track.type,
				icon: <Icons.calendar className="h-3.5 w-3.5" />,
			}
			: null,
	].filter(Boolean) as { key: string; label: string; icon?: React.ReactNode }[];

	return (
		<div className="relative py-4 px-3 sm:px-4 hover:bg-muted/40 transition-colors">
			<div className={layoutClass}>
				<div className="flex flex-1 flex-col gap-2 min-w-0">
					<div className="font-semibold leading-tight text-base">
						<Link
							{...buildTrackLink(track.id, {
								year: Number.isFinite(year) ? year : undefined,
							})}
							className="no-underline hover:underline"
						>
							{track.name}
						</Link>
					</div>
					<div className="flex flex-wrap gap-2">
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
				</div>
				<ItemActions
					item={track}
					year={year}
					type="track"
					bookmarksLoading={bookmarksLoading}
					className="pt-1 lg:pt-0 lg:pl-6"
					onCreateBookmark={onCreateBookmark}
				/>
			</div>
		</div>
	);
}

type TrackListContentProps = {
	tracks: Track[];
	year: number;
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

function TrackListContent({
	tracks,
	year,
	user,
	sortByFavourites = false,
	onCreateBookmark,
	serverBookmarks,
}: TrackListContentProps) {
	const { items: sortedTracks, bookmarksLoading } = useTrackList({
		items: tracks,
		year,
		sortByFavourites,
		serverBookmarks,
	});

	return (
		<>
			{sortedTracks?.length > 0 ? (
				<ul className="track-list w-full divide-y divide-border rounded-lg border border-border bg-card/40">
					{sortedTracks.map((track) => (
						<li key={track.id}>
							<TrackListItem
								year={year}
								track={track}
								bookmarksLoading={bookmarksLoading}
								user={user}
								onCreateBookmark={onCreateBookmark}
							/>
						</li>
					))}
				</ul>
			) : (
					<EmptyStateCard
						title="No tracks to show"
						description="Try another day or browse all tracks from the home page."
						className="my-4"
					/>
			)}
		</>
	);
}

export function TrackList({
	tracks,
	year,
	title,
	groupByDay = false,
	days,
	day,
	sortFavourites,
	user,
	onCreateBookmark,
	displaySortByFavourites = false,
	onSortFavouritesChange,
	serverBookmarks,
}: TrackListProps) {
	const sortByFavourites = sortFavourites === "true";

	return (
		<ItemListContainer
			items={tracks}
			title={title}
			groupByDay={groupByDay}
			days={days}
			currentDay={day}
			getDayId={(track) => track.day}
			groupItemsByDay={groupTracksByDay}
			displaySortByFavourites={displaySortByFavourites}
			sortByFavourites={sortByFavourites}
			onSortChange={onSortFavouritesChange}
			emptyStateTitle="No tracks to show"
			emptyStateMessage="Try another day or browse all tracks from the home page."
			renderList={(tracksToRender, { sortByFavourites }) => (
				<TrackListContent
					tracks={tracksToRender}
					year={year}
					user={user}
					sortByFavourites={sortByFavourites}
					onCreateBookmark={onCreateBookmark}
					serverBookmarks={serverBookmarks}
				/>
			)}
		/>
	);
}
