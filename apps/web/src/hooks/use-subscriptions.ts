"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getSubscriptions } from "~/server/functions/subscriptions";

export function useSubscriptions() {
	const getSubscriptionsFromServer = useServerFn(getSubscriptions);

	const { data: subscriptions, isLoading } = useQuery({
		queryKey: ["subscriptions"],
		queryFn: async () => {
			const data = await getSubscriptionsFromServer();

			return data;
		},
	});

	return {
		subscriptions,
		loading: isLoading,
	};
}
