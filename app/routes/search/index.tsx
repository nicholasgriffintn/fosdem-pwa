import { createFileRoute } from "@tanstack/react-router";

import { useFosdemData } from "~/hooks/use-fosdem-data";
import { EventList } from "~/components/Event/EventList";
import { TrackList } from "~/components/Track/TrackList";
import { RoomList } from "~/components/Room/RoomList";
import { Spinner } from "~/components/Spinner";
import { constants } from "~/constants";
import type { Event, Track, RoomData } from "~/types/fosdem";
import {
	TRACK_SEARCH_KEYS,
	EVENT_SEARCH_KEYS,
	ROOM_SEARCH_KEYS,
	createSearchIndex,
	formatTrack,
	formatEvent,
	formatRoom,
	type SearchResults,
	type SearchResult
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

	const getSearchResults = (): SearchResults & {
		tracksWithScores: SearchResult[];
		eventsWithScores: SearchResult[];
		roomsWithScores: SearchResult[];
	} => {
		if (!fosdemData || !query) return {
			tracks: [], events: [], rooms: [],
			tracksWithScores: [], eventsWithScores: [], roomsWithScores: []
		};

		const tracksFuse = createSearchIndex(Object.values(fosdemData.tracks), TRACK_SEARCH_KEYS);
		const eventsFuse = createSearchIndex(Object.values(fosdemData.events), EVENT_SEARCH_KEYS);
		const roomsFuse = createSearchIndex(Object.values(fosdemData.rooms), ROOM_SEARCH_KEYS);

		const tracksWithScores = tracksFuse
			.search(query)
			.slice(0, 10)
			.map((result) => ({
				type: 'track' as const,
				item: result.item,
				score: result.score ?? 1
			}));

		const eventsWithScores = eventsFuse
			.search(query)
			.slice(0, 20)
			.map((result) => ({
				type: 'event' as const,
				item: result.item,
				score: result.score ?? 1
			}))
			.sort((a, b) => a.score - b.score);

		const roomsWithScores = roomsFuse
			.search(query)
			.slice(0, 10)
			.map((result) => ({
				type: 'room' as const,
				item: result.item,
				score: result.score ?? 1
			}));

		return {
			tracks: tracksWithScores.map(r => r.item),
			events: eventsWithScores.map(r => r.item),
			rooms: roomsWithScores.map(r => r.item),
			tracksWithScores,
			eventsWithScores,
			roomsWithScores
		};
	};

	const {
		tracks: rawTracks,
		events: rawEvents,
		rooms: rawRooms,
		tracksWithScores,
		eventsWithScores,
		roomsWithScores
	} = getSearchResults();

	const formattedTracks = rawTracks.map((track) => formatTrack(track, fosdemData?.events || {})) as Track[];
	const formattedEvents = rawEvents.map(formatEvent) as Event[];
	const formattedRooms = rawRooms.map(formatRoom) as RoomData[];

	const getBestScore = (items: Array<{ score?: number }>) => {
		if (items.length === 0) return Number.POSITIVE_INFINITY;
		return Math.min(...items.map(item => item.score ?? 1));
	};

	const sections = [
		{
			type: 'tracks', items: formattedTracks, score: getBestScore(tracksWithScores), component: () =>
				rawTracks.length > 0 && <TrackList tracks={formattedTracks} year={year} title="Track Results" />
		},
		{
			type: 'events', items: formattedEvents, score: getBestScore(eventsWithScores), component: () =>
				rawEvents.length > 0 && <EventList events={formattedEvents} year={year} title="Event Results" />
		},
		{
			type: 'rooms', items: formattedRooms, score: getBestScore(roomsWithScores), component: () =>
				rawRooms.length > 0 && <RoomList rooms={formattedRooms} year={year} title="Room Results" />
		}
	].sort((a, b) => a.score - b.score);

	return (
		<div className="container py-8">
			<h1 className="text-2xl font-bold mb-4">Search Results for "{query}"</h1>
			{loading ? (
				<div className="flex justify-center items-center h-screen">
					<Spinner className="h-8 w-8" />
				</div>
			) : rawTracks.length === 0 && rawEvents.length === 0 && rawRooms.length === 0 ? (
				<p className="text-muted-foreground">No results found.</p>
			) : (
				<div className="space-y-8">
					{sections.map(section => section.component())}
				</div>
			)}
		</div>
	);
}
