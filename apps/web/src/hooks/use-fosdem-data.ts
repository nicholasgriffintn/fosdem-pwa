"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";

import { getAllData } from "~/server/functions/fosdem";
import type { Conference } from "~/types/fosdem";
import { dataQueryKeys } from "~/lib/query-keys";
import { getLocalConference, saveLocalConference } from "~/lib/localStorage";
import { useOnlineStatus } from "~/hooks/use-online-status";

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
	const queryClient = useQueryClient();
	const isOnline = useOnlineStatus();
	const hydratedCacheRef = useRef(false);
	const shouldFetch =
		enabled && Number.isFinite(year) && (!initialData || initialDataIsPartial);

	useEffect(() => {
		hydratedCacheRef.current = false;
	}, [year]);

	useEffect(() => {
		let isMounted = true;
		if (!enabled || !Number.isFinite(year)) return;
		if (hydratedCacheRef.current) return;

		getLocalConference(year).then((cached) => {
			if (!isMounted) return;
			if (cached) {
				queryClient.setQueryData(dataQueryKeys.fosdem(year), cached);
			}
			hydratedCacheRef.current = true;
		});

		return () => {
			isMounted = false;
		};
	}, [enabled, queryClient, year]);

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
		enabled: shouldFetch && isOnline,
		onSuccess: (data) => {
			void saveLocalConference(year, data).catch((error) => {
				console.error("Failed to cache conference data:", error);
			});
		},
	});

	return {
		fosdemData,
		loading: isLoading,
		error,
	};
}
