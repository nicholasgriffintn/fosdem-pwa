import clsx from "clsx";
import type { Track } from "~/types/fosdem";
import { ItemActions } from "~/components/ItemActions";
import { useTrackList } from "~/hooks/use-item-list";

type TrackListProps = {
	tracks: Track[];
	year: number;
	title?: string;
};

type TrackListItemProps = {
	year: number;
	track: Track;
	index: number;
	isLast: boolean;
	bookmarksLoading: boolean;
};

function TrackListItem({
	year,
	track,
	index,
	isLast,
	bookmarksLoading,
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
				/>
			</div>
		</div>
	);
}

export function TrackList({ tracks, year, title }: TrackListProps) {
	const { items: sortedTracks, bookmarksLoading } = useTrackList({ items: tracks, year });

	return (
		<section>
			<div className="flex justify-between items-center mb-4">
				{title && <h2 className="text-xl font-semibold">{title}</h2>}
			</div>
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
							/>
						</li>
					))}
				</ul>
			) : (
				<div className="text-muted-foreground">No tracks found</div>
			)}
		</section>
	);
}
