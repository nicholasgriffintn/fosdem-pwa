import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "~/components/PageHeader";
import { useFosdemData } from "~/hooks/use-fosdem-data";
import { EventList } from "~/components/Event/EventList";
import { TrackList } from "~/components/Track/TrackList";
import { RoomList } from "~/components/Room/RoomList";
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
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";

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
		type,
	}: {
		year: number;
		q: string;
		track?: string;
		time?: string;
		type?: "events" | "tracks" | "rooms" | "all";
	}) => ({
		year:
			(constants.AVAILABLE_YEARS.includes(year) && year) ||
			constants.DEFAULT_YEAR,
		q: q || "",
		track: track || undefined,
		time: time || undefined,
		type:
			type === "events" || type === "tracks" || type === "rooms" ? type : "all",
	}),
	loaderDeps: ({ search: { year, q, track, time, type } }) => ({
		year,
		q,
		track,
		time,
		type,
	}),
	loader: async ({ deps: { year, q, track, time, type } }) => {
		return {
			year,
			q,
			track,
			time,
			type,
		};
	},
});

export default function SearchPage() {
	const { year, q, track, time, type } = Route.useLoaderData();
	const navigate = useNavigate();

	const { user } = useAuth();
	const { create: createBookmark } = useMutateBookmark({ year });
	const onCreateBookmark = async (bookmark: any) => {
		await createBookmark(bookmark);
	};

	const { fosdemData, loading } = useFosdemData({ year });
	const query = q || "";
	const selectedTrack = track || "";
	const selectedTime = time || "";
	const selectedType = type || "all";
	const [localQuery, setLocalQuery] = useState(query);

	useEffect(() => {
		setLocalQuery(query);
	}, [query]);

	const hasActiveFilters = Boolean(
		query || selectedTrack || selectedTime || selectedType !== "all",
	);

	const fuseIndexes = useMemo(() => {
		if (!fosdemData) return null;

		return {
			tracks: createSearchIndex(Object.values(fosdemData.tracks), TRACK_SEARCH_KEYS),
			events: createSearchIndex(Object.values(fosdemData.events), EVENT_SEARCH_KEYS),
			rooms: createSearchIndex(Object.values(fosdemData.rooms), ROOM_SEARCH_KEYS),
		};
	}, [fosdemData]);

	const searchResults = useMemo(() => {
		if (!fosdemData || !query || !fuseIndexes)
			return {
				tracks: [],
				events: [],
				rooms: [],
				tracksWithScores: [],
				eventsWithScores: [],
				roomsWithScores: [],
			};

		const tracksWithScores = fuseIndexes.tracks
			.search(query)
			.slice(0, 10)
			.map((result) => ({
				type: "track" as const,
				item: result.item,
				score: result.score ?? 1,
			}));

		const eventsWithScores = fuseIndexes.events
			.search(query)
			.slice(0, 20)
			.map((result) => ({
				type: "event" as const,
				item: result.item,
				score: result.score ?? 1,
			}))
			.sort((a, b) => a.score - b.score);

		const roomsWithScores = fuseIndexes.rooms
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
	}, [fuseIndexes, query, fosdemData]);

	const {
		tracks: rawTracks,
		events: rawEvents,
		rooms: rawRooms,
		tracksWithScores,
		eventsWithScores,
		roomsWithScores,
	} = searchResults;

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

	const updateSearchParams = ({
		nextQuery = localQuery,
		nextTrack = selectedTrack,
		nextTime = selectedTime,
		nextType = selectedType,
	}: {
		nextQuery?: string;
		nextTrack?: string;
		nextTime?: string;
		nextType?: string;
	}) => {
		const normalizedQuery = (nextQuery ?? "").trim();
		const normalizedType: "events" | "tracks" | "rooms" | "all" =
			nextType === "events" || nextType === "tracks" || nextType === "rooms"
				? nextType
				: "all";

		navigate({
			to: "/search",
			search: {
				year,
				q: normalizedQuery,
				track: nextTrack || undefined,
				time: nextTime || undefined,
				type: normalizedType,
			},
			replace: true,
		});
	};

	const handleTrackChange = (value: string) => {
		const normalized = value === "all" ? "" : value;
		updateSearchParams({
			nextTrack: normalized,
			nextTime: selectedTime,
			nextQuery: localQuery,
		});
	};

	const handleTimeChange = (value: string) => {
		const normalized = value === "all" ? "" : value;
		updateSearchParams({
			nextTrack: selectedTrack,
			nextTime: normalized,
			nextQuery: localQuery,
		});
	};

	const handleTypeChange = (value: "all" | "events" | "tracks" | "rooms") => {
		updateSearchParams({
			nextType: value,
			nextQuery: localQuery,
		});
	};

	const handleClearSearch = () => {
		setLocalQuery("");
		updateSearchParams({
			nextQuery: "",
			nextTrack: "",
			nextTime: "",
			nextType: "all",
		});
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		updateSearchParams({
			nextQuery: localQuery,
		});
	};

	const typeFilters: { label: string; value: "all" | "events" | "tracks" | "rooms" }[] =
		[
			{ label: "All", value: "all" },
			{ label: "Events", value: "events" },
			{ label: "Tracks", value: "tracks" },
			{ label: "Rooms", value: "rooms" },
		];

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

	const visibleSections = sections.filter((section) =>
		selectedType === "all" ? true : section.type === selectedType,
	);
	const hasVisibleResults = visibleSections.some(
		(section) => section.items.length > 0,
	);

	return (
		<div className="min-h-screen">
			<div className="relative py-6 lg:py-10">
				<PageHeader
					heading="Search"
					subtitle={`Results for "${query || "…"}"`}
					year={year}
				/>

				<div className="flex flex-wrap gap-4 items-end mb-6">
					<form
						className="flex flex-col gap-1 min-w-[220px] max-w-sm"
						onSubmit={handleSubmit}
					>
						<Label htmlFor="search-query">Search the schedule</Label>
						<div className="flex gap-2">
							<Input
								id="search-query"
								placeholder="Events, tracks, rooms"
								value={localQuery}
								onChange={(e) => setLocalQuery(e.target.value)}
							/>
							<Button type="submit" size="sm">
								Search
							</Button>
						</div>
					</form>

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
					<div className="flex flex-col gap-1">
						<Label>Show</Label>
						<div className="flex flex-wrap gap-2">
							{typeFilters.map((filter) => (
								<Button
									key={filter.value}
									type="button"
									variant={
										selectedType === filter.value ? "secondary" : "outline"
									}
									size="sm"
									onClick={() => handleTypeChange(filter.value)}
									aria-pressed={selectedType === filter.value}
								>
									{filter.label}
								</Button>
							))}
						</div>
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

				{loading ? (
					<div className="space-y-6" role="status" aria-busy="true">
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							<Skeleton className="h-10" />
							<Skeleton className="h-10" />
							<Skeleton className="h-10" />
						</div>
						<div className="space-y-3">
							{Array.from({ length: 4 }).map((_, idx) => (
								<Skeleton key={idx} className="h-20 w-full rounded-lg" />
							))}
						</div>
					</div>
				) : !query ? (
					<EmptyStateCard
						title="Search the schedule"
						description="Enter a search term to see results. You can also filter by track, type, or time."
					/>
				) : !hasVisibleResults ? (
					<EmptyStateCard
						title="No results found"
						description="No results match this search with the selected filters. Try adjusting your search or clearing filters."
					/>
				) : (
					<div className="space-y-8">
						{visibleSections.map((section) => section.component())}
					</div>
				)}
			</div>
		</div>
	);
}
