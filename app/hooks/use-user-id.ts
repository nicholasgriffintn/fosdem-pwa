"use client";

import { useQuery } from "@tanstack/react-query";

export function useUserId({
	userId,
}: {
	userId: string;
}) {
	const { data: user, isLoading } = useQuery({
		queryKey: ["profile", userId],
		queryFn: async () => {
			const response = await fetch(`/api/user/github/${userId}`);

			if (!response.ok) {
				throw new Error("Failed to fetch user data");
			}

			const data = await response.json();

			if (!data.user) {
				throw new Error("Not found");
			}

			return data.user;
		},
	});

	return {
		user,
		loading: isLoading,
	};
}
