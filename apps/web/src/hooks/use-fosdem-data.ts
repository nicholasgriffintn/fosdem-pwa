"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getAllData } from "~/server/functions/fosdem";
import type { Conference } from "~/types/fosdem";
import { dataQueryKeys } from "~/lib/query-keys";

export function useFosdemData({
	year,
	initialData,
	initialDataIsPartial = false,
	enabled = true,
}: {
	year: number;
	initialData?: Conference;
	initialDataIsPartial?: boolean;
	enabled?: boolean;
}) {
	const getData = useServerFn(getAllData);
	const shouldFetch =
		enabled && Number.isFinite(year) && (!initialData || initialDataIsPartial);

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
		staleTime: 1000 * 60 * 5, // 5 minutes
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
