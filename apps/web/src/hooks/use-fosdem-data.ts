"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getCoreData, getTracksData, getEventsData, getPersonsData } from "~/server/functions/fosdem";

export function useFosdemData({ year }: { year: number }) {
	const getCoreDataFn = useServerFn(getCoreData);
	const getTracksDataFn = useServerFn(getTracksData);
	const getEventsDataFn = useServerFn(getEventsData);
	const getPersonsDataFn = useServerFn(getPersonsData);

	const {
		data: fosdemData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["fosdem", "full", year],
		queryFn: async () => {
			const [coreData, tracksData, eventsData, personsData] = await Promise.all([
				getCoreDataFn({ data: { year } }),
				getTracksDataFn({ data: { year } }),
				getEventsDataFn({ data: { year } }),
				getPersonsDataFn({ data: { year } }),
			]);

			return {
				conference: coreData.conference,
				days: coreData.days,
				types: coreData.types,
				buildings: coreData.buildings,
				tracks: tracksData.tracks,
				rooms: tracksData.rooms,
				events: eventsData.events,
				persons: personsData.persons,
			};
		},
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		retry: 1,
		refetchOnWindowFocus: false,
		enabled: Number.isFinite(year),
	});

	return {
		fosdemData,
		loading: isLoading,
		error,
	};
}
