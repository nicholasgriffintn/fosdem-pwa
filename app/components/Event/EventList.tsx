import clsx from "clsx";
import { Link } from "@tanstack/react-router";

import { Button } from "~/components/ui/button";
import { FavouriteButton } from "~/components/FavouriteButton";
import { ShareButton } from "~/components/ShareButton";
import { constants } from "~/constants";
import { useBookmarks } from "~/hooks/use-bookmarks";
import { Spinner } from "../Spinner";

type EventListItem = {
	id: string;
	title: string;
	startTime: string;
	duration: string;
	room: string;
	persons: string[];
	isFavourited?: boolean;
};

type EventListProps = {
	events: EventListItem[];
	favourites?: {
		[key: string]: string;
	}[];
	year: number;
};

function EventListItem({
	year,
	event,
	index,
	isLast,
	bookmarksLoading,
}: {
	year: number;
	event: EventListItem;
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
						{event.title}
					</h3>
					<p className="text-gray-500">
						{event.room} | {event.startTime} | {event.duration}
						{event.persons?.length > 0 && ` | ${event.persons.join(", ")}`}
					</p>
				</div>
				<div className="flex items-center pl-1 pr-1 md:pl-6 md:pr-3 gap-2 pb-3 md:pb-0">
					{bookmarksLoading ? (
						<Spinner />
					) : (
						<FavouriteButton
							year={year}
							type="event"
							slug={event.id}
							status={event.isFavourited ? "favourited" : "unfavourited"}
						/>
					)}
					<ShareButton
						title={event.title}
						text={`Check out ${event.title} at FOSDEM`}
						url={`https://fosdempwa.com/event/${event.id}`}
					/>
					<Button variant="secondary" asChild className="w-full no-underline">
						<Link
							to={`/event/${event.id}`}
							search={(prev) => ({
								...prev,
								year: prev.year || constants.DEFAULT_YEAR,
							})}
						>
							View Event
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}

export function EventList({ events, year }: EventListProps) {
	const { bookmarks, loading: bookmarksLoading } = useBookmarks({ year });

	const eventsWithFavourites = events?.length
		? events.map((event) => {
			return {
				...event,
				isFavourited: bookmarks?.length
					? Boolean(
						bookmarks.find((bookmark: any) => bookmark.slug === event.id)
							?.status === "favourited",
					)
					: undefined,
			};
		})
		: [];

	return (
		<ul className="event-list w-full">
			{eventsWithFavourites?.length > 0 ? (
				eventsWithFavourites.map((event, index) => (
					<li key={event.id}>
						<EventListItem
							year={year}
							event={event}
							index={index}
							isLast={events.length === index + 1}
							bookmarksLoading={bookmarksLoading}
						/>
					</li>
				))
			) : (
				<li>
					<div className="flex justify-between">
						<div className="flex flex-col space-y-1.5 pt-6 pb-6">
							<h3 className="font-semibold leading-none tracking-tight">
								No events found
							</h3>
						</div>
					</div>
				</li>
			)}
		</ul>
	);
}
