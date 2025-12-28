import { Link } from "@tanstack/react-router";

import { LoadingState } from "~/components/shared/LoadingState";
import { EventList } from "~/components/Event/EventList";
import { TrackList } from "~/components/Track/TrackList";
import { WatchLaterList } from "~/components/WatchLater/WatchLaterList";
import type { Conference, Track, Event } from "~/types/fosdem";
import { detectEventConflicts } from "~/lib/fosdem";
import { sortEvents, sortTracks } from "~/lib/sorting";
import type { User } from "~/server/db/schema";
import type { Bookmark } from "~/server/db/schema";
import type { LocalBookmark } from "~/lib/localStorage";
import { EmptyStateCard } from "~/components/shared/EmptyStateCard";
import { doesEventMatchTrack } from "~/lib/tracks";
import { isEvent, isTrack } from "~/lib/type-guards";
import { cn } from "~/lib/utils";

const tabBaseClass = "inline-flex h-10 items-center justify-center whitespace-nowrap rounded-sm px-3 text-sm font-medium transition-all no-underline";
const tabActiveClass = "bg-background text-foreground shadow-sm";

type BookmarkListItem = (Bookmark | LocalBookmark) & { serverId?: string };

function organizeBookmarks(bookmarks: BookmarkListItem[]) {
	const byYear = bookmarks.reduce(
		(acc, bookmark) => {
			if (!acc[bookmark.year]) {
				acc[bookmark.year] = {
					events: [],
					tracks: [],
				};
			}

			if (bookmark.type === "bookmark_event" || bookmark.type === "event") {
				acc[bookmark.year].events.push(bookmark);
			} else if (bookmark.type === "bookmark_track" || bookmark.type === "track") {
				acc[bookmark.year].tracks.push(bookmark);
			}

			return acc;
		},
		{} as Record<
			number,
			{
				events: (Bookmark | LocalBookmark)[];
				tracks: (Bookmark | LocalBookmark)[];
			}
		>
	);

	return byYear;
}

type BookmarksListProps = {
	bookmarks?: BookmarkListItem[];
	fosdemData?: Conference;
	year: number;
	loading: boolean;
	day?: string;
	view?: string;
	tab?: "events" | "tracks" | "all" | "watch-later";
	headerActions?: React.ReactNode;
	watchLaterItems?: BookmarkListItem[];
	watchLaterLoading?: boolean;
	onUpdateBookmark?: (params: {
		id: string;
		serverId?: string;
		updates: Partial<Bookmark | LocalBookmark>;
	}) => void;
	showConflicts?: boolean;
	defaultViewMode?: "list" | "schedule" | "calendar";
	showViewMode?: boolean;
	user?: User | null;
	title?: string;
	emptyStateTitle?: string;
	emptyStateMessage?: string;
	onCreateBookmark?: ({
		type,
		slug,
		status,
	}: {
		type: string;
		slug: string;
		status: string;
	}) => void;
	onToggleWatchLater?: (bookmarkId: string) => Promise<unknown>;
};

