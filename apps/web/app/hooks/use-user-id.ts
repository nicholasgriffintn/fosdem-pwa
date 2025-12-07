"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/start";

import { getUserDetails } from "~/server/functions/user";

export function useUserId({ userId }: { userId: string }) {
	const getUserDetailsFromServer = useServerFn(getUserDetails);

	const { data: user, isLoading } = useQuery({
		queryKey: ["profile", userId],
		queryFn: async () => {
			const user = await getUserDetailsFromServer({ data: { userId } });

			if (!user) {
				throw new Error("Not found");
			}

			return user;
		},
	});

	return {
		user,
		loading: isLoading,
	};
}
