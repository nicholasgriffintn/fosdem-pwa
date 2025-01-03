"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUserSettings({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const setBookmarksVisibility = useMutation({
    mutationFn: async ({ visibility }: { visibility: string }) => {
      await fetch("/api/user/bookmarks/visibility", {
        method: "POST",
        body: JSON.stringify({ visibility }),
      });
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
