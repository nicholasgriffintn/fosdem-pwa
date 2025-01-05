import clsx from "clsx";
import { Link } from "@tanstack/react-router";

import { Button } from "~/components/ui/button";
import { FavouriteButton } from "~/components/FavouriteButton";
import { ShareButton } from "~/components/ShareButton";
import { constants } from "~/constants";
import { useBookmarks } from "~/hooks/use-bookmarks";
import { Spinner } from "../Spinner";
import { sortTracksWithFavorites } from "~/lib/sorting";
import type { Track } from "~/types/fosdem";
import type { Bookmark } from "~/server/db/schema";

type TrackListProps = {
	tracks: Track[];
	favourites?: {
		[key: string]: string;
	}[];
	year: number;
};

function TrackListItem({
	year,
	track,
	index,
	isLast,
	bookmarksLoading,
}: {
	year: number;
	track: Track;
	index: number;
	isLast: boolean;
	bookmarksLoading: boolean;
}) {
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
				<div className="flex items-center pl-1 pr-1 md:pl-6 md:pr-3 gap-2 pb-3 md:pb-0">
					{bookmarksLoading ? (
						<Spinner />
					) : (
						<FavouriteButton
							year={year}
							type="track"
							slug={track.id}
							status={track.isFavourited ? "favourited" : "unfavourited"}
						/>
					)}
					<ShareButton
						title={track.name}
						text={`Check out ${track.name} at FOSDEM`}
						url={`https://fosdempwa.com/track/${track.id}`}
					/>
					<Button variant="secondary" asChild className="w-full no-underline">
						<Link
							to={`/track/${track.id}`}
							search={(prev) => ({
								...prev,
								year: prev.year || constants.DEFAULT_YEAR,
							})}
						>
							View Track
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}

export function TrackList({ tracks, year }: TrackListProps) {
	const { bookmarks, loading: bookmarksLoading } = useBookmarks({ year });

	const tracksWithFavourites = tracks?.length
		? tracks.map((track) => {
			return {
				...track,
				isFavourited: bookmarks?.length
					? Boolean(
						bookmarks.find((bookmark: Bookmark) => bookmark.slug === track.id)
							?.status === "favourited",
					)
					: undefined,
			};
		})
		: [];

	const favorites = bookmarks?.reduce((acc: Record<string, boolean>, bookmark: Bookmark) => {
		if (bookmark.status === "favourited") {
			acc[bookmark.slug] = true;
		}
		return acc;
	}, {} as Record<string, boolean>) || {};

	const sortedTracks = [...tracksWithFavourites].sort(sortTracksWithFavorites(favorites));

	return (
		<ul className="track-list w-full rounded-md">
			{sortedTracks?.length > 0 ? (
				sortedTracks.map((track, index) => (
					<li key={track.id}>
						<TrackListItem
							year={year}
							track={track}
							index={index}
							isLast={tracks.length === index + 1}
							bookmarksLoading={bookmarksLoading}
						/>
					</li>
				))
			) : (
				<li>
					<div className="flex justify-between">
						<div className="flex flex-col space-y-1.5 pt-6 pb-6">
							<h3 className="font-semibold leading-none tracking-tight">
								No tracks found
							</h3>
						</div>
					</div>
				</li>
			)}
		</ul>
	);
}
