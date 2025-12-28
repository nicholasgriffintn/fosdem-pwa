"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getAllData } from "~/server/functions/fosdem";
import type { Conference } from "~/types/fosdem";
import { dataQueryKeys } from "~/lib/query-keys";

export function useFosdemData({
	year,
	initialData,
	enabled = true,
}: {
	year: number;
	initialData?: Conference;
	enabled?: boolean;
}) {
	const getData = useServerFn(getAllData);
	const shouldFetch = enabled && Number.isFinite(year) && !initialData;

	const {
		data: fosdemData,
		isLoading,
		error,
	} = useQuery({
		queryKey: dataQueryKeys.fosdem(year),
		queryFn: async () => {
			const data = await getData({
				data: {
					year,
				},
			});

			return data;
		},
		initialData,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		retry: 1,
		refetchOnWindowFocus: false,
		enabled: shouldFetch,
	});

	return {
		fosdemData,
		loading: isLoading,
		error,
	};
}
