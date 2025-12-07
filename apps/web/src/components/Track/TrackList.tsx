import { useId, useState } from "react";
import clsx from "clsx";
import type { Track } from "~/types/fosdem";
import { ItemActions } from "~/components/ItemActions";
import { useTrackList } from "~/hooks/use-item-list";
import { groupTracksByDay } from "~/lib/grouping";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";
import type { User } from "~/server/db/schema";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";

type TrackListProps = {
	tracks: Track[];
	year: number;
	title?: string;
	groupByDay?: boolean;
	days?: Array<{ id: string; name: string }>;
	day?: string;
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

type TrackListItemProps = {
	year: number;
	track: Track;
	index: number;
	isLast: boolean;
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
	index,
	isLast,
	bookmarksLoading,
	user,
	onCreateBookmark,
}: TrackListItemProps) {
	const className = clsx("flex justify-between", {
		"border-t-2 border-solid border-muted": index % 2 === 1,
		"border-b-2": index % 2 === 1 && !isLast,
	});

	return (
		<div className={className}>
			<div className="flex flex-col md:flex-row md:justify-between w-full">
				<div className="flex flex-col space-y-1.5 pt-3 pb-3 pl-1 pr-1">
					<h3 className="font-semibold leading-none tracking-tight">
						{track.name}
					</h3>
					<p className="text-gray-500">
						{track.room} | {track.eventCount} events
					</p>
				</div>
				<ItemActions
					item={track}
					year={year}
					type="track"
					bookmarksLoading={bookmarksLoading}
					className="pl-1 md:pl-6 pb-3 md:pb-0"
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
				<ul className="track-list w-full">
					{sortedTracks.map((track, index) => (
						<li key={track.id}>
							<TrackListItem
								year={year}
								track={track}
								index={index}
								isLast={tracks.length === index + 1}
								bookmarksLoading={bookmarksLoading}
								user={user}
								onCreateBookmark={onCreateBookmark}
							/>
						</li>
					))}
				</ul>
			) : (
				<div className="text-muted-foreground">No tracks found</div>
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
	user,
	onCreateBookmark,
}: TrackListProps) {
	const [sortByFavourites, setSortByFavourites] = useState(false);
	const sortSwitchId = useId();

	if (groupByDay && days) {
		const trackDataSplitByDay = groupTracksByDay(tracks);

		const dayId = day || days[0].id;

		return (
			<section>
				<div className="flex flex-col space-y-4">
					<Tabs defaultValue={dayId.toString()} className="w-full">
						<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
							<div className="flex flex-col md:flex-row md:items-center gap-4">
								{title && (
									<h2 className="text-xl font-semibold shrink-0 text-foreground">{title}</h2>
								)}
								<TabsList className="bg-transparent p-0 h-auto justify-start gap-2">
									{days.map((day) => {
										const hasTracks = Boolean(trackDataSplitByDay[day.id]);
										return (
											<TabsTrigger
												key={day.id}
												value={day.id}
												disabled={!hasTracks}
												className={cn(
													"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2",
													"border border-input bg-background hover:bg-accent hover:text-accent-foreground",
													"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary",
												)}
											>
												{day.name}
											</TabsTrigger>
										);
									})}
								</TabsList>
							</div>
							<div className="flex items-center gap-2">
								<Switch
									id={sortSwitchId}
									checked={sortByFavourites}
									onCheckedChange={setSortByFavourites}
									aria-label="Toggle favourites-first sorting"
								/>
								<Label htmlFor={sortSwitchId} className="text-sm font-medium text-foreground">
									Favourites first
								</Label>
							</div>
						</div>
						{days.map((day) => {
							if (!trackDataSplitByDay[day.id]) {
								return (
									<TabsContent key={day.id} value={day.id}>
										<p>
											No tracks are currently scheduled for this day, check the
											next day instead. Or check back later for updates.
										</p>
									</TabsContent>
								);
							}

							return (
								<TabsContent key={day.id} value={day.id}>
									<TrackListContent
										tracks={trackDataSplitByDay[day.id]}
										year={year}
										user={user}
										sortByFavourites={sortByFavourites}
										onCreateBookmark={onCreateBookmark}
									/>
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
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
				{title && <h2 className="text-xl font-semibold text-foreground">{title}</h2>}
				<div className="flex items-center gap-2">
					<Switch
						id={sortSwitchId}
						checked={sortByFavourites}
						onCheckedChange={setSortByFavourites}
						aria-label="Toggle favourites-first sorting"
					/>
					<Label htmlFor={sortSwitchId} className="text-sm font-medium text-foreground">
						Favourites first
					</Label>
				</div>
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
