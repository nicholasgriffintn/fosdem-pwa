import { createFileRoute } from "@tanstack/react-router";
import Fuse from "fuse.js";

import { useFosdemData } from "~/hooks/use-fosdem-data";
import { EventList } from "~/components/Event/EventList";
import { TrackList } from "~/components/Track/TrackList";
import { Spinner } from "~/components/Spinner";
import { constants } from "~/constants";
import { sortSearchResults } from "~/lib/sorting";
import type { Event, Track } from "~/types/fosdem";

export const Route = createFileRoute("/search/")({
	component: SearchPage,
	head: () => ({
		meta: [
			{
				title: "Search | FOSDEM PWA",
				description: "Search for events and tracks at FOSDEM PWA",
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

	const getSearchResults = () => {
		if (!fosdemData || !query) return { tracks: [], events: [] };

		const tracksFuse = new Fuse(Object.values(fosdemData.tracks), {
			keys: [
				{ name: "name", weight: 1.0 },
				{ name: "type", weight: 0.8 },
				{ name: "description", weight: 0.6 },
				{ name: "room", weight: 0.4 }
			],
			threshold: 0.4,
			includeScore: true,
			useExtendedSearch: true,
			ignoreLocation: true,
			getFn: (obj, path) => {
				const value = Fuse.config.getFn(obj, path);
				return value ? String(value) : "";
			}
		});

		const eventsFuse = new Fuse(Object.values(fosdemData.events), {
			keys: [
				{ name: "title", weight: 1.0 },
				{ name: "persons", weight: 0.9 },
				{ name: "track", weight: 0.8 },
				{ name: "abstract", weight: 0.7 },
				{ name: "description", weight: 0.6 },
				{ name: "room", weight: 0.4 }
			],
			threshold: 0.4,
			includeScore: true,
			useExtendedSearch: true,
			ignoreLocation: true,
			getFn: (obj, path) => {
				const value = Fuse.config.getFn(obj, path);
				return value ? String(value) : "";
			}
		});

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

		return {
			tracks: tracksResults,
			events: eventsResults,
		};
	};

	const { tracks, events } = getSearchResults();

	const formattedTracks = tracks.map((track) => ({
		id: track.id,
		name: track.name,
		room: track.room,
		eventCount: Object.values(fosdemData?.events || {}).filter(
			(event) => event.trackKey === track.name,
		).length,
	})) as Track[];

	const formattedEvents = events.map((event) => ({
		id: event.id,
		title: event.title,
		startTime: event.startTime,
		duration: event.duration,
		room: event.room,
		persons: event.persons,
	})) as Event[];

	return (
		<div className="container py-8">
			<h1 className="text-2xl font-bold mb-4">Search Results for "{query}"</h1>
			{loading ? (
				<div className="flex justify-center items-center h-screen">
					<Spinner className="h-8 w-8" />
				</div>
			) : tracks.length === 0 && events.length === 0 ? (
				<p className="text-muted-foreground">No results found.</p>
			) : (
				<div className="space-y-8">
					{tracks.length > 0 && (
						<section>
							<h2 className="text-xl font-semibold mb-4">Tracks</h2>
							<TrackList tracks={formattedTracks} year={year} />
						</section>
					)}
					{events.length > 0 && (
						<section>
							<h2 className="text-xl font-semibold mb-4">Events</h2>
							<EventList events={formattedEvents} year={year} />
						</section>
					)}
				</div>
			)}
		</div>
	);
}
