import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "~/components/shared/PageHeader";
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
} from "~/lib/search";
import { generateTimeSlots } from "~/lib/fosdem";
import { buildSearchLink } from "~/lib/link-builder";
import { useAuth } from "~/hooks/use-auth";
import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";
import { Label } from "~/components/ui/label";
import { Icons } from "~/components/shared/Icons";
import { Button } from "~/components/ui/button";
import { Select } from "~/components/ui/select";
import { EmptyStateCard } from "~/components/shared/EmptyStateCard";
import { PageShell } from "~/components/shared/PageShell";
import { SectionStack } from "~/components/shared/SectionStack";
import { Input } from "~/components/ui/input";
import { Link } from "@tanstack/react-router";
import { cn } from "~/lib/utils";
import { getAllData } from "~/server/functions/fosdem";
import { getBookmarks } from "~/server/functions/bookmarks";
import { generateCommonSEOTags } from "~/utils/seo-generator";

export const Route = createFileRoute("/search/")({
	component: SearchPage,
	head: () => ({
		meta: [
			...generateCommonSEOTags({
				title: "Search | FOSDEM PWA",
				description: "Search for events, tracks and rooms at FOSDEM PWA",
			})
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
		const fosdemData = await getAllData({ data: { year } });
		const serverBookmarks = await getBookmarks({
			data: { year, status: "favourited" },
		});
		return {
			year,
			q,
			track,
			time,
			type,
			fosdemData,
			serverBookmarks,
		};
	},
});

export default function SearchPage() {
	const { year, q, track, time, type, fosdemData, serverBookmarks } =
		Route.useLoaderData();
	const navigate = useNavigate();

	const { user } = useAuth();
	const { create: createBookmark } = useMutateBookmark({ year });
	const onCreateBookmark = async (bookmark: any) => {
		await createBookmark(bookmark);
	};

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
	const trackSelectOptions = [
		{ label: "All tracks", value: "all" },
		...trackOptions,
	];
	const timeSelectOptions = [
		{ label: "Any time", value: "all" },
		...timeSlotOptions.map((option) => ({ label: option, value: option })),
	];

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
			...buildSearchLink({
				year,
				q: normalizedQuery,
				track: nextTrack || undefined,
				time: nextTime || undefined,
				type: normalizedType,
			}),
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
						serverBookmarks={serverBookmarks}
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
						serverBookmarks={serverBookmarks}
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
		<PageShell>
			<PageHeader
				heading="Search"
				subtitle={`Results for "${query || "…"}"`}
				year={year}
			/>

			<div className="flex flex-wrap gap-4 items-end mb-6">
				<form
					className="flex flex-wrap items-end gap-4"
					method="GET"
					action="/search"
					onSubmit={handleSubmit}
				>
					<input type="hidden" name="year" value={year} />
					<div className="flex flex-col gap-1 min-w-[220px] max-w-sm">
						<Label htmlFor="search-query">Search the schedule</Label>
						<div className="flex gap-2">
							<Input
								id="search-query"
								name="q"
								placeholder="Events, tracks, rooms"
								value={localQuery}
								onChange={(e) => setLocalQuery(e.target.value)}
							/>
							<Button type="submit" size="sm">
								Search
							</Button>
						</div>
					</div>

					<div className="flex flex-col gap-1 min-w-[180px]">
						<Label htmlFor="track-filter">Track</Label>
						<Select
							id="track-filter"
							name="track"
							value={selectedTrack || "all"}
							onValueChange={handleTrackChange}
							disabled={!fosdemData}
							options={trackSelectOptions}
							className="min-w-[180px]"
						/>
					</div>

					<div className="flex flex-col gap-1 min-w-[160px]">
						<Label htmlFor="time-filter">Time slot</Label>
						<Select
							id="time-filter"
							name="time"
							value={selectedTime || "all"}
							onValueChange={handleTimeChange}
							disabled={!fosdemData}
							options={timeSelectOptions}
							className="min-w-[160px]"
						/>
					</div>
				</form>
			</div>
			<div className="flex flex-wrap gap-4 items-end mb-6">
				<div className="flex flex-col gap-1">
					<Label>Show</Label>
					<div className="flex flex-wrap gap-2 items-center">
						{typeFilters.map((filter) => (
							<Link
								key={filter.value}
								to="."
								search={(prev) => ({ ...prev, type: filter.value })}
								className={cn(
									"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 px-4 py-2",
									"no-underline hover:underline",
									selectedType === filter.value
										? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
										: "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
								)}
								aria-current={selectedType === filter.value ? "page" : undefined}
							>
								{filter.label}
							</Link>
						))}
						{hasActiveFilters && (
							<Link
								to="."
								search={{ year }}
								className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 no-underline hover:underline"
								aria-label="Clear search and filters"
							>
								<Icons.close className="h-4 w-4" />
								Clear
							</Link>
						)}
					</div>
				</div>
			</div>

			{!fosdemData ? (
				<EmptyStateCard
					title="Search unavailable"
					description="The schedule data is still loading. Please try again in a moment."
				/>
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
							<SectionStack>
								{visibleSections.map((section) => section.component())}
				</SectionStack>
			)}
		</PageShell>
	);
}
