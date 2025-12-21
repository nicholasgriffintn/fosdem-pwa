import { useId } from "react";

import type { Track } from "~/types/fosdem";
import { ItemActions } from "~/components/ItemActions";
import { useTrackList } from "~/hooks/use-item-list";
import { groupTracksByDay } from "~/lib/grouping";
import { cn } from "~/lib/utils";
import type { User } from "~/server/db/schema";
import { Label } from "~/components/ui/label";
import { EmptyStateCard } from "~/components/EmptyStateCard";
import { Icons } from "~/components/Icons";
import { Link } from "@tanstack/react-router";
import { constants } from "../../constants";
import { SortFavouritesSwitch } from "../SortFavouritesSwitch";
import { DaySwitcher } from "../DaySwitcher";

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
					<h3 className="font-semibold leading-tight text-base">
						<Link
							to={`/track/$slug`}
							params={{ slug: track.id }}
							search={{
								year: Number.isFinite(year) ? year : constants.DEFAULT_YEAR,
								day: undefined,
								view: undefined,
								sortFavourites: undefined,
							}}
							className="no-underline hover:underline"
						>
							{track.name}
						</Link>
					</h3>
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
};

function TrackListContent({
	tracks,
	year,
	user,
	sortByFavourites = false,
	onCreateBookmark,
}: TrackListContentProps) {
	const { items: sortedTracks, bookmarksLoading } = useTrackList({
		items: tracks,
		year,
		sortByFavourites,
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
}: TrackListProps) {
	const sortByFavourites = sortFavourites === "true";
	const sortSwitchId = useId();

	if (groupByDay && days) {
		const trackDataSplitByDay = groupTracksByDay(tracks);

		const dayId = day || days[0].id;

		return (
			<section>
				<div className="flex flex-col space-y-4">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
						<div className="flex flex-col md:flex-row md:items-center gap-4">
							{title && (
								<h2 className="text-xl font-semibold shrink-0 text-foreground">
									{title}
								</h2>
							)}
							<div className="flex gap-2 justify-start flex-wrap">
								<DaySwitcher
									days={days}
									datSplitByDay={trackDataSplitByDay}
									dayId={dayId}
								/>
							</div>
						</div>
						{displaySortByFavourites && (
							<SortFavouritesSwitch
								sortByFavourites={sortByFavourites}
								sortSwitchId={sortSwitchId}
								onToggle={onSortFavouritesChange}
							/>
						)}
					</div>
					{trackDataSplitByDay[dayId] ? (
						<TrackListContent
							tracks={trackDataSplitByDay[dayId]}
							year={year}
							user={user}
							sortByFavourites={sortByFavourites}
							onCreateBookmark={onCreateBookmark}
						/>
					) : (
						<EmptyStateCard
							title="No tracks for this day"
							description="Switch to another day to find available tracks."
							className="my-4"
						/>
					)}
				</div>
			</section>
		);
	}

	return (
		<section>
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
				{title && (
					<h2 className="text-xl font-semibold text-foreground">{title}</h2>
				)}
				{displaySortByFavourites && (
					<SortFavouritesSwitch
						sortByFavourites={sortByFavourites}
						sortSwitchId={sortSwitchId}
						onToggle={onSortFavouritesChange}
					/>
				)}
			</div>
			<TrackListContent
				tracks={tracks}
				year={year}
				user={user}
				sortByFavourites={sortByFavourites}
				onCreateBookmark={onCreateBookmark}
			/>
		</section>
	);
}
