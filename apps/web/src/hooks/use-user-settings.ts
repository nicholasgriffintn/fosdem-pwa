"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { changeBookmarksVisibility } from "~/server/functions/settings";

export function useUserSettings({ userId }: { userId: string }) {
	const queryClient = useQueryClient();
	const changeBookmarksVisibilityFromServer = useServerFn(
		changeBookmarksVisibility,
	);

	const setBookmarksVisibility = useMutation({
		mutationKey: ["changeBookmarksVisibility"],
		mutationFn: async ({ visibility }: { visibility: string }) => {
			const data = await changeBookmarksVisibilityFromServer({
				data: { visibility },
			});

			if (!data?.success) {
				throw new Error("Failed to set bookmarks visibility");
			}

			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
			queryClient.invalidateQueries({ queryKey: ["userBookmarks", userId] });
		},
	});

	return {
		setBookmarksVisibility: setBookmarksVisibility.mutate,
	};
}
