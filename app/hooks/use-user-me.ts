"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/start";

import { getSession } from "~/server/functions/session";

export function useProfile() {
	const getSessionDataFromServer = useServerFn(getSession);

	const { data: user, isLoading } = useQuery({
		queryKey: ["profile", "me"],
		queryFn: async () => {
			const user = await getSessionDataFromServer();

			if (!user) {
				return null;
			}

			return user;
		},
	});

	return {
		user,
		loading: isLoading,
	};
}