export function BookmarksList({
	bookmarks,
	fosdemData,
	year,
	loading,
	day,
	view,
	tab = "events",
	headerActions,
	watchLaterItems,
	watchLaterLoading,
	onUpdateBookmark,
	showConflicts = true,
	defaultViewMode = "calendar",
	showViewMode = true,
	user,
	title,
	emptyStateTitle = "No bookmarks yet",
	emptyStateMessage = "Start bookmarking events to see them here.",
	onCreateBookmark,
	onToggleWatchLater,
}: BookmarksListProps) {
	if (!bookmarks || bookmarks.length === 0) {
		return (
			<EmptyStateCard
				title={emptyStateTitle}
				description={emptyStateMessage}
				className="my-6"
			/>
		);
	}

	const organizedBookmarks = organizeBookmarks(bookmarks);

	const handleSetPriority = (eventId: string, updates: { priority: number | null }) => {
		const bookmark = bookmarks.find((b) => {
			const event = fosdemData?.events[b.slug];
			return event?.id === eventId;
		});

		if (bookmark && onUpdateBookmark) {
			onUpdateBookmark({
				id: bookmark.id,
				serverId: bookmark.serverId,
				updates,
			});
		}
	};

	const getFormattedData = () => {
		if (!bookmarks?.length || !fosdemData) {
			console.warn("No bookmarks or fosdemData");
			return { tracks: [], events: [], conflicts: [] };
		}

		const bookmarkedEvents = organizedBookmarks[year]?.events || [];
		const bookmarkedTracks = organizedBookmarks[year]?.tracks || [];

		const formattedEvents = bookmarkedEvents
			.map((bookmark) => {
				const event = fosdemData.events[bookmark.slug];
				if (!event || !isEvent(event)) return null;
				return {
					...event,
					priority: "priority" in bookmark ? bookmark.priority || null : null,
				} as Event;
			})
			.filter((event): event is NonNullable<typeof event> => event !== null)
			.sort(sortEvents);

		const conflicts = showConflicts
			? detectEventConflicts(formattedEvents, fosdemData.conference)
			: [];

		const formattedTracks = bookmarkedTracks
			.map((bookmark) => {
				const track = fosdemData.tracks[bookmark.slug];
				if (!track || !isTrack(track)) return null;
				return {
					id: track.id,
					name: track.name,
					room: track.room,
					eventCount: Object.values(fosdemData.events).filter(
						(event) => isEvent(event) && doesEventMatchTrack(event, track)
					).length,
				} as Track;
			})
			.filter((track): track is NonNullable<typeof track> => track !== null)
			.sort(sortTracks);

		return { tracks: formattedTracks, events: formattedEvents, conflicts };
	};

	const { tracks, events, conflicts } = getFormattedData();

	const days = fosdemData ? Object.values(fosdemData.days) : [];
	const bookmarkSnapshot =
		bookmarks?.map((bookmark) => ({
			slug: bookmark.slug,
			status: bookmark.status,
		})) || [];

	if (tracks.length === 0 && events.length === 0) {
		return (
			<EmptyStateCard
				title={emptyStateTitle}
				description={emptyStateMessage}
				className="my-6"
			/>
		);
	}

	return (
		<>
			{loading ? (
				<LoadingState type="spinner" message="Loading bookmarks..." variant="centered" />
			) : bookmarks?.length ? (
					<div className="space-y-6">
						<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<div className="inline-flex h-12 w-full items-center justify-center rounded-md bg-muted p-1 text-muted-foreground md:w-auto">
								<Link
									to="."
									search={(prev) => ({ ...prev, tab: "all" })}
									className={cn(
										tabBaseClass,
										"hidden md:inline-flex",
										tab === "all" && tabActiveClass
									)}
								>
									All
								</Link>
								<Link
									to="."
									search={(prev) => ({ ...prev, tab: "events" })}
									className={cn(
										tabBaseClass,
										"flex-1",
										tab === "events" && tabActiveClass
									)}
								>
									Events
								</Link>
								<Link
									to="."
									search={(prev) => ({ ...prev, tab: "tracks" })}
									className={cn(
										tabBaseClass,
										"flex-1",
										tab === "tracks" && tabActiveClass
									)}
								>
									Tracks
								</Link>
								<Link
									to="."
									search={(prev) => ({ ...prev, tab: "watch-later" })}
									className={cn(
										tabBaseClass,
										"flex-1",
										tab === "watch-later" && tabActiveClass
									)}
								>
									Watch Later
								</Link>
							</div>
							{headerActions ? (
								<div className="flex w-full justify-end md:w-auto">
									{headerActions}
								</div>
							) : null}
						</div>

						<div>
							{tracks.length > 0 && (
								<div className={cn(tab === "events" || tab === "watch-later" ? "hidden" : "")}>
									<TrackList
										tracks={tracks}
										year={year}
										title={title || "Bookmarked Tracks"}
										day={day}
										user={user}
										onCreateBookmark={onCreateBookmark}
										serverBookmarks={bookmarkSnapshot}
									/>
								</div>
							)}

							{events.length > 0 && (
								<div className={cn(tab === "tracks" || tab === "watch-later" ? "hidden" : "")}>
									<EventList
										events={events}
										year={year}
										conflicts={conflicts}
										title={title || "Bookmarked Events"}
										groupByDay={true}
										days={days}
										day={day}
										view={view}
										onSetPriority={handleSetPriority}
										showTrack={true}
										defaultViewMode={defaultViewMode}
										displayViewMode={showViewMode}
										user={user}
										onCreateBookmark={onCreateBookmark}
										serverBookmarks={bookmarkSnapshot}
										onToggleWatchLater={onToggleWatchLater}
									/>
								</div>
							)}

							{tab === "watch-later" && (
								<div>
									<WatchLaterList
										items={watchLaterItems || []}
										fosdemData={fosdemData || null}
										year={year}
										loading={watchLaterLoading}
										onToggleWatchLater={onToggleWatchLater || (async () => {})}
										onMarkAsWatched={async () => {}}
									/>
								</div>
							)}
						</div>
					</div>
			) : (
				<div className="text-center py-2 mb-4">
					<p>You haven't bookmarked anything yet!</p>
				</div>
			)}
		</>
	);
}
