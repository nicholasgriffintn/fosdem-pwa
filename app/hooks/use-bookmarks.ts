"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useBookmarks({ year }: { year: number }) {
	const queryClient = useQueryClient();

	const { data: bookmarks, isLoading } = useQuery({
		queryKey: ["bookmarks", year],
		queryFn: async () => {
			const response = await fetch(`/api/bookmarks/${year}`);
			if (!response.ok) return null;
			const data = await response.json();
			return data;
		},
	});

	const create = useMutation({
		mutationFn: async ({
			type,
			slug,
			status,
		}: { type: string; slug: string; status: string }) => {
			const response = await fetch(`/api/bookmarks/${year}`, {
				method: "POST",
				body: JSON.stringify({ type, slug, status }),
			});
			if (!response.ok) throw new Error("Failed to create bookmark");
			const data = await response.json();
			return data;
		},
		onSuccess: () => {
			queryClient.setQueryData(["bookmarks", year], null);
		},
	});

	return {
		bookmarks,
		loading: isLoading,
		create: create.mutate,
	};
}
