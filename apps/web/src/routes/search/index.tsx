import { useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "~/components/PageHeader";
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
	type SearchResult,
} from "~/lib/search";
import { generateTimeSlots } from "~/lib/fosdem";
import { useAuth } from "~/hooks/use-auth";
import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";
import { Label } from "~/components/ui/label";
import { Icons } from "~/components/Icons";
import { Button } from "~/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { EmptyStateCard } from "~/components/EmptyStateCard";

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
	validateSearch: ({
		year,
		q,
		track,
		time,
	}: {
		year: number;
		q: string;
		track?: string;
		time?: string;
	}) => ({
		year:
			(constants.AVAILABLE_YEARS.includes(year) && year) ||
			constants.DEFAULT_YEAR,
		q: q || "",
		track: track || undefined,
		time: time || undefined,
	}),
	loaderDeps: ({ search: { year, q, track, time } }) => ({
		year,
		q,
		track,
		time,
	}),
	loader: async ({ deps: { year, q, track, time } }) => {
		return {
			year,
			q,
			track,
			time,
		};
	},
});

export default function SearchPage() {
	const { year, q, track, time } = Route.useLoaderData();
	const navigate = useNavigate();

	const { user } = useAuth();
	const { create: createBookmark } = useMutateBookmark({ year });
	const onCreateBookmark = (bookmark: any) => {
		createBookmark(bookmark);
	};

	const { fosdemData, loading } = useFosdemData({ year });
	const query = q || "";
	const selectedTrack = track || "";
	const selectedTime = time || "";
	const hasActiveFilters = Boolean(query || selectedTrack || selectedTime);

	const getSearchResults = (): SearchResults & {
		tracksWithScores: SearchResult[];
		eventsWithScores: SearchResult[];
		roomsWithScores: SearchResult[];
	} => {
		if (!fosdemData || !query)
			return {
				tracks: [],
				events: [],
				rooms: [],
				tracksWithScores: [],
				eventsWithScores: [],
				roomsWithScores: [],
			};

		const tracksFuse = createSearchIndex(
			Object.values(fosdemData.tracks),
			TRACK_SEARCH_KEYS,
		);
		const eventsFuse = createSearchIndex(
			Object.values(fosdemData.events),
			EVENT_SEARCH_KEYS,
		);
		const roomsFuse = createSearchIndex(
			Object.values(fosdemData.rooms),
			ROOM_SEARCH_KEYS,
		);

		const tracksWithScores = tracksFuse
			.search(query)
			.slice(0, 10)
			.map((result) => ({
				type: "track" as const,
				item: result.item,
				score: result.score ?? 1,
			}));

		const eventsWithScores = eventsFuse
			.search(query)
			.slice(0, 20)
			.map((result) => ({
				type: "event" as const,
				item: result.item,
				score: result.score ?? 1,
			}))
			.sort((a, b) => a.score - b.score);

		const roomsWithScores = roomsFuse
			.search(query)
			.slice(0, 10)
			.map((result) => ({
				type: "room" as const,
				item: result.item,
				score: result.score ?? 1,
			}));

		return {
			tracks: tracksWithScores.map((r) => r.item),
			events: eventsWithScores.map((r) => r.item),
			rooms: roomsWithScores.map((r) => r.item),
			tracksWithScores,
			eventsWithScores,
			roomsWithScores,
		};
	};

	const {
		tracks: rawTracks,
		events: rawEvents,
		rooms: rawRooms,
		tracksWithScores,
		eventsWithScores,
		roomsWithScores,
	} = getSearchResults();

	const trackIdToName = useMemo(() => {
		if (!fosdemData) return {};
		return Object.values(fosdemData.tracks).reduce<Record<string, string>>(
			(acc, t) => {
				acc[t.id] = t.name;
				return acc;
			},
			{},
		);
	}, [fosdemData]);

	const filteredTracksWithScores = selectedTrack
		? tracksWithScores.filter((result) => {
				const matchesId = result.item.id === selectedTrack;
				const matchesName = result.item.name === selectedTrack;
				const selectedName = trackIdToName[selectedTrack];
				return matchesId || matchesName || result.item.name === selectedName;
			})
		: tracksWithScores;

	const filteredEventsWithScores = eventsWithScores.filter((result) => {
		const matchesTrack = selectedTrack
			? result.item.trackKey === selectedTrack ||
				result.item.trackKey === trackIdToName[selectedTrack]
			: true;
		const matchesTime = selectedTime
			? result.item.startTime === selectedTime
			: true;

		return matchesTrack && matchesTime;
	});

	const formattedTracks = filteredTracksWithScores.map((result) =>
		formatTrack(result.item, fosdemData?.events || {}),
	) as Track[];
	const formattedEvents = filteredEventsWithScores.map((result) =>
		formatEvent(result.item),
	) as Event[];
	const formattedRooms = rawRooms.map(formatRoom) as RoomData[];

	const getBestScore = (items: Array<{ score?: number }>) => {
		if (items.length === 0) return Number.POSITIVE_INFINITY;
		return Math.min(...items.map((item) => item.score ?? 1));
	};

	const hasResults =
		formattedTracks.length > 0 ||
		formattedEvents.length > 0 ||
		formattedRooms.length > 0;

	const trackOptions = useMemo(() => {
		if (!fosdemData) return [];

		return Object.values(fosdemData.tracks)
			.map((t) => ({ label: t.name, value: t.id }))
			.sort((a, b) => a.label.localeCompare(b.label));
	}, [fosdemData]);

	const timeSlotOptions = useMemo(() => {
		if (!fosdemData) return [];

		const slots = generateTimeSlots(Object.values(fosdemData.events)).map(
			(slot) => slot.time,
		);

		return Array.from(new Set(slots)).sort((a, b) => {
			const [aHours, aMinutes] = a.split(":").map(Number);
			const [bHours, bMinutes] = b.split(":").map(Number);
			return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
		});
	}, [fosdemData]);

	const updateFilters = ({
		nextTrack,
		nextTime,
	}: {
		nextTrack?: string;
		nextTime?: string;
	}) => {
		navigate({
			to: "/search",
			search: {
				year,
				q: query,
				track: nextTrack || undefined,
				time: nextTime || undefined,
			},
			replace: true,
		});
	};

	const handleTrackChange = (value: string) => {
		const normalized = value === "all" ? "" : value;
		updateFilters({ nextTrack: normalized, nextTime: selectedTime });
	};

	const handleTimeChange = (value: string) => {
		const normalized = value === "all" ? "" : value;
		updateFilters({ nextTrack: selectedTrack, nextTime: normalized });
	};

	const handleClearSearch = () => {
		navigate({
			to: "/search",
			search: { year, q: "", track: undefined, time: undefined },
			replace: true,
		});
	};

	const sections = [
		{
			type: "tracks",
			items: formattedTracks,
			score: getBestScore(filteredTracksWithScores),
			component: () =>
				formattedTracks.length > 0 && (
					<TrackList
						tracks={formattedTracks}
						year={year}
						title="Track Results"
						user={user}
						onCreateBookmark={onCreateBookmark}
					/>
				),
		},
		{
			type: "events",
			items: formattedEvents,
			score: getBestScore(filteredEventsWithScores),
			component: () =>
				formattedEvents.length > 0 && (
					<EventList
						events={formattedEvents}
						year={year}
						title="Event Results"
						user={user}
						onCreateBookmark={onCreateBookmark}
					/>
				),
		},
		{
			type: "rooms",
			items: formattedRooms,
			score: getBestScore(roomsWithScores),
			component: () =>
				formattedRooms.length > 0 && (
					<RoomList rooms={formattedRooms} year={year} title="Room Results" />
				),
		},
	].sort((a, b) => a.score - b.score);

	return (
		<div className="min-h-screen">
			<div className="relative py-6 lg:py-10">
				<PageHeader
					heading="Search"
					subtitle={`Results for "${query || "…"}"`}
					year={year}
				>
					<div className="flex flex-wrap gap-3 items-end">
						<div className="flex flex-col gap-1 min-w-[180px]">
							<Label htmlFor="track-filter">Track</Label>
							<Select
								value={selectedTrack || "all"}
								onValueChange={handleTrackChange}
								disabled={!fosdemData}
							>
								<SelectTrigger id="track-filter" className="min-w-[180px]">
									<SelectValue placeholder="All tracks" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All tracks</SelectItem>
									{trackOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-1 min-w-[160px]">
							<Label htmlFor="time-filter">Time slot</Label>
							<Select
								value={selectedTime || "all"}
								onValueChange={handleTimeChange}
								disabled={!fosdemData}
							>
								<SelectTrigger id="time-filter" className="min-w-[160px]">
									<SelectValue placeholder="Any time" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Any time</SelectItem>
									{timeSlotOptions.map((option) => (
										<SelectItem key={option} value={option}>
											{option}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						{hasActiveFilters && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-10 px-3 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
								onClick={handleClearSearch}
								aria-label="Clear search and filters"
							>
								<Icons.close className="h-4 w-4" />
								Clear
							</Button>
						)}
					</div>
				</PageHeader>

				{loading ? (
					<div className="flex justify-center items-center py-16">
						<Spinner className="h-8 w-8" />
					</div>
				) : !query ? (
						<EmptyStateCard
							title="Search the schedule"
							description="Enter a search term to see results. You can also filter by track or time."
							className="max-w-2xl"
						/>
				) : !hasResults ? (
							<EmptyStateCard
								title="No results found"
								description="Try adjusting your search or clearing filters."
								className="max-w-2xl"
							/>
				) : (
					<div className="space-y-8">
						{sections.map((section) => section.component())}
					</div>
				)}
			</div>
		</div>
	);
}
