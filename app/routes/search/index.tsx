import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

import { useFosdemData } from "~/hooks/use-fosdem-data";
import { EventList } from "~/components/Event/EventList";
import { TrackList } from "~/components/Track/TrackList";
import { RoomList } from "~/components/Room/RoomList";
import { Spinner } from "~/components/Spinner";
import { constants } from "~/constants";
import { sortSearchResults } from "~/lib/sorting";
import type { Event, Track, RoomData } from "~/types/fosdem";
import {
	TRACK_SEARCH_KEYS,
	EVENT_SEARCH_KEYS,
	ROOM_SEARCH_KEYS,
	createSearchIndex,
	formatTrack,
	formatEvent,
	formatRoom,
	type SearchResults
} from "~/lib/search";

export const Route = createFileRoute("/search/")({
	component: SearchPage,
	head: () => ({
		meta: [
			{
				title: "Search | FOSDEM PWA",
				description: "Search for events, tracks and rooms at FOSDEM PWA",
			},
		],
	}),
	validateSearch: ({ year, q }: { year: number; q: string }) => ({
		year:
			(constants.AVAILABLE_YEARS.includes(year) && year) ||
			constants.DEFAULT_YEAR,
		q: q || "",
	}),
	loaderDeps: ({ search: { year, q } }) => ({ year, q }),
	loader: async ({ deps: { year, q } }) => {
		return {
			year,
			q,
		};
	},
});

export default function SearchPage() {
	const { year, q } = Route.useLoaderData();

	const { fosdemData, loading } = useFosdemData({ year });
	const query = q || "";

	const getSearchResults = (): SearchResults => {
		if (!fosdemData || !query) return { tracks: [], events: [], rooms: [] };

		const tracksFuse = createSearchIndex(Object.values(fosdemData.tracks), TRACK_SEARCH_KEYS);
		const eventsFuse = createSearchIndex(Object.values(fosdemData.events), EVENT_SEARCH_KEYS);
		const roomsFuse = createSearchIndex(Object.values(fosdemData.rooms), ROOM_SEARCH_KEYS);

		const tracksResults = tracksFuse
			.search(query)
			.slice(0, 10)
			.map((result) => ({
				...result.item,
				searchScore: result.score ?? 1
			}));

		const eventsResults = eventsFuse
			.search(query)
			.slice(0, 20)
			.map((result) => ({
				...result.item,
				searchScore: result.score ?? 1
			}))
			.sort(sortSearchResults);

		const roomsResults = roomsFuse
			.search(query)
			.slice(0, 10)
			.map((result) => ({
				...result.item,
				searchScore: result.score ?? 1
			}));

		return {
			tracks: tracksResults,
			events: eventsResults,
			rooms: roomsResults,
		};
	};

	const { tracks, events, rooms } = getSearchResults();

	const formattedTracks = tracks.map((track) => formatTrack(track, fosdemData?.events || {})) as Track[];
	const formattedEvents = events.map(formatEvent) as Event[];
	const formattedRooms = rooms.map(formatRoom) as RoomData[];

	return (
		<div className="container py-8">
			<h1 className="text-2xl font-bold mb-4">Search Results for "{query}"</h1>
			{loading ? (
				<div className="flex justify-center items-center h-screen">
					<Spinner className="h-8 w-8" />
				</div>
			) : tracks.length === 0 && events.length === 0 && rooms.length === 0 ? (
				<p className="text-muted-foreground">No results found.</p>
			) : (
				<div className="space-y-8">
					{tracks.length > 0 && (
						<TrackList tracks={formattedTracks} year={year} title="Track Results" />
					)}
					{events.length > 0 && (
						<EventList events={formattedEvents} year={year} title="Event Results" />
					)}
					{rooms.length > 0 && (
						<RoomList rooms={formattedRooms} year={year} title="Room Results" />
					)}
				</div>
			)}
		</div>
	);
}
