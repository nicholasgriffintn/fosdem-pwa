"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/start";

import { getAllData } from "~/server/functions/fosdem";

export function useFosdemData({ year }: { year: number }) {
	const getData = useServerFn(getAllData);

	const { data: fosdemData, isLoading } = useQuery({
		queryKey: ["fosdem", "full", year],
		queryFn: async () => {
			const data = await getData({
				data: {
					year,
				},
			});

			return data;
		},
	});

	return {
		fosdemData,
		loading: isLoading,
	};
}
