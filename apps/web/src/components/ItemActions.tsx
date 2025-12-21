import { Link } from "@tanstack/react-router";

import { Button } from "~/components/ui/button";
import { FavouriteButton } from "~/components/FavouriteButton";
import { ShareButton } from "~/components/ShareButton";
import { constants } from "~/constants";
import type { Event, Track } from "~/types/fosdem";

type ItemWithFavorite = (Event | Track) & { isFavourited?: boolean };

type ItemActionsProps = {
	item: ItemWithFavorite;
	year: number;
	type: "event" | "track";
	bookmarksLoading: boolean;
	size?: "default" | "sm";
	className?: string;
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

export function ItemActions({
	item,
	year,
	type,
	bookmarksLoading,
	size = "default",
	className = "",
	onCreateBookmark,
}: ItemActionsProps) {
	const isEvent = type === "event";
	const title = isEvent ? (item as Event).title : (item as Track).name;
	const slug = item.id;
	const hasFavouriteState = typeof item.isFavourited !== "undefined";
	const shouldShowLoadingState = bookmarksLoading && !hasFavouriteState;
	const favouriteStatus = item.isFavourited ? "favourited" : "unfavourited";
	const encodedSlug = encodeURIComponent(slug);
	const resolvedYear = Number.isFinite(year) ? year : constants.DEFAULT_YEAR;
	const shareUrl = `https://fosdempwa.com/${type}/${encodedSlug}?year=${resolvedYear}`;
	const linkSearch = isEvent
		? { year: resolvedYear, test: false }
		: {
				year: resolvedYear,
				day: undefined,
				view: undefined,
				sortFavourites: undefined,
			};

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			{onCreateBookmark && (
				<FavouriteButton
					year={year}
					type={type}
					slug={slug}
					status={
						shouldShowLoadingState ? "loading" : favouriteStatus
					}
					onCreateBookmark={onCreateBookmark}
				/>
			)}
			<ShareButton
				title={title}
				text={`Check out ${title} at FOSDEM`}
				url={shareUrl}
			/>
			<Button
				variant="secondary"
				asChild
				size={size}
				className="w-full no-underline"
			>
				<Link
					to={`/${type}/$slug`}
					params={{ slug }}
					search={linkSearch}
				>
					View {isEvent ? "Event" : "Track"}
				</Link>
			</Button>
		</div>
	);
}
